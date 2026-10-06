/** Module 27: segmentation. floodFill (fixed / floating range, as cv2.floodFill), region growing against the running
 *  mean, k-means (k-means++ init, seeded), mean-shift filtering (as cv2.pyrMeanShiftFiltering at level 0), marker-based
 *  watershed (as cv2.watershed), SLIC superpixels, IoU. Images are interleaved 3-channel arrays (B, G, R as loaded by
 *  OpenCV, or any order as long as it is consistent). Unit-tested. */
import { rng } from "./denoise-ops.ts";
export { rng };

const cvRound = (v: number) => { const r = Math.round(v); return Math.abs(v % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r; };

/** cv2.floodFill mask: pixels connected to the seed whose every channel lies within [ref − lo, ref + up], where ref is the
 *  seed colour (fixed range) or the already-filled neighbour (floating range). */
export function floodFill(img: ArrayLike<number>, w: number, h: number, sx: number, sy: number, lo: number, up: number, fixed: boolean, conn: 4 | 8 = 4) {
  const m = new Uint8Array(w * h), s = sy * w + sx, q = [s];
  const seed = [img[3 * s], img[3 * s + 1], img[3 * s + 2]];
  const nb = conn === 4 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  m[s] = 1;
  while (q.length) {
    const p = q.pop()!, x = p % w, y = (p / w) | 0;
    for (const [dx, dy] of nb) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx; if (m[n]) continue;
      let ok = true;
      for (let c = 0; c < 3; c++) { const r = fixed ? seed[c] : img[3 * p + c], v = img[3 * n + c]; if (v < r - lo || v > r + up) { ok = false; break; } }
      if (ok) { m[n] = 1; q.push(n); }
    }
  }
  return m;
}

/** Region growing: breadth-first from the seed, accepting a 4-neighbour if its colour is within Euclidean distance T of
 *  the current region mean. */
export function growMean(img: ArrayLike<number>, w: number, h: number, sx: number, sy: number, T: number) {
  const m = new Uint8Array(w * h), s = sy * w + sx, q = [s]; let head = 0;
  const sum = [img[3 * s], img[3 * s + 1], img[3 * s + 2]]; let n = 1; m[s] = 1;
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (head < q.length) {
    const p = q[head++], x = p % w, y = (p / w) | 0;
    for (const [dx, dy] of nb) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = ny * w + nx; if (m[k]) continue;
      const d = Math.hypot(img[3 * k] - sum[0] / n, img[3 * k + 1] - sum[1] / n, img[3 * k + 2] - sum[2] / n);
      if (d <= T) { m[k] = 1; for (let c = 0; c < 3; c++) sum[c] += img[3 * k + c]; n++; q.push(k); }
    }
  }
  return m;
}

/** k-means with k-means++ initialisation (seeded). X: n × d row-major. Returns labels, centres, compactness per iteration. */
export function kmeans(X: Float64Array, n: number, d: number, K: number, iters: number, seed = 1) {
  const r = rng(seed), C = new Float64Array(K * d), lab = new Int32Array(n), dist = new Float64Array(n).fill(Infinity);
  const d2 = (i: number, k: number) => { let s = 0; for (let j = 0; j < d; j++) { const t = X[i * d + j] - C[k * d + j]; s += t * t; } return s; };
  let first = Math.floor(r() * n); for (let j = 0; j < d; j++) C[j] = X[first * d + j];
  for (let k = 1; k < K; k++) {
    let tot = 0; for (let i = 0; i < n; i++) { dist[i] = Math.min(dist[i], d2(i, k - 1)); tot += dist[i]; }
    let u = r() * tot, pick = n - 1; for (let i = 0; i < n; i++) { u -= dist[i]; if (u <= 0) { pick = i; break; } }
    for (let j = 0; j < d; j++) C[k * d + j] = X[pick * d + j];
  }
  const history: number[] = [];
  for (let it = 0; it < Math.max(1, iters); it++) {
    let comp = 0;
    for (let i = 0; i < n; i++) { let b = 0, bd = Infinity; for (let k = 0; k < K; k++) { const v = d2(i, k); if (v < bd) { bd = v; b = k; } } lab[i] = b; comp += bd; }
    history.push(comp);
    const S = new Float64Array(K * d), cnt = new Int32Array(K);
    for (let i = 0; i < n; i++) { cnt[lab[i]]++; for (let j = 0; j < d; j++) S[lab[i] * d + j] += X[i * d + j]; }
    for (let k = 0; k < K; k++) if (cnt[k]) for (let j = 0; j < d; j++) C[k * d + j] = S[k * d + j] / cnt[k];
  }
  return { labels: lab, centres: C, history };
}

