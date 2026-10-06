/** Chapters 12.5 and 12.6: 2D hue–saturation histograms and histogram back-projection, as cv2.calcHist / cv2.calcBackProject do them. */
import { bgrToHsv8 } from "./hsv-ops.ts";

export type HistSpec = { hBins: number; sBins: number }; // sBins = 1 means a hue-only (1D) histogram

/** OpenCV uniform bin index: floor(v * bins / range), range H 0..180, S 0..256. */
export const hBin = (h: number, bins: number) => Math.min(bins - 1, Math.floor((h * bins) / 180));
export const sBin = (s: number, bins: number) => Math.min(bins - 1, Math.floor((s * bins) / 256));

/** 8-bit OpenCV HSV of every pixel of a packed B, G, R image. */
export function toHsv(bgr: ArrayLike<number>) {
  const n = bgr.length / 3, h = new Uint8Array(n), s = new Uint8Array(n), v = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const t = bgrToHsv8([bgr[3 * i], bgr[3 * i + 1], bgr[3 * i + 2]]); h[i] = t[0]; s[i] = t[1]; v[i] = t[2]; }
  return { h, s, v };
}

/** Counts per (hue bin, saturation bin) over the pixels listed in idx (all pixels if idx is omitted). Row-major: [hb * sBins + sb]. */
export function hsHist(hsv: { h: Uint8Array; s: Uint8Array }, { hBins, sBins }: HistSpec, idx?: ArrayLike<number>) {
  const out = new Float64Array(hBins * sBins);
  const n = idx ? idx.length : hsv.h.length;
  for (let k = 0; k < n; k++) { const i = idx ? idx[k] : k; out[hBin(hsv.h[i], hBins) * sBins + sBin(hsv.s[i], sBins)]++; }
  return out;
}

/** cv2.normalize(hist, hist, 0, 255, cv2.NORM_MINMAX). */
export function normalizeMinMax(hist: Float64Array, hi = 255) {
  let mn = Infinity, mx = -Infinity;
  for (const v of hist) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  const k = mx > mn ? hi / (mx - mn) : 0;
  return hist.map((v) => (v - mn) * k);
}

/** cv2.calcBackProject with scale 1: each pixel gets the (rounded, saturated) value of its histogram bin. */
export function backProject(hsv: { h: Uint8Array; s: Uint8Array }, hist: Float64Array, { hBins, sBins }: HistSpec) {
  const n = hsv.h.length, out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.max(0, Math.min(255, Math.round(hist[hBin(hsv.h[i], hBins) * sBins + sBin(hsv.s[i], sBins)])));
  return out;
}

/** Pixel indices of a square patch (centre cx, cy, half-size r) in an image of width w. */
export function patch(w: number, cx: number, cy: number, r: number) {
  const idx: number[] = [];
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) idx.push(y * w + x);
  return idx;
}
