/** Module 19: sharpening (unsharp mask, Laplacian) and restoration (PSFs, FFT blur, inverse, Wiener, Richardson–Lucy). */
import { gaussian } from "./pipe-ops.ts";

const clip = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const refl = (i: number, n: number) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i); // BORDER_REFLECT_101

/** Unsharp mask: out = img + amount·(img − Gaussian(img, σ)), only where |img − blur| ≥ threshold. */
export function unsharp(img: ArrayLike<number>, w: number, h: number, sigma: number, amount: number, threshold = 0) {
  const b = gaussian(img, w, h, sigma), out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { const d = img[i] - b[i]; out[i] = clip(Math.abs(d) >= threshold ? img[i] + amount * d : img[i]); }
  return out;
}

/** Laplacian sharpening: out = img − c·∇²img with the 4-neighbour (or 8-neighbour) Laplacian, borders reflected. */
export function laplacianSharpen(img: ArrayLike<number>, w: number, h: number, c: number, eight = false) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (dy: number, dx: number) => img[refl(y + dy, h) * w + refl(x + dx, w)];
    let lap = p(-1, 0) + p(1, 0) + p(0, -1) + p(0, 1) - 4 * p(0, 0);
    if (eight) lap += p(-1, -1) + p(-1, 1) + p(1, -1) + p(1, 1) - 4 * p(0, 0);
    out[y * w + x] = clip(p(0, 0) - c * lap);
  }
  return out;
}

/** In-place radix-2 complex FFT of length n (power of two). */
function fft1(re: Float64Array, im: Float64Array, inverse: boolean) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI / len) * (inverse ? 1 : -1), wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/** 2-D FFT (W, H powers of two), in place. */
export function fft2(re: Float64Array, im: Float64Array, W: number, H: number, inverse = false) {
  const r = new Float64Array(W), i2 = new Float64Array(W);
  for (let y = 0; y < H; y++) { r.set(re.subarray(y * W, y * W + W)); i2.set(im.subarray(y * W, y * W + W)); fft1(r, i2, inverse); re.set(r, y * W); im.set(i2, y * W); }
  const c = new Float64Array(H), ci = new Float64Array(H);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) { c[y] = re[y * W + x]; ci[y] = im[y * W + x]; }
    fft1(c, ci, inverse);
    for (let y = 0; y < H; y++) { re[y * W + x] = c[y]; im[y * W + x] = ci[y]; }
  }
}

export type Psf = { k: Float64Array; size: number };
export type PsfKind = "gauss" | "motion" | "disk";

/** Point spread functions, odd size, sum 1. gauss: σ; motion: length (px) at angle (deg), 8× supersampled; disk: radius (px), 8× supersampled. */
export function makePsf(kind: PsfKind, p: number, angle = 0): Psf {
  const r = kind === "gauss" ? Math.max(1, Math.ceil(3 * p)) : Math.max(1, Math.ceil(p / (kind === "motion" ? 2 : 1)) + 1);
  const size = 2 * r + 1, k = new Float64Array(size * size), S = 8;
  if (kind === "gauss") for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) k[(y + r) * size + x + r] = Math.exp(-(x * x + y * y) / (2 * p * p));
  else for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let hit = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const X = x - r + (sx + 0.5) / S - 0.5, Y = y - r + (sy + 0.5) / S - 0.5;
      if (kind === "disk") { if (X * X + Y * Y <= p * p) hit++; }
      else {
        const a = (angle * Math.PI) / 180, along = X * Math.cos(a) + Y * Math.sin(a), across = -X * Math.sin(a) + Y * Math.cos(a);
        if (Math.abs(along) <= p / 2 && Math.abs(across) <= 0.5) hit++;
      }
    }
    k[y * size + x] = hit;
  }
  const s = k.reduce((a, b) => a + b, 0); for (let i = 0; i < k.length; i++) k[i] /= s;
  return { k, size };
}

/** Transfer function: the PSF wrapped around the origin of a W × H grid, transformed. */
export function otf(psf: Psf, W: number, H: number) {
  const re = new Float64Array(W * H), im = new Float64Array(W * H), r = (psf.size - 1) / 2;
  for (let y = 0; y < psf.size; y++) for (let x = 0; x < psf.size; x++) re[((y - r + H) % H) * W + ((x - r + W) % W)] += psf.k[y * psf.size + x];
  fft2(re, im, W, H); return { re, im };
}

const pow2 = (n: number) => { let p = 1; while (p < n) p <<= 1; return p; };

/** Mirror-pad an image to W × H (powers of two) so circular FFT filtering has no hard seams. */
export function padMirror(img: ArrayLike<number>, w: number, h: number) {
  const W = pow2(w + 16), H = pow2(h + 16), out = new Float64Array(W * H);
  const m = (i: number, n: number) => { i = ((i % (2 * n)) + 2 * n) % (2 * n); return i < n ? i : 2 * n - 1 - i; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = img[m(y, h) * w + m(x, w)];
  return { data: out, W, H };
}
export const crop = (d: ArrayLike<number>, W: number, w: number, h: number) => { const o = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[y * w + x] = clip(d[y * W + x]); return o; };

/** Circular convolution with the PSF via FFT (W × H). */
export function convolveFFT(d: Float64Array, W: number, H: number, T: { re: Float64Array; im: Float64Array }, conj = false) {
  const re = Float64Array.from(d), im = new Float64Array(W * H); fft2(re, im, W, H);
  for (let i = 0; i < W * H; i++) { const tr = T.re[i], ti = conj ? -T.im[i] : T.im[i], a = re[i], b = im[i]; re[i] = a * tr - b * ti; im[i] = a * ti + b * tr; }
  fft2(re, im, W, H, true); return re;
}

/** Wiener deconvolution X = H*·B / (|H|² + K). K = 0 gives the inverse filter (|H| clamped to eps). */
export function wiener(d: Float64Array, W: number, H: number, T: { re: Float64Array; im: Float64Array }, K: number, eps = 1e-3) {
  const re = Float64Array.from(d), im = new Float64Array(W * H); fft2(re, im, W, H);
  for (let i = 0; i < W * H; i++) {
    let hr = T.re[i], hi = T.im[i]; const m2 = hr * hr + hi * hi;
    let den = m2 + K;
    if (K === 0 && m2 < eps * eps) { hr = eps; hi = 0; den = eps * eps; }
    const a = re[i], b = im[i]; // (a + ib)(hr − i·hi) / den
    re[i] = (a * hr + b * hi) / den; im[i] = (b * hr - a * hi) / den;
  }
  fft2(re, im, W, H, true); return re;
}

/** Richardson–Lucy: x ← x · (Hᵀ (b / (H x))), starting from b. */
export function richardsonLucy(d: Float64Array, W: number, H: number, T: { re: Float64Array; im: Float64Array }, iters: number) {
  let x = Float64Array.from(d, (v) => Math.max(v, 1e-3));
  for (let it = 0; it < iters; it++) {
    const hx = convolveFFT(x, W, H, T), ratio = Float64Array.from(d, (v, i) => v / Math.max(hx[i], 1e-6));
    const c = convolveFFT(ratio, W, H, T, true);
    x = Float64Array.from(x, (v, i) => v * c[i]);
  }
  return x;
}
