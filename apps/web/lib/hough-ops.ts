/** Module 26: standard Hough transform for lines (same accumulator and peak rules as cv2.HoughLines), gradient-based
 *  circle-centre voting (the idea of cv2.HOUGH_GRADIENT), RANSAC line fitting, and circle/ellipse fits
 *  (Kåsa algebraic, geometric Gauss–Newton, Fitzgibbon direct ellipse = cv2.fitEllipseDirect). Unit-tested. */
import { rng } from "./denoise-ops.ts";
import { tls, perp, type Pt, type Line } from "./fit-ops.ts";
export { rng, tls, perp, type Pt, type Line };

const f32 = Math.fround;
/** cvRound: round half to even. */
export const cvRound = (v: number) => { const r = Math.round(v); return Math.abs(v % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r; };

export type HoughLines = { acc: Int32Array; numrho: number; numangle: number; rho: number; theta: number; lines: { rho: number; theta: number; votes: number }[] };

/** cv2.HoughLines(edges, rho, theta, threshold): accumulator of size numangle × numrho and the peaks, strongest first. */
export function houghLines(edge: ArrayLike<number>, w: number, h: number, rho: number, theta: number, threshold: number): HoughLines {
  const irho = f32(1 / rho);
  let numangle = Math.floor(Math.PI / theta) + 1;
  if (numangle > 1 && Math.abs(Math.PI - (numangle - 1) * theta) < theta / 2) numangle--;
  const numrho = cvRound(((w + h) * 2 + 1) / rho);
  const tabSin = new Float64Array(numangle), tabCos = new Float64Array(numangle);
  let ang = f32(0);
  for (let n = 0; n < numangle; n++, ang = f32(ang + f32(theta))) { tabSin[n] = f32(Math.sin(ang) * irho); tabCos[n] = f32(Math.cos(ang) * irho); }
  const A = new Int32Array((numangle + 2) * (numrho + 2)), half = Math.floor((numrho - 1) / 2);
  for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
    if (!edge[i * w + j]) continue;
    for (let n = 0; n < numangle; n++) { const r = cvRound(f32(f32(j * tabCos[n]) + f32(i * tabSin[n]))) + half; A[(n + 1) * (numrho + 2) + r + 1]++; }
  }
  const peaks: number[] = [];
  for (let r = 0; r < numrho; r++) for (let n = 0; n < numangle; n++) {
    const b = (n + 1) * (numrho + 2) + r + 1, v = A[b];
    if (v > threshold && v > A[b - 1] && v >= A[b + 1] && v > A[b - numrho - 2] && v >= A[b + numrho + 2]) peaks.push(b);
  }
  peaks.sort((a, b) => A[b] - A[a] || a - b);
  const lines = peaks.map((b) => { const n = Math.floor(b / (numrho + 2)) - 1, r = b - (n + 1) * (numrho + 2) - 1; return { rho: (r - half) * rho, theta: f32(n * theta), votes: A[b] }; });
  // compact accumulator without the border, row n = angle, column r = rho bin
  const acc = new Int32Array(numangle * numrho);
  for (let n = 0; n < numangle; n++) for (let r = 0; r < numrho; r++) acc[n * numrho + r] = A[(n + 1) * (numrho + 2) + r + 1];
  return { acc, numrho, numangle, rho, theta, lines };
}

/** End points of the line x cos θ + y sin θ = ρ clipped to the image rectangle (null if it misses). */
export function lineEnds(rho: number, theta: number, w: number, h: number): [number, number, number, number] | null {
  const c = Math.cos(theta), s = Math.sin(theta), pts: [number, number][] = [];
  const add = (x: number, y: number) => { if (x >= -1e-9 && x <= w + 1e-9 && y >= -1e-9 && y <= h + 1e-9 && !pts.some(([a, b]) => Math.abs(a - x) < 1e-6 && Math.abs(b - y) < 1e-6)) pts.push([x, y]); };
  if (Math.abs(s) > 1e-9) { add(0, rho / s); add(w, (rho - w * c) / s); }
  if (Math.abs(c) > 1e-9) { add(rho / c, 0); add((rho - h * s) / c, h); }
  return pts.length >= 2 ? [pts[0][0], pts[0][1], pts[1][0], pts[1][1]] : null;
}

