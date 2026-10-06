// 1-D derivatives by differences, Gaussian smoothing and sub-pixel edge location, for DerivLab (Chapter 5.5). Unit-tested.

/** Central difference (f(x+1) − f(x−1)) / 2; ends are 0. */
export function centralDiff(f: number[]): number[] {
  return f.map((_, i) => (i === 0 || i === f.length - 1 ? 0 : (f[i + 1] - f[i - 1]) / 2));
}
/** Second difference f(x+1) − 2 f(x) + f(x−1); ends are 0. */
export function secondDiff(f: number[]): number[] {
  return f.map((_, i) => (i === 0 || i === f.length - 1 ? 0 : f[i + 1] - 2 * f[i] + f[i - 1]));
}
/** Gaussian smoothing with border replication; sigma 0 returns a copy. */
export function smooth(f: number[], sigma: number): number[] {
  if (sigma <= 0) return [...f];
  const r = Math.ceil(3 * sigma);
  const k = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-0.5 * ((i - r) / sigma) ** 2));
  const s = k.reduce((a, b) => a + b, 0);
  return f.map((_, i) => k.reduce((acc, w, j) => acc + w * f[Math.min(f.length - 1, Math.max(0, i + j - r))], 0) / s);
}
/** Sub-pixel peak of |d| by a parabola through the maximum and its neighbours. */
export function subpixelPeak(d: number[]): { index: number; position: number } {
  let i = 1;
  for (let k = 1; k < d.length - 1; k++) if (Math.abs(d[k]) > Math.abs(d[i])) i = k;
  const a = Math.abs(d[i - 1]), b = Math.abs(d[i]), c = Math.abs(d[i + 1]);
  const den = a - 2 * b + c;
  return { index: i, position: i + (den === 0 ? 0 : (0.5 * (a - c)) / den) };
}
/** Logistic edge profile, rounded like an 8-bit image. */
export const edgeProfile = (n: number, centre: number, width: number, lo = 50, hi = 200) =>
  Array.from({ length: n }, (_, x) => Math.round(lo + (hi - lo) / (1 + Math.exp(-(x - centre) / width))));
