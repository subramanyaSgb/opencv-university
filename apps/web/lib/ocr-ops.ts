/** Chapter 15.4: rotation, binarisation for OCR, projection profiles and deskew by profile sharpness. */
import { estimate, correct } from "./illum-ops.ts";
import { histogram, otsu } from "./thresh-ops.ts";

/** Rotate by deg (counter-clockwise, like cv2.getRotationMatrix2D) about the centre, bilinear; outside pixels take `fill`, or the nearest edge pixel if fill is null. */
export function rotate(img: ArrayLike<number>, w: number, h: number, deg: number, fill: number | null) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), cx = w / 2, cy = h / 2, out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // inverse map: destination (x, y) -> source
    const dx = x - cx, dy = y - cy, sx = c * dx - s * dy + cx, sy = s * dx + c * dy + cy;
    const inside = sx >= 0 && sy >= 0 && sx <= w - 1 && sy <= h - 1;
    if (!inside && fill !== null) { out[y * w + x] = fill; continue; }
    const fx = Math.min(w - 1, Math.max(0, sx)), fy = Math.min(h - 1, Math.max(0, sy));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
    const v = (1 - ay) * ((1 - ax) * img[y0 * w + x0] + ax * img[y0 * w + x1]) + ay * ((1 - ax) * img[y1 * w + x0] + ax * img[y1 * w + x1]);
    out[y * w + x] = Math.round(v);
  }
  return out;
}

/** Text mask (255 = ink): closing-based illumination correction, then Otsu (inverse). */
export function binarize(img: Uint8Array, w: number, h: number) {
  const flat = correct(img, estimate(img, w, h, "closing", { k: 15 }), "divide");
  const t = otsu(histogram(flat));
  return Uint8Array.from(flat, (v) => (v <= t ? 255 : 0));
}

/** Row sums of a 0/255 mask (in ink pixels) and their variance: sharp peaks when text lines are horizontal. */
export function profile(mask: ArrayLike<number>, w: number, h: number) {
  const rows = new Array(h).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) rows[y]++;
  const m = rows.reduce((a, b) => a + b, 0) / h;
  return { rows, variance: rows.reduce((a, r) => a + (r - m) ** 2, 0) / h };
}

/** Deskew: the rotation in [-maxDeg, maxDeg] that maximises the profile variance of the rotated mask. */
export function deskewAngle(mask: Uint8Array, w: number, h: number, maxDeg = 10, step = 0.5) {
  let best = 0, bestV = -1;
  for (let a = -maxDeg; a <= maxDeg + 1e-9; a += step) { const v = profile(rotate(mask, w, h, a, 0), w, h).variance; if (v > bestV) { bestV = v; best = a; } }
  return Math.round(best * 100) / 100;
}
