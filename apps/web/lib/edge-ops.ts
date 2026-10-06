/** Module 22: gradients (Sobel, Scharr), Laplacian / LoG with zero crossings, and Canny step by step (as cv2.Canny: Sobel 3 × 3, no pre-blur, L1 or L2 magnitude). */

const r101 = (i: number, n: number) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i);
const r101b = r101;

/** 3 × 3 derivative filters with BORDER_REFLECT_101 (like cv2.Sobel(ksize=3) / cv2.Scharr). Returns float gx, gy. */
export function gradients(img: ArrayLike<number>, w: number, h: number, kind: "sobel" | "scharr" = "sobel", replicate = false) {
  const r101 = replicate ? (i: number, n: number) => Math.min(n - 1, Math.max(0, i)) : r101b;
  const s = kind === "sobel" ? [1, 2, 1] : [3, 10, 3], gx = new Float64Array(w * h), gy = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let ax = 0, ay = 0;
    for (let k = -1; k <= 1; k++) {
      const yy = r101(y + k, h), xx = r101(x + k, w), wk = s[k + 1];
      ax += wk * (img[yy * w + r101(x + 1, w)] - img[yy * w + r101(x - 1, w)]);
      ay += wk * (img[r101(y + 1, h) * w + xx] - img[r101(y - 1, h) * w + xx]);
    }
    gx[y * w + x] = ax; gy[y * w + x] = ay;
  }
  return { gx, gy };
}

export const magnitude = (gx: Float64Array, gy: Float64Array, l2 = true) => gx.map((v, i) => (l2 ? Math.hypot(v, gy[i]) : Math.abs(v) + Math.abs(gy[i])));

/** Non-maximum suppression: keep a pixel only if its magnitude is ≥ both neighbours along the gradient direction (4 sectors, as Canny). */
export function nms(mag: Float64Array, gx: Float64Array, gy: Float64Array, w: number, h: number) {
  const out = new Float64Array(w * h), T = Math.tan(Math.PI / 8), T2 = Math.tan((3 * Math.PI) / 8);
  const M = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : mag[y * w + x]); // zero outside, as OpenCV pads
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, m = mag[i]; if (m === 0) continue;
    const ax = Math.abs(gx[i]), ay = Math.abs(gy[i]);
    let keep: boolean;
    if (ay < ax * T) keep = m > M(x - 1, y) && m >= M(x + 1, y);                 // horizontal gradient: compare left/right
    else if (ay > ax * T2) keep = m > M(x, y - 1) && m >= M(x, y + 1);           // vertical gradient: up/down
    else { const s = gx[i] * gy[i] < 0 ? -1 : 1; keep = m > M(x - s, y - 1) && m > M(x + s, y + 1); } // diagonals
    if (keep) out[i] = m;
  }
  return out;
}

/** Double threshold + hysteresis (8-connected). Returns 0 / 128 (weak, not kept) / 255 (edge) for display, and the final edge map. */
export function hysteresis(thin: Float64Array, w: number, h: number, low: number, high: number) {
  const cls = new Uint8Array(w * h), edge = new Uint8Array(w * h), stack: number[] = [];
  for (let i = 0; i < w * h; i++) { if (thin[i] > high) { cls[i] = 2; edge[i] = 255; stack.push(i); } else if (thin[i] > low) cls[i] = 1; }
  while (stack.length) {
    const i = stack.pop()!, x = i % w, y = (i - x) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const j = yy * w + xx; if (cls[j] === 1 && !edge[j]) { edge[j] = 255; stack.push(j); }
    }
  }
  const view = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) view[i] = edge[i] ? 255 : cls[i] ? 90 : 0;
  return { edge, view };
}

/** Canny as OpenCV does it by default: Sobel 3 × 3 on the given image, L1 magnitude unless l2, NMS, hysteresis. */
export function canny(img: ArrayLike<number>, w: number, h: number, low: number, high: number, l2 = false) {
  const { gx, gy } = gradients(img, w, h, "sobel", true), mag = magnitude(gx, gy, l2), thin = nms(mag, gx, gy, w, h);
  return { mag, thin, ...hysteresis(thin, w, h, low, high) };
}

/** Gaussian blur (float, separable, radius ceil(3σ), reflect-101). */
export function gaussBlur(img: ArrayLike<number>, w: number, h: number, sigma: number) {
  if (sigma <= 0) return Float64Array.from(img);
  const r = Math.max(1, Math.ceil(3 * sigma)), k: number[] = []; for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const s = k.reduce((a, b) => a + b, 0), t = new Float64Array(w * h), o = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let a = 0; for (let i = -r; i <= r; i++) a += k[i + r] * img[y * w + r101(x + i, w)]; t[y * w + x] = a / s; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let a = 0; for (let i = -r; i <= r; i++) a += k[i + r] * t[r101(y + i, h) * w + x]; o[y * w + x] = a / s; }
  return o;
}

/** 4-neighbour Laplacian (reflect-101). */
export function laplacian(img: ArrayLike<number>, w: number, h: number) {
  const o = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[y * w + x] = img[y * w + r101(x - 1, w)] + img[y * w + r101(x + 1, w)] + img[r101(y - 1, h) * w + x] + img[r101(y + 1, h) * w + x] - 4 * img[y * w + x];
  return o;
}

/** Zero crossings of a LoG response with a minimum slope: sign change to the right or below, |difference| > minSlope. */
export function zeroCrossings(L: Float64Array, w: number, h: number, minSlope: number) {
  const o = new Uint8Array(w * h);
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const v = L[y * w + x], r = L[y * w + x + 1], d = L[(y + 1) * w + x];
    if ((v * r < 0 && Math.abs(v - r) > minSlope) || (v * d < 0 && Math.abs(v - d) > minSlope)) o[y * w + x] = 255;
  }
  return o;
}

/** Sub-pixel position of a 1-D peak from three samples (parabola through them): offset in (−0.5, 0.5). */
export const parabolaPeak = (a: number, b: number, c: number) => { const d = a - 2 * b + c; return d === 0 ? 0 : (0.5 * (a - c)) / d; };
