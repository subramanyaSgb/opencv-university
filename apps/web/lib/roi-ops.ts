// Helpers behind mouse-driven tools, for TunerLab (Chapter 7.6). Unit-tested; the same logic as the chapter's Python code.

/** Rectangle (x, y, w, h) from two drag points in any order, clipped to the image; null if empty. */
export function rectFromDrag(p0: [number, number], p1: [number, number], width: number, height: number): [number, number, number, number] | null {
  const x0 = Math.max(0, Math.min(p0[0], p1[0])), y0 = Math.max(0, Math.min(p0[1], p1[1]));
  const x1 = Math.min(width, Math.max(p0[0], p1[0])), y1 = Math.min(height, Math.max(p0[1], p1[1]));
  return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
}

/** Like cv2.inRange on a gray image: 255 where lo <= v <= hi, else 0. Returns the mask and the count. */
export function inRange(values: ArrayLike<number>, lo: number, hi: number): { mask: Uint8Array; count: number } {
  const mask = new Uint8Array(values.length);
  let count = 0;
  for (let i = 0; i < values.length; i++) if (values[i] >= lo && values[i] <= hi) { mask[i] = 255; count++; }
  return { mask, count };
}
