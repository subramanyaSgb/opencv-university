/** Module 17: kernels, OpenCV border modes, and 2-D correlation as cv2.filter2D computes it. */

export type Border = "constant" | "replicate" | "reflect" | "reflect101" | "wrap";
export const BORDER_NAME: Record<Border, string> = { constant: "BORDER_CONSTANT", replicate: "BORDER_REPLICATE", reflect: "BORDER_REFLECT", reflect101: "BORDER_REFLECT_101 (default)", wrap: "BORDER_WRAP" };

/** Index mapping of cv::borderInterpolate for a coordinate p in [0, n): returns -1 for constant. */
export function borderIndex(p: number, n: number, b: Border): number {
  if (p >= 0 && p < n) return p;
  if (b === "constant") return -1;
  if (b === "replicate") return p < 0 ? 0 : n - 1;
  if (b === "wrap") return ((p % n) + n) % n;
  if (n === 1) return 0;
  const delta = b === "reflect101" ? 1 : 0;
  while (p < 0 || p >= n) p = p < 0 ? -p - 1 + delta : n - 1 - (p - n) - delta;
  return p;
}

/** Pad a w × h image by r on all sides. */
export function pad(img: ArrayLike<number>, w: number, h: number, r: number, b: Border, value = 0) {
  const W = w + 2 * r, H = h + 2 * r, out = new Float64Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = borderIndex(x - r, w, b), sy = borderIndex(y - r, h, b);
    out[y * W + x] = sx < 0 || sy < 0 ? value : img[sy * w + sx];
  }
  return { d: out, w: W, h: H };
}

/** cv2.filter2D (correlation, anchor at the kernel centre), float result (no rounding). */
export function filter2D(img: ArrayLike<number>, w: number, h: number, k: number[][], b: Border = "reflect101") {
  const kh = k.length, kw = k[0].length, ry = (kh - 1) >> 1, rx = (kw - 1) >> 1, r = Math.max(rx, ry);
  const p = pad(img, w, h, r, b), out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let j = 0; j < kh; j++) for (let i = 0; i < kw; i++) s += k[j][i] * p.d[(y + r - ry + j) * p.w + (x + r - rx + i)];
    out[y * w + x] = s;
  }
  return out;
}

/** Round half to even and saturate to 0..255 (cv2 behaviour for 8-bit output). */
export const toU8 = (a: ArrayLike<number>) => Uint8ClampedArray.from(a as ArrayLike<number>, (v) => { const r = Math.round(v); return Math.abs(v % 1) === 0.5 && r % 2 ? r - 1 : r; });

export const KERNELS: Record<string, { label: string; k: number[][] }> = {
  identity: { label: "identity", k: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
  box: { label: "box 3×3 (mean)", k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)) },
  gauss: { label: "Gaussian 3×3", k: [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map((r) => r.map((v) => v / 16)) },
  sharpen: { label: "sharpen", k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
  sobelx: { label: "Sobel x", k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
  laplace: { label: "Laplacian", k: [[0, 1, 0], [1, -4, 1], [0, 1, 0]] },
  shift: { label: "shift (copy right neighbour)", k: [[0, 0, 0], [0, 0, 1], [0, 0, 0]] },
};