/** cv2.pyrMeanShiftFiltering(img, sp, sr, maxLevel=0) with the default criteria (5 iterations, eps 1). */
export function meanShiftFilter(img: ArrayLike<number>, w: number, h: number, sp: number, sr: number, maxIter = 5, eps = 1) {
  const out = new Uint8Array(w * h * 3), isr2 = sr * sr, isp = cvRound(sp);
  for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
    let x0 = j, y0 = i, c0 = img[3 * (i * w + j)], c1 = img[3 * (i * w + j) + 1], c2 = img[3 * (i * w + j) + 2];
    for (let it = 0; it < maxIter; it++) {
      const minx = Math.max(x0 - isp, 0), miny = Math.max(y0 - isp, 0), maxx = Math.min(x0 + isp, w - 1), maxy = Math.min(y0 + isp, h - 1);
      let count = 0, s0 = 0, s1 = 0, s2 = 0, sx = 0, sy = 0;
      for (let y = miny; y <= maxy; y++) {
        let rc = 0;
        for (let x = minx; x <= maxx; x++) {
          const k = 3 * (y * w + x), t0 = img[k], t1 = img[k + 1], t2 = img[k + 2];
          if ((t0 - c0) ** 2 + (t1 - c1) ** 2 + (t2 - c2) ** 2 <= isr2) { s0 += t0; s1 += t1; s2 += t2; sx += x; rc++; }
        }
        count += rc; sy += y * rc;
      }
      if (count === 0) break;
      const ic = 1 / count, x1 = cvRound(sx * ic), y1 = cvRound(sy * ic);
      const n0 = cvRound(s0 * ic), n1 = cvRound(s1 * ic), n2 = cvRound(s2 * ic);
      const stop = (x0 === x1 && y0 === y1) || Math.abs(x1 - x0) + Math.abs(y1 - y0) + (n0 - c0) ** 2 + (n1 - c1) ** 2 + (n2 - c2) ** 2 <= eps;
      x0 = x1; y0 = y1; c0 = n0; c1 = n1; c2 = n2;
      if (stop) break;
    }
    const o = 3 * (i * w + j); out[o] = c0; out[o + 1] = c1; out[o + 2] = c2;
  }
  return out;
}

/** cv2.watershed(img, markers): markers > 0 are seeds, 0 unknown. Returns labels with −1 on watershed lines and on the
 *  image border, exactly as OpenCV (priority = max channel difference to the neighbour, FIFO per level). */
export function watershed(img: ArrayLike<number>, w: number, h: number, markers: ArrayLike<number>) {
  const WSHED = -1, INQ = -2, m = Int32Array.from(markers);
  const queues: number[][] = Array.from({ length: 256 }, () => []), heads = new Int32Array(256);
  const diff = (a: number, b: number) => Math.max(Math.abs(img[3 * a] - img[3 * b]), Math.abs(img[3 * a + 1] - img[3 * b + 1]), Math.abs(img[3 * a + 2] - img[3 * b + 2]));
  for (let x = 0; x < w; x++) { m[x] = WSHED; m[(h - 1) * w + x] = WSHED; }
  for (let y = 1; y < h - 1; y++) {
    m[y * w] = WSHED; m[y * w + w - 1] = WSHED;
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (m[p] < 0) m[p] = 0;
      if (m[p] === 0 && (m[p - 1] > 0 || m[p + 1] > 0 || m[p - w] > 0 || m[p + w] > 0)) {
        let idx = 256;
        if (m[p - 1] > 0) idx = diff(p, p - 1);
        if (m[p + 1] > 0) idx = Math.min(idx, diff(p, p + 1));
        if (m[p - w] > 0) idx = Math.min(idx, diff(p, p - w));
        if (m[p + w] > 0) idx = Math.min(idx, diff(p, p + w));
        queues[idx].push(p); m[p] = INQ;
      }
    }
  }
  let active = 0; while (active < 256 && heads[active] >= queues[active].length) active++;
  if (active === 256) return m;
  for (;;) {
    if (heads[active] >= queues[active].length) {
      let i = active + 1; while (i < 256 && heads[i] >= queues[i].length) i++;
      if (i === 256) break; active = i;
    }
    const p = queues[active][heads[active]++];
    let lab = 0;
    for (const t of [m[p - 1], m[p + 1], m[p - w], m[p + w]]) if (t > 0) { if (lab === 0) lab = t; else if (t !== lab) lab = WSHED; }
    m[p] = lab;
    if (lab === WSHED) continue;
    for (const q of [p - 1, p + 1, p - w, p + w]) if (m[q] === 0) { const t = diff(p, q); queues[t].push(q); active = Math.min(active, t); m[q] = INQ; }
  }
  return m;
}

