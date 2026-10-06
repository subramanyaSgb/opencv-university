/** Module 18: noise models (seeded) and smoothing filters (box, Gaussian, median, bilateral, a small non-local means), with PSNR. */
import { gaussian } from "./pipe-ops.ts";

export function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gaussRand = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const clip = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export type Noise = "gaussian" | "saltpepper" | "speckle" | "poisson";
/** Add noise. level: σ for gaussian, fraction of pixels for salt & pepper, σ (relative) for speckle, photons at white for poisson. */
export function addNoise(img: ArrayLike<number>, kind: Noise, level: number, seed = 1) {
  const r = rng(seed), out = new Uint8Array(img.length);
  for (let i = 0; i < img.length; i++) {
    const v = img[i];
    if (kind === "gaussian") out[i] = clip(v + level * gaussRand(r));
    else if (kind === "saltpepper") { const u = r(); out[i] = u < level / 2 ? 0 : u < level ? 255 : v; }
    else if (kind === "speckle") out[i] = clip(v * (1 + level * gaussRand(r)));
    else { const lam = (v / 255) * level; out[i] = clip((Math.max(0, lam + Math.sqrt(lam) * gaussRand(r)) * 255) / level); }
  }
  return out;
}

export function psnr(a: ArrayLike<number>, b: ArrayLike<number>) {
  let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  const mse = s / a.length; return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
}

/** Box filter k × k, BORDER_REFLECT_101 (like cv2.blur). */
export function box(img: ArrayLike<number>, w: number, h: number, k: number) {
  const r = (k - 1) / 2, refl = (i: number, n: number) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i);
  const tmp = new Float64Array(w * h), out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let d = -r; d <= r; d++) s += img[y * w + refl(x + d, w)]; tmp[y * w + x] = s / k; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let d = -r; d <= r; d++) s += tmp[refl(y + d, h) * w + x]; out[y * w + x] = s / k; }
  return Uint8Array.from(out, clip);
}

export const gauss = (img: ArrayLike<number>, w: number, h: number, sigma: number) => Uint8Array.from(gaussian(img, w, h, sigma), clip);

/** Median k × k with replicated borders (like cv2.medianBlur). */
export function median(img: ArrayLike<number>, w: number, h: number, k: number) {
  const r = (k - 1) / 2, out = new Uint8Array(w * h), win = new Array(k * k), m = (k * k - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let n = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) win[n++] = img[Math.min(h - 1, Math.max(0, y + dy)) * w + Math.min(w - 1, Math.max(0, x + dx))];
    win.sort((a, b) => a - b); out[y * w + x] = win[m];
  }
  return out;
}

/** Bilateral filter (like cv2.bilateralFilter(src, d, sigmaColor, sigmaSpace)): weights exp(-Δ²/2σc²) · exp(-r²/2σs²) over a disk of diameter d. */
export function bilateral(img: ArrayLike<number>, w: number, h: number, d: number, sc: number, ss: number) {
  const r = Math.floor(d / 2), out = new Uint8Array(w * h), cw = new Float64Array(256);
  for (let i = 0; i < 256; i++) cw[i] = Math.exp(-(i * i) / (2 * sc * sc));
  const offs: [number, number, number][] = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) offs.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * ss * ss))]);
  const refl = (i: number, n: number) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = img[y * w + x]; let s = 0, ws = 0;
    for (const [dx, dy, sw] of offs) { const v = img[refl(y + dy, h) * w + refl(x + dx, w)], wt = sw * cw[Math.abs(v - c)]; s += wt * v; ws += wt; }
    out[y * w + x] = clip(s / ws);
  }
  return out;
}

/** Small non-local means: patch (2p+1)², search window (2s+1)², filter strength hh (weights exp(-max(d² - 2σ², 0)/h²) simplified to exp(-d²/h²)). */
export function nlm(img: ArrayLike<number>, w: number, h: number, hh: number, p = 2, s = 5) {
  const out = new Uint8Array(w * h), cl = (i: number, n: number) => Math.min(n - 1, Math.max(0, i)), np2 = (2 * p + 1) ** 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let acc = 0, ws = 0;
    for (let sy = -s; sy <= s; sy++) for (let sx = -s; sx <= s; sx++) {
      let d = 0;
      for (let py = -p; py <= p; py++) for (let px = -p; px <= p; px++) {
        const a = img[cl(y + py, h) * w + cl(x + px, w)], b = img[cl(y + sy + py, h) * w + cl(x + sx + px, w)]; d += (a - b) ** 2;
      }
      const wt = Math.exp(-(d / np2) / (hh * hh));
      acc += wt * img[cl(y + sy, h) * w + cl(x + sx, w)]; ws += wt;
    }
    out[y * w + x] = clip(acc / ws);
  }
  return out;
}
