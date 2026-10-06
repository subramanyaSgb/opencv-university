/** Module 15: a small preprocessing pipeline (flat-field, blur, stretch, Otsu) whose step order can be changed. */
import { histogram, otsu } from "./thresh-ops.ts";

export type Step = "flat" | "blur" | "stretch" | "otsu";
export const STEP_LABEL: Record<Step, string> = { flat: "illumination correction", blur: "Gaussian blur σ = 1", stretch: "contrast stretch 1–99 %", otsu: "Otsu threshold" };
export const STEP_CODE: Record<Step, string> = {
  flat: "bg = cv2.GaussianBlur(img, (0, 0), 15); img = img / bg * bg.mean()",
  blur: "img = cv2.GaussianBlur(img, (0, 0), 1)",
  stretch: "lo, hi = np.percentile(img, [1, 99]); img = (img - lo) * 255 / (hi - lo)",
  otsu: "_, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)",
};

/** Separable Gaussian blur with OpenCV's kernel size rule for sigma (ksize = round(6σ + 1) | 1 for 8-bit), border reflect-101. */
export function gaussian(img: ArrayLike<number>, w: number, h: number, sigma: number) {
  let k = Math.round(sigma * 6 + 1) | 1; if (k < 3) k = 3;
  const r = (k - 1) / 2, ker = Array.from({ length: k }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const s = ker.reduce((a, b) => a + b, 0); for (let i = 0; i < k; i++) ker[i] /= s;
  const refl = (i: number, n: number) => { while (i < 0 || i >= n) i = i < 0 ? -i : 2 * n - 2 - i; return i; };
  const tmp = new Float64Array(w * h), out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let a = 0; for (let i = 0; i < k; i++) a += ker[i] * img[y * w + refl(x + i - r, w)]; tmp[y * w + x] = a; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let a = 0; for (let i = 0; i < k; i++) a += ker[i] * tmp[refl(y + i - r, h) * w + x]; out[y * w + x] = a; }
  return out;
}

const toU8 = (a: ArrayLike<number>) => Uint8Array.from(a, (v) => Math.max(0, Math.min(255, Math.round(v))));

export function applyStep(img: Uint8Array, w: number, h: number, s: Step): Uint8Array {
  if (s === "blur") return toU8(gaussian(img, w, h, 1));
  if (s === "flat") {
    const bg = toU8(gaussian(img, w, h, 15));
    let m = 0; for (const v of bg) m += v; m /= bg.length;
    return toU8(Array.from(img, (v, i) => (v / Math.max(bg[i], 1)) * m));
  }
  if (s === "stretch") {
    const sorted = Array.from(img).sort((a, b) => a - b), q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
    const lo = q(0.01), hi = q(0.99);
    return toU8(Array.from(img, (v) => ((v - lo) * 255) / Math.max(hi - lo, 1)));
  }
  const t = otsu(histogram(img));
  return Uint8Array.from(img, (v) => (v > t ? 255 : 0));
}

export function runPipeline(img: Uint8Array, w: number, h: number, steps: Step[]) {
  const stages: Uint8Array[] = [img];
  for (const s of steps) stages.push(applyStep(stages[stages.length - 1], w, h, s));
  return stages;
}
