/** Module 29: shape descriptors. Freeman chain codes, contour moments and Hu moments (as cv2.moments on a contour and
 *  cv2.HuMoments), cv2.matchShapes (I1, I2, I3), Fourier descriptors and reconstruction, and point transforms. */
export type P = [number, number];

/** 8-direction Freeman chain code of a closed pixel contour: 0 = right, 1 = up-right, 2 = up, … 7 = down-right
 *  (image y points down, so "up" is −y). */
export function chainCode(pts: P[]) {
  const dirs: Record<string, number> = { "1,0": 0, "1,-1": 1, "0,-1": 2, "-1,-1": 3, "-1,0": 4, "-1,1": 5, "0,1": 6, "1,1": 7 };
  return pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return dirs[`${q[0] - p[0]},${q[1] - p[1]}`]; });
}
/** First difference (rotation-invariant): (c[i] − c[i−1]) mod 8, cyclic. */
export const chainDiff = (c: number[]) => c.map((v, i) => (((v - c[(i - 1 + c.length) % c.length]) % 8) + 8) % 8);
/** Shape number: the cyclic rotation of a sequence that forms the smallest number (starting-point invariance). */
export function minRotation(c: number[]) {
  let best = 0;
  for (let s = 1; s < c.length; s++) for (let k = 0; k < c.length; k++) { const a = c[(s + k) % c.length], b = c[(best + k) % c.length]; if (a !== b) { if (a < b) best = s; break; } }
  return c.slice(best).concat(c.slice(0, best));
}

export type Moments = Record<"m00" | "m10" | "m01" | "m20" | "m11" | "m02" | "m30" | "m21" | "m12" | "m03" | "mu20" | "mu11" | "mu02" | "mu30" | "mu21" | "mu12" | "mu03" | "nu20" | "nu11" | "nu02" | "nu30" | "nu21" | "nu12" | "nu03", number>;
/** Moments of a polygon (Green's theorem), like cv2.moments(contour): sign made positive. */
export function polygonMoments(pts: P[]): Moments {
  let a00 = 0, a10 = 0, a01 = 0, a20 = 0, a11 = 0, a02 = 0, a30 = 0, a21 = 0, a12 = 0, a03 = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [xi_1, yi_1] = pts[(i - 1 + n) % n], [xi, yi] = pts[i];
    const xi2 = xi * xi, yi2 = yi * yi, dxy = xi_1 * yi - xi * yi_1, xii_1 = xi_1 + xi, yii_1 = yi_1 + yi, xi_12 = xi_1 * xi_1, yi_12 = yi_1 * yi_1;
    a00 += dxy; a10 += dxy * xii_1; a01 += dxy * yii_1;
    a20 += dxy * (xi_1 * xii_1 + xi2); a11 += dxy * (xi_1 * (yii_1 + yi_1) + xi * (yii_1 + yi)); a02 += dxy * (yi_1 * yii_1 + yi2);
    a30 += dxy * xii_1 * (xi_12 + xi2); a03 += dxy * yii_1 * (yi_12 + yi2);
    a21 += dxy * (xi_12 * (3 * yi_1 + yi) + 2 * xi * xi_1 * yii_1 + xi2 * (yi_1 + 3 * yi));
    a12 += dxy * (yi_12 * (3 * xi_1 + xi) + 2 * yi * yi_1 * xii_1 + yi2 * (xi_1 + 3 * xi));
  }
  let s = 1; if (a00 < 0) s = -1;
  const m00 = (s * a00) / 2, m10 = (s * a10) / 6, m01 = (s * a01) / 6, m20 = (s * a20) / 12, m11 = (s * a11) / 24, m02 = (s * a02) / 12;
  const m30 = (s * a30) / 20, m21 = (s * a21) / 60, m12 = (s * a12) / 60, m03 = (s * a03) / 20;
  const cx = m10 / m00, cy = m01 / m00;
  const mu20 = m20 - m10 * cx, mu11 = m11 - m10 * cy, mu02 = m02 - m01 * cy;
  const mu30 = m30 - cx * (3 * mu20 + cx * m10), mu21 = m21 - cx * (2 * mu11 + cx * m01) - cy * mu20;
  const mu12 = m12 - cy * (2 * mu11 + cy * m10) - cx * mu02, mu03 = m03 - cy * (3 * mu02 + cy * m01);
  const inv2 = 1 / (m00 * m00), inv3 = inv2 / Math.sqrt(Math.abs(m00));
  return { m00, m10, m01, m20, m11, m02, m30, m21, m12, m03, mu20, mu11, mu02, mu30, mu21, mu12, mu03,
    nu20: mu20 * inv2, nu11: mu11 * inv2, nu02: mu02 * inv2, nu30: mu30 * inv3, nu21: mu21 * inv3, nu12: mu12 * inv3, nu03: mu03 * inv3 };
}

