/** OpenCV-style HSV for 8-bit images (Chapter 10.2): H = hue/2 in 0..179, S and V in 0..255. Input/output in B, G, R order. */
export type Trip = [number, number, number];

/** Hue in degrees (0..360), saturation and value in 0..1, from B, G, R in 0..255 (float formulas of cv2.cvtColor). */
export function bgrToHsvFloat([b, g, r]: Trip): Trip {
  const v = Math.max(r, g, b), mn = Math.min(r, g, b), d = v - mn;
  const s = v === 0 ? 0 : d / v;
  let h = 0;
  if (d > 0) {
    if (v === r) h = (60 * (g - b)) / d;
    else if (v === g) h = 120 + (60 * (b - r)) / d;
    else h = 240 + (60 * (r - g)) / d;
  }
  if (h < 0) h += 360;
  return [h, s, v / 255];
}

/** 8-bit OpenCV HSV (COLOR_BGR2HSV): H rounded from degrees/2, S and V scaled to 255. */
export function bgrToHsv8(bgr: Trip): Trip {
  const [h, s, v] = bgrToHsvFloat(bgr);
  return [Math.round(h / 2) % 180, Math.round(s * 255), Math.round(v * 255)];
}

/** Inverse: 8-bit OpenCV H (0..179), S, V (0..255) → B, G, R. */
export function hsv8ToBgr([H, S, V]: Trip): Trip {
  const h = (H * 2) / 60, s = S / 255, v = V / 255;
  const i = Math.floor(h) % 6, f = h - Math.floor(h);
  const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
  const rgb = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
  return [rgb[2], rgb[1], rgb[0]].map((x) => Math.round(x * 255)) as Trip;
}
