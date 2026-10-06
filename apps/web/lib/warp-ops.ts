/** Module 16: geometric warps by inverse mapping (like cv2.warpAffine / warpPerspective / remap), with OpenCV's interpolation kernels. */

export type Interp = "nearest" | "linear" | "cubic";

/** OpenCV's bicubic weights (a = -0.75) for fractional offset t. */
export function cubicWeights(t: number) {
  const A = -0.75;
  const w0 = ((A * (t + 1) - 5 * A) * (t + 1) + 8 * A) * (t + 1) - 4 * A;
  const w1 = ((A + 2) * t - (A + 3)) * t * t + 1;
  const w2 = ((A + 2) * (1 - t) - (A + 3)) * (1 - t) * (1 - t) + 1;
  return [w0, w1, w2, 1 - w0 - w1 - w2];
}

/** Sample a 1-channel image at real position (x, y); outside pixels use `border` (a number) or replicate (null). */
export function sampleAt(img: ArrayLike<number>, w: number, h: number, x: number, y: number, interp: Interp, border: number | null = 0) {
  const get = (xi: number, yi: number) => {
    if (xi < 0 || yi < 0 || xi >= w || yi >= h) { if (border !== null) return border; xi = Math.min(w - 1, Math.max(0, xi)); yi = Math.min(h - 1, Math.max(0, yi)); }
    return img[yi * w + xi];
  };
  if (interp === "nearest") return get(Math.round(x), Math.round(y));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  if (interp === "linear") return (1 - fy) * ((1 - fx) * get(x0, y0) + fx * get(x0 + 1, y0)) + fy * ((1 - fx) * get(x0, y0 + 1) + fx * get(x0 + 1, y0 + 1));
  const wx = cubicWeights(fx), wy = cubicWeights(fy);
  let s = 0;
  for (let j = 0; j < 4; j++) { let r = 0; for (let i = 0; i < 4; i++) r += wx[i] * get(x0 - 1 + i, y0 - 1 + j); s += wy[j] * r; }
  return s;
}

/** Inverse of a 3 × 3 matrix. */
export function inv3(m: number[][]) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
}

/** Warp a packed image (c channels) with a forward 3 × 3 matrix M (affine: last row 0 0 1) into an ow × oh output. */
export function warp(img: ArrayLike<number>, w: number, h: number, c: number, M: number[][], ow: number, oh: number, interp: Interp, border: number | null = 0) {
  const Mi = inv3(M), out = new Uint8ClampedArray(ow * oh * c);
  const planes = Array.from({ length: c }, (_, k) => Float64Array.from({ length: w * h }, (_, i) => img[i * c + k]));
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const ww = Mi[2][0] * x + Mi[2][1] * y + Mi[2][2];
    // OpenCV quantises source positions to 1/32 pixel (INTER_BITS = 5) for linear and cubic interpolation
    let sx = (Mi[0][0] * x + Mi[0][1] * y + Mi[0][2]) / ww, sy = (Mi[1][0] * x + Mi[1][1] * y + Mi[1][2]) / ww;
    if (interp !== "nearest") { sx = Math.round(sx * 32) / 32; sy = Math.round(sy * 32) / 32; }
    for (let k = 0; k < c; k++) out[(y * ow + x) * c + k] = Math.round(sampleAt(planes[k], w, h, sx, sy, interp, border));
  }
  return out;
}

/** cv2.getRotationMatrix2D(center, angle, scale) as a 3 × 3 matrix. */
export function rotationMatrix(cx: number, cy: number, deg: number, s: number) {
  const a = (deg * Math.PI) / 180, al = s * Math.cos(a), be = s * Math.sin(a);
  return [[al, be, (1 - al) * cx - be * cy], [-be, al, be * cx + (1 - al) * cy], [0, 0, 1]];
}

export const mul3 = (A: number[][], B: number[][]) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));

/** cv2.resize-style coordinate mapping (pixel centres aligned): source x = (x + 0.5) / f − 0.5. */
export function resizeGray(img: ArrayLike<number>, w: number, h: number, ow: number, oh: number, interp: Interp | "area") {
  const out = new Uint8ClampedArray(ow * oh), fx = ow / w, fy = oh / h;
  if (interp === "area" && fx <= 1 && fy <= 1) {
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const x0 = x / fx, x1 = (x + 1) / fx, y0 = y / fy, y1 = (y + 1) / fy;
      let s = 0, a = 0;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
        const wx = Math.min(xx + 1, x1) - Math.max(xx, x0), wy = Math.min(yy + 1, y1) - Math.max(yy, y0);
        if (wx > 0 && wy > 0) { s += wx * wy * img[Math.min(h - 1, yy) * w + Math.min(w - 1, xx)]; a += wx * wy; }
      }
      out[y * ow + x] = Math.round(s / a);
    }
    return out;
  }
  const k: Interp = interp === "area" ? "linear" : interp;
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const sx = (x + 0.5) / fx - 0.5, sy = (y + 0.5) / fy - 0.5;
    out[y * ow + x] = Math.round(k === "nearest" ? img[Math.min(h - 1, Math.floor(y / fy)) * w + Math.min(w - 1, Math.floor(x / fx))] : sampleAt(img, w, h, sx, sy, k, null));
  }
  return out;
}

/**
 * Unwrap a ring into a strip, like cv2.warpPolar(img, (R_bins, A_bins), centre, maxRadius, flags) followed by cv2.rotate(..., ROTATE_90_COUNTERCLOCKWISE):
 * column = angle (clockwise on screen from the +x axis), row 0 = largest radius. Log mode spaces radii like WARP_POLAR_LOG.
 */
export function unwrapPolar(img: ArrayLike<number>, w: number, h: number, cx: number, cy: number, maxR: number, aBins: number, rBins: number, log = false) {
  const out = new Uint8ClampedArray(aBins * rBins), M = rBins / Math.log(maxR);
  for (let col = 0; col < aBins; col++) {
    const phi = (2 * Math.PI * col) / aBins, c = Math.cos(phi), s = Math.sin(phi);
    for (let row = 0; row < rBins; row++) {
      const rb = rBins - 1 - row; // radius bin
      const rho = log ? Math.exp(rb / M) - 1 : (rb * maxR) / rBins; // OpenCV log mode: rho = exp(x / Klog) - 1
      out[row * aBins + col] = Math.round(sampleAt(img, w, h, cx + rho * c, cy + rho * s, "linear", 0));
    }
  }
  return out;
}
