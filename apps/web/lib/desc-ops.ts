/** Module 34: descriptor matching and homographies. Brute-force L2 / Hamming matching with the two nearest
 *  neighbours (as cv2.BFMatcher.knnMatch k = 2), the ratio test, cross-checking, a normalised DLT homography,
 *  RANSAC with a seeded random generator, and perspective warping for overlays and panoramas. */

export type Norm = "L2" | "HAMMING";
export type Match = { q: number; t: number; d: number; d2: number };

export const hexBytes = (h: string) => { const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(2 * i, 2), 16); return b; };
const POP = new Uint8Array(256).map((_, i) => { let c = 0, v = i; while (v) { c += v & 1; v >>= 1; } return c; });

export function dist(a: Uint8Array, b: Uint8Array, norm: Norm) {
  let s = 0;
  if (norm === "HAMMING") { for (let i = 0; i < a.length; i++) s += POP[a[i] ^ b[i]]; return s; }
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

/** For each query descriptor: the nearest and second-nearest train descriptor (first index wins ties). */
export function knn2(A: Uint8Array[], B: Uint8Array[], norm: Norm): Match[] {
  return A.map((a, q) => {
    let t = -1, d = Infinity, d2 = Infinity;
    for (let j = 0; j < B.length; j++) {
      const v = dist(a, B[j], norm);
      if (v < d) { d2 = d; d = v; t = j; } else if (v < d2) d2 = v;
    }
    return { q, t, d, d2 };
  });
}

/** Lowe's ratio test: keep matches whose best distance is below ratio × second-best. */
export const ratioTest = (m: Match[], ratio: number) => m.filter((x) => x.d < ratio * x.d2);

/** Cross-check: keep q → t only if t's nearest neighbour in A is q. */
export function crossCheck(ab: Match[], ba: Match[]) { return ab.filter((m) => ba[m.t]?.t === m.q); }

export type H3 = number[];
export const applyH = (H: H3, x: number, y: number): [number, number] => { const z = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / z, (H[3] * x + H[4] * y + H[5]) / z]; };
export function inv3(m: H3): H3 {
  const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
}
export const mul3 = (A: H3, B: H3): H3 => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => A[3 * r] * B[c] + A[3 * r + 1] * B[3 + c] + A[3 * r + 2] * B[6 + c]));

/** Eigenvector of the smallest eigenvalue of a symmetric n × n matrix (cyclic Jacobi). */
function smallestEigvec(S: number[][]) {
  const n = S.length, a = S.map((r) => r.slice()), v: number[][] = a.map((_, i) => a.map((__, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = v[k][p], y = v[k][q]; v[k][p] = c * x - s * y; v[k][q] = s * x + c * y; }
    }
  }
  let m = 0; for (let i = 1; i < n; i++) if (a[i][i] < a[m][m]) m = i;
  return v.map((r) => r[m]);
}

/** Hartley normalisation: centroid to the origin, mean distance √2. Returns T (3 × 3) and the normalised points. */
function normalise(p: [number, number][]) {
  const n = p.length, cx = p.reduce((s, q) => s + q[0], 0) / n, cy = p.reduce((s, q) => s + q[1], 0) / n;
  const md = p.reduce((s, q) => s + Math.hypot(q[0] - cx, q[1] - cy), 0) / n || 1, k = Math.SQRT2 / md;
  return { T: [k, 0, -k * cx, 0, k, -k * cy, 0, 0, 1], q: p.map(([x, y]) => [k * (x - cx), k * (y - cy)] as [number, number]) };
}

