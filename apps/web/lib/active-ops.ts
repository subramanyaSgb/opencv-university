/** Module 28: active contours. A parametric snake (Kass, Witkin, Terzopoulos 1988) with the semi-implicit update
 *  x ← (I + τA)⁻¹ (x + τ F), edge force from |∇(G_σ * I)|², optional balloon force, periodic resampling; and the
 *  Chan–Vese level set (2001) with np.gradient-style finite differences. Same formulas as the chapter's NumPy code. */
import { gaussBlur } from "./edge-ops.ts";

/** Pentadiagonal snake matrix A (elasticity α, rigidity β) for a closed contour of n points, and P = (I + τA)⁻¹. */
export function snakeMatrix(n: number, alpha: number, beta: number, tau: number) {
  const M = Array.from({ length: n }, (_, i) => { const r = new Float64Array(n); r[i] = 1; return r; });
  const c: [number, number][] = [[-2, beta], [-1, -alpha - 4 * beta], [0, 2 * alpha + 6 * beta], [1, -alpha - 4 * beta], [2, beta]];
  for (let i = 0; i < n; i++) for (const [k, v] of c) M[i][(((i + k) % n) + n) % n] += tau * v;
  return invert(M);
}
function invert(M: Float64Array[]) {
  const n = M.length, A = M.map((r) => Float64Array.from(r)), I = Array.from({ length: n }, (_, i) => { const r = new Float64Array(n); r[i] = 1; return r; });
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [I[c], I[p]] = [I[p], I[c]];
    const d = A[c][c]; for (let k = 0; k < n; k++) { A[c][k] /= d; I[c][k] /= d; }
    for (let r = 0; r < n; r++) if (r !== c && A[r][c] !== 0) { const f = A[r][c]; for (let k = 0; k < n; k++) { A[r][k] -= f * A[c][k]; I[r][k] -= f * I[c][k]; } }
  }
  return I;
}

/** Edge force field: E = |∇(G_σ * I)|² normalised to max 1, F = ∇E normalised to max magnitude 1. */
export function edgeForce(img: ArrayLike<number>, w: number, h: number, sigma: number) {
  const g = gaussBlur(img, w, h, sigma), E = new Float64Array(w * h);
  const at = (a: ArrayLike<number>, x: number, y: number) => a[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  let mx = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const gx = (at(g, x + 1, y) - at(g, x - 1, y)) / 2, gy = (at(g, x, y + 1) - at(g, x, y - 1)) / 2; const e = gx * gx + gy * gy; E[y * w + x] = e; if (e > mx) mx = e; }
  const Fx = new Float64Array(w * h), Fy = new Float64Array(w * h); let fm = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; Fx[i] = (at(E, x + 1, y) - at(E, x - 1, y)) / 2 / mx; Fy[i] = (at(E, x, y + 1) - at(E, x, y - 1)) / 2 / mx; fm = Math.max(fm, Math.hypot(Fx[i], Fy[i])); }
  for (let i = 0; i < w * h; i++) { Fx[i] /= fm || 1; Fy[i] /= fm || 1; }
  return { E, Fx, Fy };
}

export function bilinear(F: ArrayLike<number>, w: number, h: number, x: number, y: number) {
  x = Math.min(w - 1.001, Math.max(0, x)); y = Math.min(h - 1.001, Math.max(0, y));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return F[i] * (1 - fx) * (1 - fy) + F[i + 1] * fx * (1 - fy) + F[i + w] * (1 - fx) * fy + F[i + w + 1] * fx * fy;
}

/** Resample a closed polygon to n points equally spaced along its length. */
export function resample(x: Float64Array, y: Float64Array, n: number) {
  const m = x.length, s = new Float64Array(m + 1);
  for (let i = 0; i < m; i++) s[i + 1] = s[i] + Math.hypot(x[(i + 1) % m] - x[i], y[(i + 1) % m] - y[i]);
  const X = new Float64Array(n), Y = new Float64Array(n); let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (s[m] * k) / n; while (j < m - 1 && s[j + 1] < t) j++;
    const f = s[j + 1] > s[j] ? (t - s[j]) / (s[j + 1] - s[j]) : 0;
    X[k] = x[j] + f * (x[(j + 1) % m] - x[j]); Y[k] = y[j] + f * (y[(j + 1) % m] - y[j]);
  }
  return [X, Y] as const;
}

export type SnakeParams = { alpha: number; beta: number; tau: number; wEdge: number; balloon: number };
/** One snake step: x ← P (x + τ (w_edge F + balloon · outward normal)). */
export function snakeStep(x: Float64Array, y: Float64Array, P: Float64Array[], F: { Fx: Float64Array; Fy: Float64Array }, w: number, h: number, p: SnakeParams) {
  const n = x.length, bx = new Float64Array(n), by = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const nx = y[(i + 1) % n] - y[(i - 1 + n) % n], ny = -(x[(i + 1) % n] - x[(i - 1 + n) % n]), L = Math.hypot(nx, ny) + 1e-12;
    bx[i] = x[i] + p.tau * (p.wEdge * bilinear(F.Fx, w, h, x[i], y[i]) + (p.balloon * nx) / L);
    by[i] = y[i] + p.tau * (p.wEdge * bilinear(F.Fy, w, h, x[i], y[i]) + (p.balloon * ny) / L);
  }
  const X = new Float64Array(n), Y = new Float64Array(n);
  for (let i = 0; i < n; i++) { let sx = 0, sy = 0; const r = P[i]; for (let k = 0; k < n; k++) { sx += r[k] * bx[k]; sy += r[k] * by[k]; } X[i] = sx; Y[i] = sy; }
  return [X, Y] as const;
}

/** np.gradient along x and y (central differences inside, one-sided at the borders). */
export function gradient(f: ArrayLike<number>, w: number, h: number) {
  const gx = new Float64Array(w * h), gy = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    gx[i] = x === 0 ? f[i + 1] - f[i] : x === w - 1 ? f[i] - f[i - 1] : (f[i + 1] - f[i - 1]) / 2;
    gy[i] = y === 0 ? f[i + w] - f[i] : y === h - 1 ? f[i] - f[i - w] : (f[i + w] - f[i - w]) / 2;
  }
  return { gx, gy };
}

/** One Chan–Vese step on img in [0, 1]: φ ← φ + dt δε(φ) (μ κ − λ1 (I − c1)² + λ2 (I − c2)²). */
export function chanVeseStep(phi: Float64Array, img: ArrayLike<number>, w: number, h: number, mu: number, l1: number, l2: number, dt = 0.5, eps = 1) {
  let s1 = 0, n1 = 0, s2 = 0, n2 = 0;
  for (let i = 0; i < w * h; i++) if (phi[i] > 0) { s1 += img[i]; n1++; } else { s2 += img[i]; n2++; }
  const c1 = n1 ? s1 / n1 : 0, c2 = n2 ? s2 / n2 : 0;
  const { gx, gy } = gradient(phi, w, h), nx = new Float64Array(w * h), ny = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) { const n = Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i]) + 1e-8; nx[i] = gx[i] / n; ny[i] = gy[i] / n; }
  const kx = gradient(nx, w, h).gx, ky = gradient(ny, w, h).gy, out = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const d = eps / (Math.PI * (eps * eps + phi[i] * phi[i]));
    out[i] = phi[i] + dt * d * (mu * (kx[i] + ky[i]) - l1 * (img[i] - c1) ** 2 + l2 * (img[i] - c2) ** 2);
  }
  return { phi: out, c1, c2 };
}
