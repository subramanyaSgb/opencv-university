// Least-squares fitting for FitLab (Chapter 5.6): y = a x + b, total least squares (perpendicular), a Huber-weighted
// robust line, and an algebraic circle fit. Unit-tested.

export type Pt = [number, number];
export type Line = { cx: number; cy: number; dx: number; dy: number }; // point on the line + unit direction

/** Ordinary least squares y = a x + b (vertical residuals). */
export function ols(p: Pt[]): { a: number; b: number } {
  const n = p.length, mx = p.reduce((s, q) => s + q[0], 0) / n, my = p.reduce((s, q) => s + q[1], 0) / n;
  let sxy = 0, sxx = 0;
  p.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; });
  const a = sxx === 0 ? NaN : sxy / sxx;
  return { a, b: my - a * mx };
}

/** Weighted total least squares: line through the weighted centroid along the main axis of the scatter. */
export function tls(p: Pt[], w: number[] = p.map(() => 1)): Line {
  const W = w.reduce((s, v) => s + v, 0);
  const cx = p.reduce((s, q, i) => s + w[i] * q[0], 0) / W, cy = p.reduce((s, q, i) => s + w[i] * q[1], 0) / W;
  let sxx = 0, syy = 0, sxy = 0;
  p.forEach(([x, y], i) => { sxx += w[i] * (x - cx) ** 2; syy += w[i] * (y - cy) ** 2; sxy += w[i] * (x - cx) * (y - cy); });
  const t = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  let dx = Math.cos(t), dy = Math.sin(t);
  if (dy < 0 || (dy === 0 && dx < 0)) { dx = -dx; dy = -dy; }
  return { cx, cy, dx, dy };
}

/** Signed perpendicular distance of a point from a line. */
export const perp = (l: Line, [x, y]: Pt) => (x - l.cx) * l.dy - (y - l.cy) * l.dx;

/** Robust line: iteratively reweighted TLS with Huber weights (c = 1.345 × robust σ of the residuals). */
export function huber(p: Pt[], iterations = 20): Line {
  let l = tls(p);
  for (let k = 0; k < iterations; k++) {
    const r = p.map((q) => Math.abs(perp(l, q)));
    const sorted = [...r].sort((a, b) => a - b);
    const sigma = Math.max(1e-6, 1.4826 * sorted[Math.floor(sorted.length / 2)]);
    const c = 1.345 * sigma;
    l = tls(p, r.map((v) => (v <= c ? 1 : c / v)));
  }
  return l;
}

/** Algebraic (Kasa) circle fit: x² + y² + D x + E y + F = 0 by least squares (3 × 3 normal equations). */
export function circleFit(p: Pt[]): { cx: number; cy: number; r: number } {
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], t = [0, 0, 0];
  p.forEach(([x, y]) => {
    const row = [x, y, 1], z = -(x * x + y * y);
    for (let i = 0; i < 3; i++) { t[i] += row[i] * z; for (let j = 0; j < 3; j++) S[i][j] += row[i] * row[j]; }
  });
  // solve S [D E F] = t (Cramer's rule, 3 × 3)
  const det3 = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const d = det3(S);
  const col = (k: number) => det3(S.map((r, i) => r.map((v, j) => (j === k ? t[i] : v)))) / d;
  const D = col(0), E = col(1), F = col(2);
  const cx = -D / 2, cy = -E / 2;
  return { cx, cy, r: Math.sqrt(cx * cx + cy * cy - F) };
}
