/** Module 33: interest points. Structure tensor, Harris response and minimum eigenvalue exactly as cv2.cornerHarris /
 *  cv2.cornerMinEigenVal (Sobel 3 × 3, unnormalised box sum, BORDER_REFLECT_101, OpenCV's scaling for 8-bit input),
 *  cv2.goodFeaturesToTrack, and FAST-9 (cv2.FastFeatureDetector TYPE_9_16, with its score and non-max suppression). */
import { gradients } from "./edge-ops.ts";

const r101 = (i: number, n: number) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i);
export type Pt = { x: number; y: number; score?: number };

/** Unnormalised box sum with OpenCV's default anchor (k / 2) and reflect-101 border. */
function boxSum(a: Float64Array, w: number, h: number, k: number) {
  const an = Math.floor(k / 2), t = new Float64Array(w * h), o = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -an; i < k - an; i++) s += a[y * w + r101(x + i, w)]; t[y * w + x] = s; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -an; i < k - an; i++) s += t[r101(y + i, h) * w + x]; o[y * w + x] = s; }
  return o;
}

/** Structure tensor sums A = Σgx², B = Σgx·gy, C = Σgy² over a block × block window, scaled as OpenCV does for 8-bit images. */
export function tensor(img: ArrayLike<number>, w: number, h: number, block: number) {
  const { gx, gy } = gradients(img, w, h, "sobel"), sc = 1 / (4 * block * 255);
  const xx = new Float64Array(w * h), xy = new Float64Array(w * h), yy = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) { const a = gx[i] * sc, b = gy[i] * sc; xx[i] = a * a; xy[i] = a * b; yy[i] = b * b; }
  return { A: boxSum(xx, w, h, block), B: boxSum(xy, w, h, block), C: boxSum(yy, w, h, block) };
}

/** R = det(M) − k·trace(M)² (cv2.cornerHarris(img, block, 3, k)). */
export function harris(img: ArrayLike<number>, w: number, h: number, block = 3, k = 0.04) {
  const { A, B, C } = tensor(img, w, h, block);
  return A.map((a, i) => a * C[i] - B[i] * B[i] - k * (a + C[i]) ** 2);
}

/** Smaller eigenvalue of M (cv2.cornerMinEigenVal(img, block, 3)). */
export function minEig(img: ArrayLike<number>, w: number, h: number, block = 3) {
  const { A, B, C } = tensor(img, w, h, block);
  return A.map((a0, i) => { const a = a0 * 0.5, c = C[i] * 0.5; return a + c - Math.sqrt((a - c) ** 2 + B[i] * B[i]); });
}

/** Both eigenvalues of [[A, B], [B, C]], smaller first. */
export function eig2(A: number, B: number, C: number): [number, number] {
  const m = (A + C) / 2, r = Math.sqrt(((A - C) / 2) ** 2 + B * B);
  return [m - r, m + r];
}

/** Pixels with value > thr that equal the maximum of their 3 × 3 neighbourhood (inside the image). */
export function localMax(R: ArrayLike<number>, w: number, h: number, thr: number): Pt[] {
  const out: Pt[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = R[y * w + x]; if (!(v > thr)) continue;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      if (R[yy * w + xx] > v) { ok = false; break; }
    }
    if (ok) out.push({ x, y, score: v });
  }
  return out;
}

/** cv2.goodFeaturesToTrack: threshold at quality·max, 3 × 3 local maxima (1-pixel border skipped), strongest first,
 *  greedy minimum distance, at most maxCorners (0 = all). */
export function goodFeatures(img: ArrayLike<number>, w: number, h: number, o: { maxCorners?: number; quality?: number; minDistance?: number; block?: number; useHarris?: boolean; k?: number } = {}): Pt[] {
  const { maxCorners = 0, quality = 0.01, minDistance = 10, block = 3, useHarris = false, k = 0.04 } = o;
  const e = Float64Array.from(useHarris ? harris(img, w, h, block, k) : minEig(img, w, h, block), Math.fround);
  let mx = -Infinity; for (const v of e) if (v > mx) mx = v;
  const thr = mx * quality; for (let i = 0; i < e.length; i++) if (!(e[i] > thr)) e[i] = 0;
  const cand: { v: number; i: number }[] = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const v = e[y * w + x]; if (v === 0) continue;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (e[(y + dy) * w + x + dx] > v) { ok = false; break; }
    if (ok) cand.push({ v, i: y * w + x });
  }
  cand.sort((a, b) => b.v - a.v || b.i - a.i);
  const out: Pt[] = [], md2 = minDistance * minDistance;
  for (const c of cand) {
    const x = c.i % w, y = (c.i - x) / w;
    if (out.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 >= md2)) out.push({ x, y, score: c.v });
    if (maxCorners > 0 && out.length >= maxCorners) break;
  }
  return out;
}

