/** Module 20: image pyramids. pyrDown / pyrUp equal to OpenCV for 8-bit images; float versions for Laplacian pyramids, blending and DoG. */

const r101 = (i: number, n: number) => (n === 1 ? 0 : i < 0 ? -i : i >= n ? 2 * n - 2 - i : i);

/** cv2.pyrDown on one 8-bit channel: 1-4-6-4-1 blur (BORDER_REFLECT_101), keep even rows/columns; size ((w+1)/2, (h+1)/2). */
export function pyrDown(img: ArrayLike<number>, w: number, h: number) {
  const W = (w + 1) >> 1, H = (h + 1) >> 1, k = [1, 4, 6, 4, 1], tmp = new Int32Array(W * h), out = new Uint8Array(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) { let s = 0; for (let d = -2; d <= 2; d++) s += k[d + 2] * img[y * w + r101(2 * x + d, w)]; tmp[y * W + x] = s; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let d = -2; d <= 2; d++) s += k[d + 2] * tmp[r101(2 * y + d, h) * W + x]; out[y * W + x] = (s + 128) >> 8; }
  return { d: out, w: W, h: H };
}

/** One dimension of pyrUp as OpenCV does it: even outputs (a + 6b + c), odd outputs 4(b + c); left border reflected, right border replicated. */
function upIndex(j: number, n: number): [number, number][] {
  const i = j >> 1, ext = (t: number) => (t < 0 ? -t : t >= n ? n - 1 : t);
  return j % 2 === 0 ? [[ext(i - 1), 1], [ext(i), 6], [ext(i + 1), 1]] : [[ext(i), 4], [ext(i + 1), 4]];
}

/** cv2.pyrUp on one 8-bit channel: size (2w, 2h). */
export function pyrUp(img: ArrayLike<number>, w: number, h: number) {
  const W = 2 * w, H = 2 * h, tmp = new Int32Array(W * h), out = new Uint8Array(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) { let s = 0; for (const [i, c] of upIndex(x, w)) s += c * img[y * w + i]; tmp[y * W + x] = s; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (const [i, c] of upIndex(y, h)) s += c * tmp[i * W + x]; out[y * W + x] = Math.min(255, (s + 32) >> 6); }
  return { d: out, w: W, h: H };
}

export type FImg = { d: Float64Array; w: number; h: number };

/** Float pyrDown / pyrUp (no rounding), same kernels and borders; pyrUp to an explicit size (as cv2.pyrUp(dstsize=...)). */
export function pyrDownF(img: FImg): FImg {
  const { d, w, h } = img, W = (w + 1) >> 1, H = (h + 1) >> 1, k = [1, 4, 6, 4, 1], tmp = new Float64Array(W * h), out = new Float64Array(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) { let s = 0; for (let q = -2; q <= 2; q++) s += k[q + 2] * d[y * w + r101(2 * x + q, w)]; tmp[y * W + x] = s / 16; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let q = -2; q <= 2; q++) s += k[q + 2] * tmp[r101(2 * y + q, h) * W + x]; out[y * W + x] = s / 16; }
  return { d: out, w: W, h: H };
}
export function pyrUpF(img: FImg, W: number, H: number): FImg {
  const { d, w, h } = img, tmp = new Float64Array(W * h), out = new Float64Array(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) { let s = 0; for (const [i, c] of upIndex(x, w)) s += c * d[y * w + i]; tmp[y * W + x] = s / 8; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (const [i, c] of upIndex(y, h)) s += c * tmp[i * W + x]; out[y * W + x] = s / 8; }
  return { d: out, w: W, h: H };
}

export const toF = (d: ArrayLike<number>, w: number, h: number): FImg => ({ d: Float64Array.from(d), w, h });

export function gaussianPyramid(img: FImg, levels: number) {
  const p = [img]; for (let i = 1; i < levels; i++) p.push(pyrDownF(p[i - 1])); return p;
}

/** Laplacian pyramid: L_i = G_i − up(G_{i+1}); the last level is the smallest Gaussian level. */
export function laplacianPyramid(img: FImg, levels: number) {
  const g = gaussianPyramid(img, levels), L: FImg[] = [];
  for (let i = 0; i < levels - 1; i++) { const u = pyrUpF(g[i + 1], g[i].w, g[i].h); L.push({ d: g[i].d.map((v, j) => v - u.d[j]), w: g[i].w, h: g[i].h }); }
  L.push(g[levels - 1]); return L;
}

export function collapse(L: FImg[]) {
  let cur = L[L.length - 1];
  for (let i = L.length - 2; i >= 0; i--) { const u = pyrUpF(cur, L[i].w, L[i].h); cur = { d: L[i].d.map((v, j) => v + u.d[j]), w: L[i].w, h: L[i].h }; }
  return cur;
}

/** Multiband blend of a and b with mask m (1 = a), one channel: Laplacian pyramids of a and b combined with a Gaussian pyramid of m. */
export function pyramidBlend(a: FImg, b: FImg, m: FImg, levels: number) {
  const La = laplacianPyramid(a, levels), Lb = laplacianPyramid(b, levels), Gm = gaussianPyramid(m, levels);
  return collapse(La.map((l, i) => ({ d: l.d.map((v, j) => Gm[i].d[j] * v + (1 - Gm[i].d[j]) * Lb[i].d[j]), w: l.w, h: l.h })));
}

/** Separable Gaussian blur (float, reflect-101, radius ceil(4σ)). */
export function blurF(img: FImg, sigma: number): FImg {
  const { d, w, h } = img, r = Math.max(1, Math.ceil(4 * sigma)), k: number[] = [];
  for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const s = k.reduce((a, b) => a + b, 0), tmp = new Float64Array(w * h), out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let t = 0; for (let i = -r; i <= r; i++) t += k[i + r] * d[y * w + r101(x + i, w)]; tmp[y * w + x] = t / s; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let t = 0; for (let i = -r; i <= r; i++) t += k[i + r] * tmp[r101(y + i, h) * w + x]; out[y * w + x] = t / s; }
  return { d: out, w, h };
}

/** Difference of Gaussians G(σ·k) − G(σ). */
export function dog(img: FImg, sigma: number, k: number): FImg {
  const a = blurF(img, sigma), b = blurF(img, sigma * k); return { d: b.d.map((v, i) => v - a.d[i]), w: img.w, h: img.h };
}
