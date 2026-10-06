// Covariance of 2-D points and the eigen-decomposition of a symmetric 2 × 2 matrix, for PcaLab (Chapter 5.7). Unit-tested.

export type Pt = [number, number];

/** Population covariance (divide by n) of 2-D points: [[sxx, sxy], [sxy, syy]] and the centroid. */
export function covariance(p: Pt[]): { cx: number; cy: number; C: [[number, number], [number, number]] } {
  const n = p.length, cx = p.reduce((s, q) => s + q[0], 0) / n, cy = p.reduce((s, q) => s + q[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  p.forEach(([x, y]) => { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); });
  return { cx, cy, C: [[sxx / n, sxy / n], [sxy / n, syy / n]] };
}

/** Eigenvalues (large first) and unit eigenvectors of a symmetric 2 × 2 matrix [[a, b], [b, d]]. */
export function eigSym2(a: number, b: number, d: number): { l1: number; l2: number; v1: Pt; v2: Pt } {
  const tr = a + d, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  const t = 0.5 * Math.atan2(2 * b, a - d); // angle of the major axis
  const v1: Pt = [Math.cos(t), Math.sin(t)], v2: Pt = [-Math.sin(t), Math.cos(t)];
  return { l1, l2, v1, v2 };
}