/** SLIC superpixels (Achanta et al. 2012) on 3-channel features (use Lab): grid step S, compactness m, iterations; then
 *  orphan pieces are merged into a neighbour so every superpixel is connected. */
export function slic(img: ArrayLike<number>, w: number, h: number, S: number, mComp: number, iters = 10) {
  const cs: number[][] = [];
  for (let y = Math.floor(S / 2); y < h; y += S) for (let x = Math.floor(S / 2); x < w; x += S) { const k = 3 * (y * w + x); cs.push([img[k], img[k + 1], img[k + 2], x, y]); }
  const lab = new Int32Array(w * h).fill(-1), dist = new Float64Array(w * h), ratio = (mComp / S) ** 2;
  for (let it = 0; it < iters; it++) {
    dist.fill(Infinity);
    cs.forEach((c, k) => {
      for (let y = Math.max(0, Math.round(c[4] - S)); y < Math.min(h, Math.round(c[4] + S)); y++) for (let x = Math.max(0, Math.round(c[3] - S)); x < Math.min(w, Math.round(c[3] + S)); x++) {
        const p = y * w + x, q = 3 * p;
        const dc = (img[q] - c[0]) ** 2 + (img[q + 1] - c[1]) ** 2 + (img[q + 2] - c[2]) ** 2, ds = (x - c[3]) ** 2 + (y - c[4]) ** 2;
        const D = dc + ratio * ds; if (D < dist[p]) { dist[p] = D; lab[p] = k; }
      }
    });
    const acc = cs.map(() => [0, 0, 0, 0, 0, 0]);
    for (let p = 0; p < w * h; p++) { const k = lab[p]; if (k < 0) continue; const a = acc[k], q = 3 * p; a[0] += img[q]; a[1] += img[q + 1]; a[2] += img[q + 2]; a[3] += p % w; a[4] += (p / w) | 0; a[5]++; }
    acc.forEach((a, k) => { if (a[5]) cs[k] = [a[0] / a[5], a[1] / a[5], a[2] / a[5], a[3] / a[5], a[4] / a[5]]; });
  }
  // connectivity: relabel 4-connected pieces; pieces smaller than S²/4 join the previous adjacent piece
  const out = new Int32Array(w * h).fill(-1), minSize = Math.max(1, (S * S) >> 2);
  let next = 0;
  for (let s = 0; s < w * h; s++) {
    if (out[s] >= 0) continue;
    let adj = -1; const sx = s % w, sy = (s / w) | 0;
    for (const [dx, dy] of [[-1, 0], [0, -1], [1, 0], [0, 1]]) { const x = sx + dx, y = sy + dy; if (x >= 0 && y >= 0 && x < w && y < h && out[y * w + x] >= 0) adj = out[y * w + x]; }
    const piece = [s]; out[s] = next;
    for (let i = 0; i < piece.length; i++) {
      const p = piece[i], x = p % w, y = (p / w) | 0;
      for (const [dx, dy] of [[-1, 0], [0, -1], [1, 0], [0, 1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const q = ny * w + nx; if (out[q] < 0 && lab[q] === lab[s]) { out[q] = next; piece.push(q); } }
    }
    if (piece.length < minSize && adj >= 0) for (const p of piece) out[p] = adj; else next++;
  }
  return { labels: out, n: next };
}

/** BGR (0–255) → CIE L*a*b* scaled like OpenCV's 8-bit Lab (L·255/100, a+128, b+128). */
export function bgrToLab8(img: ArrayLike<number>, n: number) {
  const out = new Float64Array(3 * n);
  const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  for (let i = 0; i < n; i++) {
    const b = lin(img[3 * i]), g = lin(img[3 * i + 1]), r = lin(img[3 * i + 2]);
    const X = (0.412453 * r + 0.35758 * g + 0.180423 * b) / 0.950456, Y = 0.212671 * r + 0.71516 * g + 0.072169 * b, Z = (0.019334 * r + 0.119193 * g + 0.950227 * b) / 1.088754;
    const L = Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
    out[3 * i] = (L * 255) / 100; out[3 * i + 1] = 500 * (f(X) - f(Y)) + 128; out[3 * i + 2] = 200 * (f(Y) - f(Z)) + 128;
  }
  return out;
}

/** Intersection over union of two masks (non-zero = in). */
export function iou(a: ArrayLike<number>, b: ArrayLike<number>) {
  let i = 0, u = 0; for (let k = 0; k < a.length; k++) { const x = !!a[k], y = !!b[k]; if (x && y) i++; if (x || y) u++; }
  return u ? i / u : 1;
}
