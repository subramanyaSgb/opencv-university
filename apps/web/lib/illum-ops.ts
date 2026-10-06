/** Chapter 15.3: background (illumination) estimation and correction by division or subtraction. */
import { gaussian } from "./pipe-ops.ts";

/** Separable running max or min over a k × k rectangle (border: replicate), like cv2.dilate / cv2.erode with MORPH_RECT. */
function rankFilter(img: ArrayLike<number>, w: number, h: number, k: number, max: boolean) {
  const r = Math.floor(k / 2), pick = max ? Math.max : Math.min;
  const tmp = new Float64Array(w * h), out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = img[y * w + x]; for (let d = -r; d <= r; d++) v = pick(v, img[y * w + Math.min(w - 1, Math.max(0, x + d))]); tmp[y * w + x] = v; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = tmp[y * w + x]; for (let d = -r; d <= r; d++) v = pick(v, tmp[Math.min(h - 1, Math.max(0, y + d)) * w + x]); out[y * w + x] = v; }
  return out;
}

/** Morphological closing (max then min): removes dark details smaller than k, keeps the bright background. */
export const closing = (img: ArrayLike<number>, w: number, h: number, k: number) => rankFilter(rankFilter(img, w, h, k, true), w, h, k, false);

/** Least-squares fit of a degree-2 surface a + bx + cy + dx² + exy + fy² to the pixels where use[i] is true. */
export function polyFit(img: ArrayLike<number>, w: number, h: number, use: (i: number) => boolean) {
  const M = Array.from({ length: 6 }, () => new Array(6).fill(0)), v = new Array(6).fill(0);
  const basis = (x: number, y: number) => [1, x, y, x * x, x * y, y * y];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const i = yy * w + xx; if (!use(i)) continue;
    const b = basis(xx / (w - 1), yy / (h - 1));
    for (let p = 0; p < 6; p++) { v[p] += b[p] * img[i]; for (let q = 0; q < 6; q++) M[p][q] += b[p] * b[q]; }
  }
  for (let c = 0; c < 6; c++) { // Gauss–Jordan elimination with partial pivoting
    let piv = c; for (let r = c + 1; r < 6; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; [v[c], v[piv]] = [v[piv], v[c]];
    for (let r = 0; r < 6; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let q = c; q < 6; q++) M[r][q] -= f * M[c][q]; v[r] -= f * v[c]; }
  }
  const coef = v.map((x, i) => x / M[i][i]), out = new Float64Array(w * h);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const b = basis(xx / (w - 1), yy / (h - 1)); out[yy * w + xx] = b.reduce((a, bi, i) => a + bi * coef[i], 0); }
  return out;
}

export type BgMethod = "none" | "blur" | "closing" | "poly" | "white";

export function estimate(img: Uint8Array, w: number, h: number, m: BgMethod, p: { sigma?: number; k?: number; white?: ArrayLike<number> }) {
  if (m === "blur") return gaussian(img, w, h, p.sigma ?? 15);
  if (m === "closing") { const k = p.k ?? 15; return gaussian(closing(img, w, h, k), w, h, Math.max(1, k / 3)); }
  if (m === "poly") {
    const sorted = Array.from(img).sort((a, b) => a - b), t = sorted[Math.floor(0.3 * sorted.length)];
    return polyFit(img, w, h, (i) => img[i] > t);
  }
  if (m === "white") return gaussian(p.white!, w, h, 2);
  let s = 0; for (const v of img) s += v; return new Float64Array(img.length).fill(s / img.length);
}

/** Corrected image: divide (multiplicative shading) or subtract (additive), rescaled to the background's mean. */
export function correct(img: ArrayLike<number>, bg: ArrayLike<number>, mode: "divide" | "subtract") {
  let m = 0; for (let i = 0; i < bg.length; i++) m += bg[i]; m /= bg.length;
  return Uint8Array.from(img as ArrayLike<number>, (v, i) => Math.max(0, Math.min(255, Math.round(mode === "divide" ? (v / Math.max(bg[i], 1)) * m : v - bg[i] + m))));
}
