/** Module 32: template matching. cv2.matchTemplate's six methods computed directly (window sums from integral images),
 *  peak finding with non-maximum suppression, and helpers to rotate / scale a template. Unit-tested against OpenCV. */
export type Method = "SQDIFF" | "SQDIFF_NORMED" | "CCORR" | "CCORR_NORMED" | "CCOEFF" | "CCOEFF_NORMED";
export const METHODS: Method[] = ["SQDIFF", "SQDIFF_NORMED", "CCORR", "CCORR_NORMED", "CCOEFF", "CCOEFF_NORMED"];
export const lowerIsBetter = (m: Method) => m.startsWith("SQDIFF");

/** Result map of size (w − tw + 1) × (h − th + 1), like cv2.matchTemplate(img, tpl, method). */
export function matchTemplate(img: ArrayLike<number>, w: number, h: number, tpl: ArrayLike<number>, tw: number, th: number, method: Method) {
  const rw = w - tw + 1, rh = h - th + 1, n = tw * th, R = new Float64Array(rw * rh);
  // integral images of I and I²
  const S1 = new Float64Array((w + 1) * (h + 1)), S2 = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = img[y * w + x], i = (y + 1) * (w + 1) + x + 1; S1[i] = v + S1[i - 1] + S1[i - w - 1] - S1[i - w - 2]; S2[i] = v * v + S2[i - 1] + S2[i - w - 1] - S2[i - w - 2]; }
  const box = (S: Float64Array, x: number, y: number) => S[(y + th) * (w + 1) + x + tw] - S[y * (w + 1) + x + tw] - S[(y + th) * (w + 1) + x] + S[y * (w + 1) + x];
  let tSum = 0, tSq = 0; for (let i = 0; i < n; i++) { tSum += tpl[i]; tSq += tpl[i] * tpl[i]; }
  const tMean = tSum / n, tVar = tSq - n * tMean * tMean;
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    let cc = 0;
    for (let j = 0; j < th; j++) { const o = (y + j) * w + x, t = j * tw; for (let i = 0; i < tw; i++) cc += img[o + i] * tpl[t + i]; }
    const iSum = box(S1, x, y), iSq = box(S2, x, y);
    let r: number;
    switch (method) {
      case "SQDIFF": r = iSq - 2 * cc + tSq; break;
      case "SQDIFF_NORMED": r = (iSq - 2 * cc + tSq) / Math.sqrt(iSq * tSq); break;
      case "CCORR": r = cc; break;
      case "CCORR_NORMED": r = cc / Math.sqrt(iSq * tSq); break;
      case "CCOEFF": r = cc - iSum * tMean; break;
      default: { const iVar = iSq - (iSum * iSum) / n, d = Math.sqrt(Math.max(iVar, 0) * tVar); r = d > 1e-12 ? (cc - iSum * tMean) / d : 0; }
    }
    R[y * rw + x] = r;
  }
  return { R, rw, rh };
}

/** Local optima of a result map (best within ±r), above (or below, for SQDIFF) a threshold, best first. */
export function peaks(R: Float64Array, rw: number, rh: number, thr: number, low: boolean, r = 4) {
  const out: { x: number; y: number; v: number }[] = [];
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const v = R[y * rw + x]; if (low ? v > thr : v < thr) continue;
    let best = true;
    for (let dy = -r; dy <= r && best; dy++) for (let dx = -r; dx <= r; dx++) { const yy = y + dy, xx = x + dx; if ((dx || dy) && yy >= 0 && xx >= 0 && yy < rh && xx < rw) { const u = R[yy * rw + xx]; if (low ? u < v : u > v) { best = false; break; } } }
    if (best) out.push({ x, y, v });
  }
  return out.sort((a, b) => (low ? a.v - b.v : b.v - a.v));
}

/** Rotate (degrees) and scale a template about its centre; output size can differ; outside → fill. Bilinear. */
export function warpTemplate(tpl: ArrayLike<number>, tw: number, th: number, angle: number, scale: number, fill: number) {
  const ow = Math.max(3, Math.round(tw * scale)), oh = Math.max(3, Math.round(th * scale)), out = new Float64Array(ow * oh);
  const a = (angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), cx = (tw - 1) / 2, cy = (th - 1) / 2, ox = (ow - 1) / 2, oy = (oh - 1) / 2;
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const u = (x - ox) / scale, v = (y - oy) / scale, sx = c * u + s * v + cx, sy = -s * u + c * v + cy;
    if (sx < 0 || sy < 0 || sx > tw - 1 || sy > th - 1) { out[y * ow + x] = fill; continue; }
    const x0 = Math.min(tw - 2, Math.floor(sx)), y0 = Math.min(th - 2, Math.floor(sy)), fx = sx - x0, fy = sy - y0, i = y0 * tw + x0;
    out[y * ow + x] = tpl[i] * (1 - fx) * (1 - fy) + tpl[i + 1] * fx * (1 - fy) + tpl[i + tw] * (1 - fx) * fy + tpl[i + tw + 1] * fx * fy;
  }
  return { t: out, w: ow, h: oh };
}
