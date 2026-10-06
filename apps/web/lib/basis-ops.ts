/** Module 31: other transforms. Orthonormal 2-D DCT-II (= cv2.dct), keep-the-largest compression with DCT or DFT,
 *  multi-level orthonormal Haar wavelet transform with soft thresholding, Gabor kernels (= cv2.getGaborKernel),
 *  and the Radon transform with unfiltered / ramp-filtered back-projection. Unit-tested. */
import { fft2 } from "./restore-ops.ts";
import { filter2D } from "./conv-ops.ts";
export { filter2D };

/** DCT-II basis matrix C (n × n), orthonormal: X = C x Cᵀ. */
export function dctMatrix(n: number) {
  const C = new Float64Array(n * n);
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) C[k * n + i] = (k === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n)) * Math.cos((Math.PI * (2 * i + 1) * k) / (2 * n));
  return C;
}
/** 2-D DCT (inverse = true for the inverse) of an n × n image, like cv2.dct / cv2.idct. */
export function dct2(img: ArrayLike<number>, n: number, inverse = false) {
  const C = dctMatrix(n), T = new Float64Array(n * n), out = new Float64Array(n * n);
  // rows: T = A · Cᵀ (forward) or A · C (inverse)
  for (let y = 0; y < n; y++) for (let k = 0; k < n; k++) { let s = 0; for (let i = 0; i < n; i++) s += img[y * n + i] * (inverse ? C[i * n + k] : C[k * n + i]); T[y * n + k] = s; }
  for (let k = 0; k < n; k++) for (let x = 0; x < n; x++) { let s = 0; for (let i = 0; i < n; i++) s += (inverse ? C[i * n + k] : C[k * n + i]) * T[i * n + x]; out[k * n + x] = s; }
  return out;
}
/** Keep the `fraction` largest-magnitude coefficients of the DCT or the DFT, reconstruct; returns the image. */
export function keepLargest(img: ArrayLike<number>, n: number, fraction: number, kind: "dct" | "dft") {
  const keep = Math.max(1, Math.round(fraction * n * n));
  if (kind === "dct") {
    const X = dct2(img, n), thr = kth(Array.from(X, Math.abs), keep);
    let c = 0; for (let i = 0; i < X.length; i++) { if (Math.abs(X[i]) < thr || (Math.abs(X[i]) === thr && c >= keep)) X[i] = 0; else c++; }
    return dct2(X, n, true);
  }
  const re = Float64Array.from(img), im = new Float64Array(n * n); fft2(re, im, n, n);
  const mag = Array.from(re, (v, i) => Math.hypot(v, im[i])), thr = kth(mag, keep);
  let c = 0; for (let i = 0; i < re.length; i++) { if (mag[i] < thr || (mag[i] === thr && c >= keep)) { re[i] = 0; im[i] = 0; } else c++; }
  fft2(re, im, n, n, true); return re;
}
const kth = (a: number[], k: number) => a.slice().sort((x, y) => y - x)[k - 1];

/** One level of the orthonormal 2-D Haar transform on the top-left s × s block of an n-wide array (in place):
 *  approximation top-left, horizontal / vertical / diagonal details in the other quadrants. */
function haarLevel(a: Float64Array, n: number, s: number, inverse: boolean) {
  const h = s / 2, r2 = Math.SQRT1_2, t = new Float64Array(s * s);
  if (!inverse) {
    for (let y = 0; y < h; y++) for (let x = 0; x < h; x++) {
      const p = a[2 * y * n + 2 * x], q = a[2 * y * n + 2 * x + 1], r = a[(2 * y + 1) * n + 2 * x], u = a[(2 * y + 1) * n + 2 * x + 1];
      t[y * s + x] = (p + q + r + u) / 2; t[y * s + x + h] = (p - q + r - u) / 2; t[(y + h) * s + x] = (p + q - r - u) / 2; t[(y + h) * s + x + h] = (p - q - r + u) / 2;
    }
  } else {
    for (let y = 0; y < h; y++) for (let x = 0; x < h; x++) {
      const A = a[y * n + x], H = a[y * n + x + h], V = a[(y + h) * n + x], D = a[(y + h) * n + x + h];
      t[2 * y * s + 2 * x] = (A + H + V + D) / 2; t[2 * y * s + 2 * x + 1] = (A - H + V - D) / 2; t[(2 * y + 1) * s + 2 * x] = (A + H - V - D) / 2; t[(2 * y + 1) * s + 2 * x + 1] = (A - H - V + D) / 2;
    }
  }
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) a[y * n + x] = t[y * s + x];
  void r2;
}
/** Multi-level 2-D Haar transform (n a power of two). */
export function haar2(img: ArrayLike<number>, n: number, levels: number, inverse = false) {
  const a = Float64Array.from(img);
  if (!inverse) for (let l = 0, s = n; l < levels; l++, s /= 2) haarLevel(a, n, s, false);
  else for (let l = levels - 1; l >= 0; l--) haarLevel(a, n, n >> l, true);
  return a;
}
/** Soft-threshold all detail coefficients (everything outside the coarsest approximation block). */
export function softThreshold(c: Float64Array, n: number, levels: number, T: number) {
  const out = Float64Array.from(c), s = n >> levels;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (x < s && y < s) continue; const v = out[y * n + x]; out[y * n + x] = Math.sign(v) * Math.max(0, Math.abs(v) - T); }
  return out;
}

