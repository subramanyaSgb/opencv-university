/** Module 21: image registration. Euclidean warps, phase correlation (FFT) and ECC alignment (Evangelidis & Psarakis), on grey float images. */
import { fft2 } from "./restore-ops.ts";

export type Warp = { theta: number; tx: number; ty: number }; // template (x, y) → input (cos·x − sin·y + tx, sin·x + cos·y + ty)

/** Bilinear sample with a validity flag (outside → NaN). */
export function sample(img: ArrayLike<number>, w: number, h: number, x: number, y: number) {
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return NaN;
  const x0 = Math.min(Math.floor(x), w - 2), y0 = Math.min(Math.floor(y), h - 2), fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return (1 - fy) * ((1 - fx) * img[i] + fx * img[i + 1]) + fy * ((1 - fx) * img[i + w] + fx * img[i + w + 1]);
}

/** Output(x, y) = input(W(x, y)): the input image brought into the template's frame. NaN where W leaves the input. */
export function warpBack(input: ArrayLike<number>, w: number, h: number, p: Warp) {
  const c = Math.cos(p.theta), s = Math.sin(p.theta), out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = sample(input, w, h, c * x - s * y + p.tx, s * x + c * y + p.ty);
  return out;
}

/** Make a moved copy: input(W(x, y)) = template(x, y), i.e. input = template seen through the inverse warp. Outside → fill (NaN = replicate the edge). */
export function moveImage(tpl: ArrayLike<number>, w: number, h: number, p: Warp, fill = 0) {
  const c = Math.cos(p.theta), s = Math.sin(p.theta), out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x - p.tx, Y = y - p.ty; // inverse rotation; outside the template: replicate the nearest edge (fill = NaN) or a constant
    const u = c * X + s * Y, v0 = -s * X + c * Y, v = sample(tpl, w, h, u, v0);
    out[y * w + x] = !Number.isNaN(v) ? v : Number.isNaN(fill) ? sample(tpl, w, h, Math.min(w - 1, Math.max(0, u)), Math.min(h - 1, Math.max(0, v0))) : fill;
  }
  return out;
}

/** Phase correlation of two equally sized images (powers of two). Returns the shift of b relative to a (b(x) ≈ a(x − d)), the peak value and the correlation surface. */
export function phaseCorrelate(a: ArrayLike<number>, b: ArrayLike<number>, W: number, H: number) {
  const ar = Float64Array.from(a), ai = new Float64Array(W * H), br = Float64Array.from(b), bi = new Float64Array(W * H);
  fft2(ar, ai, W, H); fft2(br, bi, W, H);
  for (let i = 0; i < W * H; i++) {
    const re = br[i] * ar[i] + bi[i] * ai[i], im = bi[i] * ar[i] - br[i] * ai[i], m = Math.hypot(re, im) || 1; // B · conj(A) / |…|
    ar[i] = re / m; ai[i] = im / m;
  }
  fft2(ar, ai, W, H, true);
  let best = 0; for (let i = 1; i < W * H; i++) if (ar[i] > ar[best]) best = i;
  const by = Math.floor(best / W), bx = best % W;
  let sx = 0, sy = 0, sw = 0; // 3 × 3 weighted centroid for sub-pixel accuracy
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = Math.max(0, ar[((by + dy + H) % H) * W + ((bx + dx + W) % W)]); sx += v * dx; sy += v * dy; sw += v; }
  const wrap = (v: number, n: number) => (v > n / 2 ? v - n : v);
  return { dx: wrap(bx, W) + sx / sw, dy: wrap(by, H) + sy / sw, peak: ar[best], surface: ar };
}

function gauss5(img: Float64Array, w: number, h: number) {
  const k = [1, 4, 6, 4, 1], r = (i: number, n: number) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i), t = new Float64Array(w * h), o = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let d = -2; d <= 2; d++) s += k[d + 2] * img[y * w + r(x + d, w)]; t[y * w + x] = s / 16; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let d = -2; d <= 2; d++) s += k[d + 2] * t[r(y + d, h) * w + x]; o[y * w + x] = s / 16; }
  return o;
}

function solve3(A: number[][], b: number[]) {
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[3] / M[i][i]);
}

/** ECC alignment with a Euclidean warp (rotation + translation). Returns the warp, the correlation coefficient per iteration. */
export function eccEuclidean(tpl: ArrayLike<number>, input: ArrayLike<number>, w: number, h: number, init: Warp, iters = 50, eps = 1e-5) {
  const T = gauss5(Float64Array.from(tpl), w, h), I = gauss5(Float64Array.from(input), w, h);
  const gx = new Float64Array(w * h), gy = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    gx[i] = (I[y * w + Math.min(w - 1, x + 1)] - I[y * w + Math.max(0, x - 1)]) / 2;
    gy[i] = (I[Math.min(h - 1, y + 1) * w + x] - I[Math.max(0, y - 1) * w + x]) / 2;
  }
  const p = { ...init }, rho: number[] = [];
  for (let it = 0; it < iters; it++) {
    const c = Math.cos(p.theta), s = Math.sin(p.theta);
    const idx: number[] = [], iw: number[] = [], tv: number[] = [], G: number[][] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = c * x - s * y + p.tx, Y = s * x + c * y + p.ty, v = sample(I, w, h, X, Y);
      if (Number.isNaN(v)) continue;
      const ix = sample(gx, w, h, X, Y), iy = sample(gy, w, h, X, Y);
      idx.push(y * w + x); iw.push(v); tv.push(T[y * w + x]);
      G.push([ix * (-s * x - c * y) + iy * (c * x - s * y), ix, iy]);
    }
    const n = iw.length, mi = iw.reduce((a, b) => a + b, 0) / n, mt = tv.reduce((a, b) => a + b, 0) / n;
    for (let k = 0; k < n; k++) { iw[k] -= mi; tv[k] -= mt; }
    const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], gi = [0, 0, 0], gt = [0, 0, 0];
    let ii = 0, tt = 0, ti = 0;
    for (let k = 0; k < n; k++) {
      const g = G[k];
      for (let a = 0; a < 3; a++) { gi[a] += g[a] * iw[k]; gt[a] += g[a] * tv[k]; for (let b = 0; b < 3; b++) H[a][b] += g[a] * g[b]; }
      ii += iw[k] * iw[k]; tt += tv[k] * tv[k]; ti += tv[k] * iw[k];
    }
    rho.push(ti / Math.sqrt(ii * tt));
    const Hgi = solve3(H, gi), Hgt = solve3(H, gt);
    const ln = ii - gi.reduce((a, v, k) => a + v * Hgi[k], 0), ld = ti - gi.reduce((a, v, k) => a + v * Hgt[k], 0);
    const lambda = ld > 0 ? ln / ld : 1;
    const e = [0, 0, 0];
    for (let k = 0; k < n; k++) { const err = lambda * tv[k] - iw[k]; for (let a = 0; a < 3; a++) e[a] += G[k][a] * err; }
    const d = solve3(H, e);
    p.theta += d[0]; p.tx += d[1]; p.ty += d[2];
    if (Math.hypot(d[0] * 100, d[1], d[2]) < eps) break;
  }
  return { warp: p, rho };
}
