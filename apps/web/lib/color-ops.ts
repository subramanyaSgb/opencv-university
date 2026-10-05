// Pure colour helpers for the colour figures. Unit-tested in color-ops.test.ts.

export type RGB = [number, number, number];

/** BT.601 weights, the ones OpenCV documents for COLOR_BGR2GRAY / COLOR_RGB2GRAY. */
export const GRAY_WEIGHTS = { r: 0.299, g: 0.587, b: 0.114 } as const;

/**
 * Gray value of an RGB colour: round(0.299 R + 0.587 G + 0.114 B).
 * Checked against cv2.cvtColor on all 16,777,216 colours (OpenCV 4.13.0):
 * identical for all but 22,906 colours, which differ by 1 (OpenCV uses integer arithmetic).
 */
export function grayOf([r, g, b]: RGB): number {
  return Math.round(GRAY_WEIGHTS.r * r + GRAY_WEIGHTS.g * g + GRAY_WEIGHTS.b * b);
}

/** Plain average of the three channels, for comparison with the weighted gray. */
export function averageOf([r, g, b]: RGB): number {
  return Math.round((r + g + b) / 3);
}

/** RGB → BGR (or back): reverse the channel order. */
export function reverse<T>(v: [T, T, T]): [T, T, T] {
  return [v[2], v[1], v[0]];
}

/** True when R = G = B: a shade of gray. */
export function isGray([r, g, b]: RGB): boolean {
  return r === g && g === b;
}

/** CSS colour for an RGB triple. */
export function css([r, g, b]: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Readable text colour on top of an RGB background. */
export function inkOn(rgb: RGB): "#000" | "#fff" {
  return grayOf(rgb) >= 140 ? "#000" : "#fff";
}

/** A rough name for teaching examples. Returns null when there is no simple name. */
export function simpleName([r, g, b]: RGB): string | null {
  const hi = (v: number) => v >= 200;
  const lo = (v: number) => v <= 55;
  if (r === g && g === b) return r <= 20 ? "black" : r >= 235 ? "white" : r < 100 ? "dark gray" : r > 170 ? "light gray" : "gray";
  if (hi(r) && lo(g) && lo(b)) return "red";
  if (lo(r) && hi(g) && lo(b)) return "green";
  if (lo(r) && lo(g) && hi(b)) return "blue";
  if (hi(r) && hi(g) && lo(b)) return "yellow";
  if (hi(r) && lo(g) && hi(b)) return "magenta";
  if (lo(r) && hi(g) && hi(b)) return "cyan";
  return null;
}