/** Circle centres by gradient voting: every edge pixel votes along its gradient direction (both ways) for distances
 *  minR…maxR. Returns the accumulator and centres (local maxima ≥ votes, at least minDist apart), each with the radius
 *  that the most edge pixels support. */
export function houghCircles(edge: ArrayLike<number>, gx: ArrayLike<number>, gy: ArrayLike<number>, w: number, h: number, minR: number, maxR: number, votes: number, minDist: number) {
  const acc = new Int32Array(w * h), pts: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!edge[i]) continue;
    const m = Math.hypot(gx[i], gy[i]); if (!m) continue;
    pts.push(i);
    const dx = gx[i] / m, dy = gy[i] / m, x0 = i % w, y0 = (i / w) | 0;
    for (const sgn of [1, -1]) for (let r = minR; r <= maxR; r++) {
      const x = Math.round(x0 + sgn * r * dx), y = Math.round(y0 + sgn * r * dy);
      if (x >= 0 && x < w && y >= 0 && y < h) acc[y * w + x]++;
    }
  }
  const cand: number[] = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, v = acc[i];
    if (v >= votes && v > acc[i - 1] && v >= acc[i + 1] && v > acc[i - w] && v >= acc[i + w]) cand.push(i);
  }
  cand.sort((a, b) => acc[b] - acc[a] || a - b);
  const centres: { x: number; y: number; r: number; votes: number; support: number }[] = [];
  for (const i of cand) {
    const x = i % w, y = (i / w) | 0;
    if (centres.some((c) => Math.hypot(c.x - x, c.y - y) < minDist)) continue;
    const hist = new Int32Array(maxR + 2);
    for (const p of pts) { const d = Math.round(Math.hypot((p % w) - x, ((p / w) | 0) - y)); if (d >= minR && d <= maxR) hist[d]++; }
    let best = minR; for (let r = minR; r <= maxR; r++) if (hist[r] + (hist[r + 1] ?? 0) > hist[best] + (hist[best + 1] ?? 0)) best = r;
    centres.push({ x, y, r: best + (hist[best + 1] > hist[best] ? 0.5 : 0), votes: acc[i], support: hist[best] + (hist[best + 1] ?? 0) });
  }
  return { acc, centres };
}

/** Number of RANSAC iterations for success probability p, inlier ratio wIn and sample size s. */
export const ransacIterations = (p: number, wIn: number, s: number) => Math.ceil(Math.log(1 - p) / Math.log(1 - wIn ** s));

export type RansacStep = { i: number; j: number; inliers: number; best: number };
/** RANSAC line: random point pairs, count points within `thr`, keep the best, refit by total least squares on its inliers. */
export function ransacLine(p: Pt[], iterations: number, thr: number, seed = 1) {
  const r = rng(seed), steps: RansacStep[] = [];
  let best = -1, bestPair: [number, number] = [0, 1];
  for (let k = 0; k < iterations; k++) {
    const i = Math.floor(r() * p.length); let j = Math.floor(r() * (p.length - 1)); if (j >= i) j++;
    const l = through(p[i], p[j]);
    const n = l ? p.filter((q) => Math.abs(perp(l, q)) <= thr).length : 0;
    if (n > best) { best = n; bestPair = [i, j]; }
    steps.push({ i, j, inliers: n, best });
  }
  const l0 = through(p[bestPair[0]], p[bestPair[1]])!;
  const inl = p.map((q) => Math.abs(perp(l0, q)) <= thr);
  const refit = tls(p.filter((_, k) => inl[k]));
  return { steps, pair: bestPair, line: l0, inliers: inl, refit };
}
export function through(a: Pt, b: Pt): Line | null {
  const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy);
  return m ? { cx: a[0], cy: a[1], dx: dx / m, dy: dy / m } : null;
}

/** Kåsa algebraic circle fit: least squares on x² + y² + D x + E y + F = 0. */
export function circleKasa(p: Pt[]) {
  // normal equations 3 × 3
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
  for (const [x, y] of p) { const row = [x, y, 1], z = -(x * x + y * y); for (let a = 0; a < 3; a++) { v[a] += row[a] * z; for (let b = 0; b < 3; b++) M[a][b] += row[a] * row[b]; } }
  const [D, E, F] = solve3(M, v);
  const cx = -D / 2, cy = -E / 2;
  return { cx, cy, r: Math.sqrt(Math.max(0, cx * cx + cy * cy - F)) };
}