/** The 16 pixels of the Bresenham circle of radius 3, clockwise from the top. */
export const CIRCLE: [number, number][] = [[0, -3], [1, -3], [2, -2], [3, -1], [3, 0], [3, 1], [2, 2], [1, 3], [0, 3], [-1, 3], [-2, 2], [-3, 1], [-3, 0], [-3, -1], [-2, -2], [-1, -3]];

/** Segment test: ≥ 9 contiguous circle pixels all brighter than p + t or all darker than p − t. */
export function segmentTest(img: ArrayLike<number>, w: number, x: number, y: number, t: number) {
  const v = img[y * w + x], q = CIRCLE.map(([dx, dy]) => img[(y + dy) * w + x + dx]);
  for (const s of [1, -1]) {
    let run = 0;
    for (let i = 0; i < 32; i++) { if (s * (q[i % 16] - v) > t) { if (++run >= 9) return s; } else run = 0; }
  }
  return 0;
}

/** FAST score as OpenCV: the largest threshold at which the pixel is still a corner. */
export function fastScore(img: ArrayLike<number>, w: number, x: number, y: number) {
  const v = img[y * w + x], d = CIRCLE.map(([dx, dy]) => img[(y + dy) * w + x + dx] - v);
  let best = -1;
  for (const s of [1, -1]) for (let i = 0; i < 16; i++) {
    let m = Infinity; for (let j = 0; j < 9; j++) m = Math.min(m, s * d[(i + j) % 16]);
    best = Math.max(best, m - 1);
  }
  return best;
}

/** cv2.FastFeatureDetector_create(t, nonmax) (TYPE_9_16). */
export function fast(img: ArrayLike<number>, w: number, h: number, t: number, nonmax = true): Pt[] {
  const S = new Float64Array(w * h), pts: Pt[] = [];
  for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) if (segmentTest(img, w, x, y, t)) S[y * w + x] = nonmax ? fastScore(img, w, x, y) : 1;
  for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
    const v = S[y * w + x]; if (!v) continue;
    if (nonmax) {
      if (y < 4 || x < 4 || y >= h - 4 || x >= w - 4) continue;
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !(v > S[(y + dy) * w + x + dx])) { ok = false; break; }
      if (!ok) continue;
    }
    pts.push({ x, y, score: nonmax ? v : 0 });
  }
  return pts;
}

/** Sum of squared differences between the (2r+1)² window at (x, y) and the same window shifted by (u, v), for |u|, |v| ≤ s. */
export function ssdSurface(img: ArrayLike<number>, w: number, x: number, y: number, r: number, s: number) {
  const n = 2 * s + 1, E = new Float64Array(n * n);
  for (let v = -s; v <= s; v++) for (let u = -s; u <= s; u++) {
    let e = 0;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) e += (img[(y + v + j) * w + x + u + i] - img[(y + j) * w + x + i]) ** 2;
    E[(v + s) * n + u + s] = e;
  }
  return E;
}

/** Apply a 3 × 3 homography (row-major) to a point. */
export const applyH = (H: number[], x: number, y: number): [number, number] => {
  const z = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / z, (H[3] * x + H[4] * y + H[5]) / z];
};

/** Repeatability: of the points of view A that land inside `inside` after mapping by H, how many have a point of view B within tol pixels. */
export function repeatability(pa: Pt[], pb: Pt[], H: number[], tol: number, inside: (x: number, y: number) => boolean) {
  let n = 0, hit = 0;
  for (const p of pa) {
    const [x, y] = applyH(H, p.x, p.y); if (!inside(x, y)) continue;
    n++; if (pb.some((q) => (q.x - x) ** 2 + (q.y - y) ** 2 <= tol * tol)) hit++;
  }
  return { n, hit, rate: n ? hit / n : 0 };
}

/** FEAT_H of generate_samples.py: view B = H · view A (rotation 15°, scale 0.9, slight perspective). */
export const FEAT_H = (() => { const c = 0.9 * Math.cos(Math.PI / 12), s = 0.9 * Math.sin(Math.PI / 12); return [c, -s, 40, s, c, -25, 0.0002, 0.0001, 1]; })();
