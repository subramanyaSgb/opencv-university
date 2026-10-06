// Descriptive statistics, the Gaussian, and a seeded normal generator, for GaussLab (Chapter 5.4). Unit-tested.

export const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
/** Variance; ddof = 0 divides by n (NumPy default), ddof = 1 by n − 1. */
export function variance(v: number[], ddof = 0): number {
  const m = mean(v);
  return v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - ddof);
}
export const std = (v: number[], ddof = 0) => Math.sqrt(variance(v, ddof));
export function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
/** Median absolute deviation, scaled by 1.4826 so it estimates σ for Gaussian data. */
export const robustSigma = (v: number[]) => { const m = median(v); return 1.4826 * median(v.map((x) => Math.abs(x - m))); };

export const gaussPdf = (x: number, mu: number, sigma: number) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

/** erf, Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7). */
export function erf(x: number): number {
  const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
/** Probability that a Gaussian value is more than k standard deviations from the mean (both sides). */
export const twoSidedTail = (k: number) => 1 - erf(k / Math.SQRT2);

/** Seeded normal samples (LCG + Box–Muller); deterministic so pictures do not jump. */
export function normals(n: number, mu: number, sigma: number, seed = 1): number[] {
  let s = seed >>> 0;
  const u = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s + 1) / 4294967297; };
  const out: number[] = [];
  while (out.length < n) {
    const r = Math.sqrt(-2 * Math.log(u())), t = 2 * Math.PI * u();
    out.push(mu + sigma * r * Math.cos(t));
    if (out.length < n) out.push(mu + sigma * r * Math.sin(t));
  }
  return out;
}
