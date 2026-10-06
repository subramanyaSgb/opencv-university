/** OpenCV COLOR_BGR2YCrCb for 8-bit values (Chapter 10.4): BT.601 luma, delta = 128. Input B, G, R. */
export type Trip = [number, number, number];
const clip = (v: number) => Math.min(255, Math.max(0, Math.round(v)));

export function bgrToYcrcb([b, g, r]: Trip): Trip {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  return [clip(y), clip((r - y) * 0.713 + 128), clip((b - y) * 0.564 + 128)];
}

export function ycrcbToBgr([y, cr, cb]: Trip): Trip {
  const r = y + 1.403 * (cr - 128);
  const g = y - 0.714 * (cr - 128) - 0.344 * (cb - 128);
  const b = y + 1.773 * (cb - 128);
  return [clip(b), clip(g), clip(r)];
}
