// How matplotlib's imshow turns array values into screen colours (colour limits + colour map), for ImshowLab
// (Chapter 6.5). Viridis stops sampled from matplotlib 3.11.2 at 17 points. Unit-tested.

export const VIRIDIS = ["#440154", "#48186a", "#472d7b", "#424086", "#3b528b", "#33638d", "#2c728e", "#26828e", "#21918c", "#1fa088", "#28ae80", "#3fbc73", "#5ec962", "#84d44b", "#addc30", "#d8e219", "#fde725"];
const rgbOf = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const STOPS = VIRIDIS.map(rgbOf);

export type Cmap = "viridis" | "gray";

/** Normalised position t in 0..1 for a value with colour limits (vmin, vmax); clipped like matplotlib. */
export function norm(v: number, vmin: number, vmax: number): number {
  if (vmax === vmin) return 0;
  return Math.min(1, Math.max(0, (v - vmin) / (vmax - vmin)));
}

/** RGB colour for t in 0..1. */
export function colour(t: number, cmap: Cmap): [number, number, number] {
  if (cmap === "gray") { const g = Math.round(255 * t); return [g, g, g]; }
  const x = t * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(x)), f = x - i;
  return [0, 1, 2].map((k) => Math.round(STOPS[i][k] + f * (STOPS[i + 1][k] - STOPS[i][k]))) as [number, number, number];
}

/** Automatic colour limits: the data's min and max (what imshow does without vmin/vmax). */
export function autoLimits(values: ArrayLike<number>): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < values.length; i++) { if (values[i] < lo) lo = values[i]; if (values[i] > hi) hi = values[i]; }
  return [lo, hi];
}