/** The seven Hu invariants (cv2.HuMoments). */
export function huMoments(m: Moments) {
  const t0 = m.nu30 + m.nu12, t1 = m.nu21 + m.nu03, q0 = t0 * t0, q1 = t1 * t1, n4 = 4 * m.nu11, s = m.nu20 + m.nu02, d = m.nu20 - m.nu02;
  const h0 = s, h1 = d * d + n4 * m.nu11;
  const p0 = m.nu30 - 3 * m.nu12, p1 = 3 * m.nu21 - m.nu03;
  const h2 = p0 * p0 + p1 * p1, h3 = q0 + q1;
  const h4 = p0 * t0 * (q0 - 3 * q1) + p1 * t1 * (3 * q0 - q1);
  const h5 = d * (q0 - q1) + n4 * t0 * t1;
  const h6 = p1 * t0 * (q0 - 3 * q1) - p0 * t1 * (3 * q0 - q1);
  return [h0, h1, h2, h3, h4, h5, h6];
}
/** −sign(h)·log10|h|: the usual readable form of Hu moments. */
export const logHu = (h: number[]) => h.map((v) => (v === 0 ? 0 : -Math.sign(v) * Math.log10(Math.abs(v))));

/** cv2.matchShapes(a, b, method, 0) on two contours (method 1, 2 or 3 = CONTOURS_MATCH_I1/I2/I3). */
export function matchShapes(a: P[], b: P[], method: 1 | 2 | 3) {
  const ha = huMoments(polygonMoments(a)), hb = huMoments(polygonMoments(b)), eps = 1e-5;
  let r = 0;
  for (let i = 0; i < 7; i++) {
    let A = Math.abs(ha[i]), B = Math.abs(hb[i]);
    if (A <= eps || B <= eps) continue;
    const sa = Math.sign(ha[i]), sb = Math.sign(hb[i]);
    if (method === 1) { A = 1 / (sa * Math.log10(A)); B = 1 / (sb * Math.log10(B)); r += Math.abs(-A + B); }
    else if (method === 2) { A = sa * Math.log10(A); B = sb * Math.log10(B); r += Math.abs(-A + B); }
    else { A = sa * Math.log10(A); B = sb * Math.log10(B); const mm = Math.abs((A - B) / A); if (r < mm) r = mm; }
  }
  return r;
}

/** Resample a closed contour to n points equally spaced along its length (complex numbers as [re, im]). */
export function resampleClosed(pts: P[], n: number): P[] {
  const m = pts.length, s = new Float64Array(m + 1);
  for (let i = 0; i < m; i++) s[i + 1] = s[i] + Math.hypot(pts[(i + 1) % m][0] - pts[i][0], pts[(i + 1) % m][1] - pts[i][1]);
  const out: P[] = []; let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (s[m] * k) / n; while (j < m - 1 && s[j + 1] < t) j++;
    const f = s[j + 1] > s[j] ? (t - s[j]) / (s[j + 1] - s[j]) : 0, a = pts[j], b = pts[(j + 1) % m];
    out.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])]);
  }
  return out;
}
/** DFT of a closed contour z = x + i y (n samples). Returns [re, im] per coefficient k = 0 … n − 1. */
export function contourDFT(z: P[]) {
  const n = z.length;
  return Array.from({ length: n }, (_, k) => {
    let re = 0, im = 0;
    for (let t = 0; t < n; t++) { const a = (-2 * Math.PI * k * t) / n, c = Math.cos(a), s = Math.sin(a); re += z[t][0] * c - z[t][1] * s; im += z[t][0] * s + z[t][1] * c; }
    return [re, im] as P;
  });
}
/** Inverse DFT keeping only the coefficients with |frequency| ≤ K (K ≥ 1). */
export function reconstruct(F: P[], K: number): P[] {
  const n = F.length, keep = (k: number) => { const f = k <= n / 2 ? k : k - n; return Math.abs(f) <= K; };
  return Array.from({ length: n }, (_, t) => {
    let x = 0, y = 0;
    for (let k = 0; k < n; k++) { if (!keep(k)) continue; const a = (2 * Math.PI * k * t) / n, c = Math.cos(a), s = Math.sin(a); x += F[k][0] * c - F[k][1] * s; y += F[k][0] * s + F[k][1] * c; }
    return [x / n, y / n] as P;
  });
}
/** Invariant Fourier descriptor: |F(k)| / |F(±1)| for k = 2 … K and −K … −2 (drops F0 = position and phase = rotation/start). */
export function fourierDescriptor(pts: P[], n = 64, K = 10) {
  const F = contourDFT(resampleClosed(pts, n)), mag = F.map(([a, b]) => Math.hypot(a, b));
  const ref = Math.max(mag[1], mag[n - 1]), out: number[] = [];
  for (let k = 2; k <= K; k++) out.push(mag[k] / ref);
  for (let k = n - K; k <= n - 2; k++) out.push(mag[k] / ref);
  return out;
}
export const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));

/** Rotate (degrees), scale and optionally mirror points about their centroid, then move to (cx, cy). */
export function transform(pts: P[], angle: number, scale: number, mirror: boolean, cx: number, cy: number): P[] {
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const a = (angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => { let u = x - mx; const v = y - my; if (mirror) u = -u; return [cx + scale * (c * u - s * v), cy + scale * (s * u + c * v)] as P; });
}
