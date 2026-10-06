/** Module 30: Fourier transform of images (power-of-two sizes): spectrum, frequency-domain filters (ideal,
 *  Butterworth, Gaussian; low- and high-pass), notch filters, and circular vs linear convolution. Uses fft2 from
 *  restore-ops (numpy.fft conventions: forward unscaled, inverse divided by N). Unit-tested against NumPy. */
import { fft2 } from "./restore-ops.ts";
export { fft2 };

/** Forward 2-D DFT of a real image. */
export function dft(img: ArrayLike<number>, W: number, H: number) {
  const re = Float64Array.from(img), im = new Float64Array(W * H); fft2(re, im, W, H); return { re, im };
}
/** Inverse 2-D DFT, real part. */
export function idft(F: { re: Float64Array; im: Float64Array }, W: number, H: number) {
  const re = Float64Array.from(F.re), im = Float64Array.from(F.im); fft2(re, im, W, H, true); return re;
}
/** Index of frequency (u, v) with u, v in −W/2 … W/2 − 1 (numpy order). */
export const fidx = (u: number, v: number, W: number, H: number) => (((v % H) + H) % H) * W + (((u % W) + W) % W);
/** Signed frequency of array index i along a length-n axis (numpy.fft.fftfreq · n). */
export const freq = (i: number, n: number) => (i < n / 2 ? i : i - n);

/** log(1 + |F|), shifted so that frequency (0, 0) is in the centre (fftshift). */
export function logSpectrum(F: { re: Float64Array; im: Float64Array }, W: number, H: number) {
  const out = new Float64Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = (x + W / 2) % W, sy = (y + H / 2) % H, i = y * W + x;
    out[sy * W + sx] = Math.log1p(Math.hypot(F.re[i], F.im[i]));
  }
  return out;
}

export type FilterKind = "ideal" | "butterworth" | "gaussian";
/** Low-pass transfer function H(D) at distance D from the centre of the spectrum (cut-off D0, Butterworth order n). */
export function lowpass(kind: FilterKind, D: number, D0: number, n = 2) {
  if (kind === "ideal") return D <= D0 ? 1 : 0;
  if (kind === "butterworth") return 1 / (1 + (D / D0) ** (2 * n));
  return Math.exp(-(D * D) / (2 * D0 * D0));
}
/** Transfer function array (numpy frequency order) for a low- or high-pass filter. */
export function transfer(kind: FilterKind, D0: number, W: number, H: number, high = false, n = 2) {
  const T = new Float64Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const l = lowpass(kind, Math.hypot(freq(x, W), freq(y, H)), D0, n); T[y * W + x] = high ? 1 - l : l; }
  return T;
}
/** Butterworth notch reject: zero at ±(u, v) for each centre, radius D0, order n. */
export function notchReject(centres: [number, number][], D0: number, W: number, H: number, n = 2) {
  const T = new Float64Array(W * H).fill(1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = freq(x, W), v = freq(y, H);
    for (const [cu, cv] of centres) for (const s of [1, -1]) { const D = Math.hypot(u - s * cu, v - s * cv); T[y * W + x] *= D === 0 ? 0 : 1 / (1 + (D0 / D) ** (2 * n)); }
  }
  return T;
}
/** Multiply a spectrum by a real transfer function and transform back. */
export function applyFilter(img: ArrayLike<number>, T: Float64Array, W: number, H: number) {
  const F = dft(img, W, H);
  for (let i = 0; i < W * H; i++) { F.re[i] *= T[i]; F.im[i] *= T[i]; }
  return idft(F, W, H);
}
/** The strongest peaks of |F| away from the centre (|u|, |v| > minR), one per ± pair, as (u, v) with v ≥ 0. */
export function peaks(F: { re: Float64Array; im: Float64Array }, W: number, H: number, count: number, minR = 4) {
  const cand: { u: number; v: number; m: number }[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = freq(x, W), v = freq(y, H); if (Math.hypot(u, v) < minR || v < 0 || (v === 0 && u < 0)) continue;
    const m = Math.hypot(F.re[y * W + x], F.im[y * W + x]);
    let isMax = true;
    for (let dy = -1; dy <= 1 && isMax; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const j = fidx(u + dx, v + dy, W, H); if (Math.hypot(F.re[j], F.im[j]) > m) { isMax = false; break; } }
    if (isMax) cand.push({ u, v, m });
  }
  return cand.sort((a, b) => b.m - a.m).slice(0, count);
}
/** Image of one 2-D wave A·cos(2π(u x / W + v y / H) + φ) around a mean. */
export function wave(W: number, H: number, u: number, v: number, A: number, phase = 0, mean = 0) {
  const out = new Float64Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = mean + A * Math.cos(2 * Math.PI * ((u * x) / W + (v * y) / H) + phase);
  return out;
}
/** PSNR between two images (0–255 scale). */
export function psnr(a: ArrayLike<number>, b: ArrayLike<number>) {
  let s = 0; for (let i = 0; i < a.length; i++) { const d = Math.max(0, Math.min(255, Math.round(a[i]))) - Math.max(0, Math.min(255, Math.round(b[i]))); s += d * d; }
  return s ? 10 * Math.log10((255 * 255 * a.length) / s) : Infinity;
}