/** Geometric circle fit: minimise Σ (‖p − c‖ − r)² by Gauss–Newton, starting from the Kåsa fit. */
export function circleGeometric(p: Pt[], iterations = 50) {
  let { cx, cy, r } = circleKasa(p);
  for (let it = 0; it < iterations; it++) {
    const JtJ = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], Jtr = [0, 0, 0];
    for (const [x, y] of p) {
      const d = Math.hypot(x - cx, y - cy) || 1e-12, res = d - r, J = [-(x - cx) / d, -(y - cy) / d, -1];
      for (let a = 0; a < 3; a++) { Jtr[a] += J[a] * res; for (let b = 0; b < 3; b++) JtJ[a][b] += J[a] * J[b]; }
    }
    const [a, b, c] = solve3(JtJ, Jtr);
    cx -= a; cy -= b; r -= c;
    if (Math.abs(a) + Math.abs(b) + Math.abs(c) < 1e-10) break;
  }
  return { cx, cy, r };
}

/** RMS distance of points from a circle. */
export const circleRms = (p: Pt[], c: { cx: number; cy: number; r: number }) => Math.sqrt(p.reduce((s, [x, y]) => s + (Math.hypot(x - c.cx, y - c.cy) - c.r) ** 2, 0) / p.length);

function solve3(M: number[][], v: number[]): [number, number, number] {
  const A = M.map((r, i) => [...r, v[i]]);
  for (let c = 0; c < 3; c++) {
    let piv = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; }
  }
  return [A[0][3] / A[0][0], A[1][3] / A[1][1], A[2][3] / A[2][2]];
}

export type Ellipse = { cx: number; cy: number; a: number; b: number; angle: number }; // semi-axes a ≥ b, angle of a in degrees (0…180)

/** Direct least-squares ellipse fit (Fitzgibbon, Pilu, Fisher 1999) in the numerically stable form of Halíř and Flusser
 *  (1998). Same ellipse as cv2.fitEllipseDirect. Points are centred and scaled first. */