/** Least-squares homography dst ≈ H·src from ≥ 4 pairs (normalised DLT), scaled so H[8] = 1. */
export function findH(src: [number, number][], dst: [number, number][]): H3 | null {
  if (src.length < 4) return null;
  const S = normalise(src), D = normalise(dst), M = Array.from({ length: 9 }, () => new Array(9).fill(0));
  for (let i = 0; i < src.length; i++) {
    const [x, y] = S.q[i], [u, v] = D.q[i];
    const r1 = [-x, -y, -1, 0, 0, 0, u * x, u * y, u], r2 = [0, 0, 0, -x, -y, -1, v * x, v * y, v];
    for (const r of [r1, r2]) for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) M[a][b] += r[a] * r[b];
  }
  const h = smallestEigvec(M), H = mul3(mul3(inv3(D.T), h), S.T);
  if (!isFinite(H[8]) || Math.abs(H[8]) < 1e-12) return null;
  return H.map((x) => x / H[8]);
}

/** Small seeded generator (mulberry32) so RANSAC runs are reproducible in the lab. */
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** RANSAC: sample 4 pairs, fit H, count pairs with reprojection error ≤ thr; keep the best, refit on its inliers. */
export function ransacH(src: [number, number][], dst: [number, number][], thr: number, iters: number, seed = 1) {
  const n = src.length, R = rng(seed);
  let best: boolean[] = [], bestN = -1;
  if (n < 4) return { H: null as H3 | null, inliers: new Array(n).fill(false), count: 0 };
  for (let it = 0; it < iters; it++) {
    const idx = new Set<number>(); while (idx.size < 4) idx.add(Math.floor(R() * n));
    const s = [...idx], H = findH(s.map((i) => src[i]), s.map((i) => dst[i])); if (!H) continue;
    const inl = src.map((p, i) => { const [x, y] = applyH(H, p[0], p[1]); return Math.hypot(x - dst[i][0], y - dst[i][1]) <= thr; });
    const c = inl.filter(Boolean).length; if (c > bestN) { bestN = c; best = inl; }
  }
  const H = bestN >= 4 ? findH(src.filter((_, i) => best[i]), dst.filter((_, i) => best[i])) : null;
  const inliers = H ? src.map((p, i) => { const [x, y] = applyH(H, p[0], p[1]); return Math.hypot(x - dst[i][0], y - dst[i][1]) <= thr; }) : best;
  return { H, inliers, count: inliers.filter(Boolean).length };
}

/** RANSAC iterations needed for confidence p with inlier ratio w and sample size s. */
export const ransacIters = (p: number, w: number, s = 4) => Math.ceil(Math.log(1 - p) / Math.log(1 - w ** s));

/** Bilinear sample of a grey image (NaN outside). */
export function sample(img: ArrayLike<number>, w: number, h: number, x: number, y: number) {
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return NaN;
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = x - x0, fy = y - y0;
  return (img[y0 * w + x0] * (1 - fx) + img[y0 * w + x1] * fx) * (1 - fy) + (img[y1 * w + x0] * (1 - fx) + img[y1 * w + x1] * fx) * fy;
}

/** Warp a source image into an ow × oh canvas with H mapping source → canvas (inverse mapping, bilinear; NaN = empty). */
export function warp(src: ArrayLike<number>, w: number, h: number, H: H3, ow: number, oh: number) {
  const Hi = inv3(H), out = new Float64Array(ow * oh);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { const [u, v] = applyH(Hi, x, y); out[y * ow + x] = sample(src, w, h, u, v); }
  return out;
}

/** Mean corner error (px) between two homographies over a w × h image's corners. */
export function cornerError(H1: H3, H2: H3, w: number, h: number) {
  const c: [number, number][] = [[0, 0], [w, 0], [w, h], [0, h]];
  return c.reduce((s, [x, y]) => { const a = applyH(H1, x, y), b = applyH(H2, x, y); return s + Math.hypot(a[0] - b[0], a[1] - b[1]); }, 0) / 4;
}

/** POSTER_H of generate_samples.py: sample-poster-b = H · sample-poster. */
export const POSTER_H: H3 = (() => { const c = 0.75 * Math.cos((25 * Math.PI) / 180), s = 0.75 * Math.sin((25 * Math.PI) / 180); return [c, -s, 95, s, c, -10, 0.0004, -0.0003, 1]; })();
