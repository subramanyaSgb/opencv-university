/** Module 50.4: slanted-edge MTF. The ESF of a step edge blurred by a Gaussian PSF (std sigma,
 *  pixels) is exact: the Gaussian CDF (erf form). LSF = dESF/dx; MTF = |DFT(LSF)| normalized to
 *  f = 0. Checked against the closed-form Gaussian MTF, exp(-2 pi^2 sigma^2 f^2) (chapter Code
 *  section 1 verifies the same relationship from real pixels, via cv2.GaussianBlur + binning).
 */

/** Abramowitz & Stegun 7.1.26 erf approximation (|error| < 1.5e-7). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/** Exact ESF of a unit step convolved with a Gaussian PSF of std sigma, at signed offset d (pixels) from the edge. sigma = 0 is a sharp step. */
export function gaussianEsf(d: number, sigma: number): number {
  if (sigma <= 0) return d >= 0 ? 1 : 0;
  return 0.5 * (1 + erf(d / (sigma * Math.SQRT2)));
}

/** Sampled ESF at offsets -range..range in steps of binWidth (pixels). */
export function sampleEsf(sigma: number, binWidth = 0.1, range = 10): Float64Array {
  const n = Math.round((2 * range) / binWidth) + 1;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = gaussianEsf(-range + i * binWidth, sigma);
  return out;
}

/** LSF = derivative of the ESF (forward difference / binWidth); length esf.length - 1. */
export function lsfFromEsf(esf: Float64Array, binWidth: number): Float64Array {
  const out = new Float64Array(esf.length - 1);
  for (let i = 0; i < out.length; i++) out[i] = (esf[i + 1] - esf[i]) / binWidth;
  return out;
}

/** Measured MTF at each spatial frequency in freqs (cycles/pixel): |DFT(lsf)| normalized to f = 0. */
export function mtfAt(lsf: Float64Array, binWidth: number, freqs: number[]): number[] {
  const n = lsf.length;
  let re0 = 0;
  for (let i = 0; i < n; i++) re0 += lsf[i];
  return freqs.map((f) => {
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) {
      const ph = 2 * Math.PI * f * i * binWidth;
      re += lsf[i] * Math.cos(ph);
      im -= lsf[i] * Math.sin(ph);
    }
    return Math.hypot(re, im) / Math.abs(re0);
  });
}

/** Closed-form MTF of a Gaussian PSF with std sigma (pixels) at spatial frequency f (cycles/pixel). */
export function analyticGaussianMtf(f: number, sigma: number): number {
  return Math.exp(-2 * Math.PI ** 2 * sigma ** 2 * f ** 2);
}

/** Frequency (cycles/pixel) where the Gaussian MTF equals 0.5 -- a common single-number summary. */
export function mtf50(sigma: number): number {
  return Math.sqrt(Math.log(2) / (2 * Math.PI ** 2 * sigma ** 2));
}