export function ellipseDirect(p: Pt[]): Ellipse | null {
  const n = p.length; if (n < 5) return null;
  const mx = p.reduce((s, q) => s + q[0], 0) / n, my = p.reduce((s, q) => s + q[1], 0) / n;
  const sc = Math.sqrt(p.reduce((s, [x, y]) => s + (x - mx) ** 2 + (y - my) ** 2, 0) / n) || 1;
  const S1 = z3(), S2 = z3(), S3 = z3();
  for (const [X, Y] of p) {
    const x = (X - mx) / sc, y = (Y - my) / sc, d1 = [x * x, x * y, y * y], d2 = [x, y, 1];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { S1[a][b] += d1[a] * d1[b]; S2[a][b] += d1[a] * d2[b]; S3[a][b] += d2[a] * d2[b]; }
  }
  const S3i = inv3(S3); if (!S3i) return null;
  const T = mul3(scale3(S3i, -1), tr3(S2)); // a2 = T a1
  const M0 = add3(S1, mul3(S2, T));
  const M = [[M0[2][0] / 2, M0[2][1] / 2, M0[2][2] / 2], [-M0[1][0], -M0[1][1], -M0[1][2]], [M0[0][0] / 2, M0[0][1] / 2, M0[0][2] / 2]];
  let best: number[] | null = null;
  for (const lam of eig3(M)) {
    const v = nullVec([[M[0][0] - lam, M[0][1], M[0][2]], [M[1][0], M[1][1] - lam, M[1][2]], [M[2][0], M[2][1], M[2][2] - lam]]);
    if (v && 4 * v[0] * v[2] - v[1] * v[1] > 0) { best = v; break; }
  }
  if (!best) return null;
  const a2 = [0, 1, 2].map((r) => T[r][0] * best![0] + T[r][1] * best![1] + T[r][2] * best![2]);
  let [A, B, C] = best, [D, E, F] = a2;
  if (A + C < 0) { [A, B, C, D, E, F] = [-A, -B, -C, -D, -E, -F]; }
  // conic in normalised coordinates → centre, axes, angle
  const den = B * B - 4 * A * C;
  const x0 = (2 * C * D - B * E) / den, y0 = (2 * A * E - B * D) / den;
  const F0 = A * x0 * x0 + B * x0 * y0 + C * y0 * y0 + D * x0 + E * y0 + F;
  const root = Math.sqrt((A - C) ** 2 + B * B), l1 = (A + C + root) / 2, l2 = (A + C - root) / 2;
  const ax1 = Math.sqrt(-F0 / l2), ax2 = Math.sqrt(-F0 / l1); // ax1 ≥ ax2 (l2 ≤ l1)
  // direction of the major axis: eigenvector of [[A, B/2], [B/2, C]] for eigenvalue l2
  let ang = Math.abs(B) < 1e-15 ? (A <= C ? 0 : 90) : (Math.atan2(l2 - A, B / 2) * 180) / Math.PI;
  ang = ((ang % 180) + 180) % 180;
  return { cx: mx + x0 * sc, cy: my + y0 * sc, a: ax1 * sc, b: ax2 * sc, angle: ang };
}
const z3 = () => [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
const tr3 = (A: number[][]) => A[0].map((_, c) => A.map((r) => r[c]));
const mul3 = (A: number[][], B: number[][]) => A.map((r) => B[0].map((_, c) => r.reduce((s, v, k) => s + v * B[k][c], 0)));
const add3 = (A: number[][], B: number[][]) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
const scale3 = (A: number[][], s: number) => A.map((r) => r.map((v) => v * s));
function inv3(m: number[][]) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-300) return null;
  return [[A, -(b * i - c * h), b * f - c * e], [B, a * i - c * g, -(a * f - c * d)], [C, -(a * h - b * g), a * e - b * d]].map((r) => r.map((v) => v / det));
}
/** Real eigenvalues of a 3 × 3 matrix (roots of the characteristic cubic). */
function eig3(M: number[][]) {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  const p2 = -(a + e + i), p1 = a * e + a * i + e * i - b * d - c * g - f * h, p0 = -(a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g));
  const Q = (3 * p1 - p2 * p2) / 9, R = (9 * p2 * p1 - 27 * p0 - 2 * p2 ** 3) / 54, D = Q ** 3 + R * R;
  if (D > 0) { const s = Math.cbrt(R + Math.sqrt(D)), t = Math.cbrt(R - Math.sqrt(D)); return [s + t - p2 / 3]; }
  const th = Math.acos(Math.max(-1, Math.min(1, R / Math.sqrt(-(Q ** 3))))), m = 2 * Math.sqrt(-Q);
  return [0, 2, 4].map((k) => m * Math.cos((th + k * Math.PI) / 3) - p2 / 3);
}
/** A null vector of a (near-)singular 3 × 3 matrix: the largest cross product of two rows. */
function nullVec(A: number[][]) {
  const cr = (u: number[], v: number[]) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const cands = [cr(A[0], A[1]), cr(A[0], A[2]), cr(A[1], A[2])];
  const v = cands.reduce((a, b) => (Math.hypot(...b) > Math.hypot(...a) ? b : a));
  const m = Math.hypot(...v); return m ? v.map((x) => x / m) : null;
}

/** Points on an elliptical arc (degrees a0…a1) with Gaussian noise and uniform outliers in the box; seeded. */
export function arcPoints(e: Ellipse, a0: number, a1: number, n: number, sigma: number, outliers: number, box: [number, number], seed = 3): Pt[] {
  const r = rng(seed), g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const ca = Math.cos((e.angle * Math.PI) / 180), sa = Math.sin((e.angle * Math.PI) / 180), out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const t = ((a0 + ((a1 - a0) * (k + 0.5)) / n) * Math.PI) / 180, x = e.a * Math.cos(t), y = e.b * Math.sin(t);
    out.push([e.cx + x * ca - y * sa + sigma * g(), e.cy + x * sa + y * ca + sigma * g()]);
  }
  for (let k = 0; k < outliers; k++) out.push([r() * box[0], r() * box[1]]);
  return out;
}
