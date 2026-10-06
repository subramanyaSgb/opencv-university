/** Chapter 14.4: weighted blending (cv2.addWeighted), alpha-mask compositing, feathered masks, blending in linear light. */
import { satU8 } from "./overflow-ops.ts";

/** cv2.addWeighted(a, alpha, b, beta, gamma) on uint8 data: computed in float32, saturate_cast (round half to even). */
export function addWeighted(a: ArrayLike<number>, alpha: number, b: ArrayLike<number>, beta: number, gamma = 0) {
  const out = new Uint8Array(a.length), fa = Math.fround(alpha), fb = Math.fround(beta), fg = Math.fround(gamma);
  for (let i = 0; i < a.length; i++) out[i] = satU8(Math.fround(Math.fround(Math.fround(a[i] * fa) + Math.fround(b[i] * fb)) + fg));
  return out;
}

const dec = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const enc = (x: number) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

/** Per-pixel compositing: out = α·a + (1 − α)·b with α from a 0..255 mask (c channels per pixel); optionally in linear light (sRGB). */
export function composite(a: ArrayLike<number>, b: ArrayLike<number>, alpha: ArrayLike<number>, c: number, linear = false) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < alpha.length; i++) {
    const t = alpha[i] / 255;
    for (let k = 0; k < c; k++) {
      const j = i * c + k;
      out[j] = linear ? satU8(enc(t * dec(a[j]) + (1 - t) * dec(b[j]))) : satU8(t * a[j] + (1 - t) * b[j]);
    }
  }
  return out;
}

/** Soft edge: box-blur a 0..255 mask `passes` times with radius r (three passes approximate a Gaussian). */
export function feather(mask: ArrayLike<number>, w: number, h: number, r: number, passes = 3) {
  let cur = Float64Array.from(mask);
  if (r <= 0) return Uint8Array.from(cur);
  for (let p = 0; p < passes; p++) {
    const tmp = new Float64Array(cur.length), nxt = new Float64Array(cur.length), n = 2 * r + 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let d = -r; d <= r; d++) s += cur[y * w + Math.min(w - 1, Math.max(0, x + d))]; tmp[y * w + x] = s / n; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let d = -r; d <= r; d++) s += tmp[Math.min(h - 1, Math.max(0, y + d)) * w + x]; nxt[y * w + x] = s / n; }
    cur = nxt;
  }
  return Uint8Array.from(cur, (v) => Math.round(v));
}