/** cv2.getGaborKernel((ksize, ksize), sigma, theta, lambd, gamma, psi) (CV_64F). */
export function gaborKernel(ksize: number, sigma: number, theta: number, lambd: number, gamma: number, psi: number) {
  const sx = sigma, sy = sigma / gamma, c = Math.cos(theta), s = Math.sin(theta), half = Math.floor(ksize / 2);
  const ex = -0.5 / (sx * sx), ey = -0.5 / (sy * sy), cscale = (2 * Math.PI) / lambd;
  const k: number[][] = [];
  for (let y = half; y >= -half; y--) { const row: number[] = []; for (let x = half; x >= -half; x--) { const xr = x * c + y * s, yr = -x * s + y * c; row.push(Math.exp(ex * xr * xr + ey * yr * yr) * Math.cos(cscale * xr + psi)); } k.push(row); }
  return k;
}

/** Radon transform: for each angle, rotate the image about its centre (bilinear, zero outside) and sum columns. */
export function radon(img: ArrayLike<number>, n: number, angles: number[]) {
  const c = (n - 1) / 2, out: Float64Array[] = [];
  for (const deg of angles) {
    const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t), col = new Float64Array(n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const sx = co * (x - c) - si * (y - c) + c, sy = si * (x - c) + co * (y - c) + c;   // sample the image at the rotated point
      col[x] += bilin(img, n, sx, sy);
    }
    out.push(col);
  }
  return out;
}
function bilin(img: ArrayLike<number>, n: number, x: number, y: number) {
  if (x < 0 || y < 0 || x > n - 1 || y > n - 1) return 0;
  const x0 = Math.min(n - 2, Math.floor(x)), y0 = Math.min(n - 2, Math.floor(y)), fx = x - x0, fy = y - y0, i = y0 * n + x0;
  return img[i] * (1 - fx) * (1 - fy) + img[i + 1] * fx * (1 - fy) + img[i + n] * (1 - fx) * fy + img[i + n + 1] * fx * fy;
}
/** Ram-Lak (ramp) filter of each projection via a zero-padded 1-D FFT. */
export function rampFilter(proj: Float64Array[]) {
  const n = proj[0].length; let m = 1; while (m < 2 * n) m <<= 1;
  return proj.map((p) => {
    const re = new Float64Array(m), im = new Float64Array(m); re.set(p);
    fft2(re, im, m, 1);
    for (let k = 0; k < m; k++) { const f = Math.abs(k <= m / 2 ? k : k - m) / m; re[k] *= f; im[k] *= f; }
    fft2(re, im, m, 1, true); return re.slice(0, n);
  });
}
/** Back-projection: smear every projection back across the image along its angle, average. */
export function backproject(proj: Float64Array[], n: number, angles: number[]) {
  const c = (n - 1) / 2, out = new Float64Array(n * n);
  angles.forEach((deg, a) => {
    const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t), p = proj[a];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const s = co * (x - c) + si * (y - c) + c;     // detector position seen by pixel (x, y)
      const s0 = Math.floor(s), f = s - s0;
      if (s0 >= 0 && s0 < n - 1) out[y * n + x] += p[s0] * (1 - f) + p[s0 + 1] * f;
    }
  });
  const k = Math.PI / angles.length; // dθ for angles covering 0…180°
  for (let i = 0; i < n * n; i++) out[i] *= k;
  return out;
}
