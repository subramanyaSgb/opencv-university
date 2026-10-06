/** Module 24: small polygon helpers for ContourLab (contours themselves are precomputed with OpenCV 4.13). */
export type P = [number, number];

/** Shoelace area of a closed polygon (equals cv2.contourArea for the same points). */
export const polygonArea = (pts: P[]) => Math.abs(pts.reduce((s, [x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; return s + x * v - u * y; }, 0)) / 2;

/** Perimeter of a closed polygon (equals cv2.arcLength(c, True)). */
export const perimeter = (pts: P[]) => pts.reduce((s, [x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; return s + Math.hypot(u - x, v - y); }, 0);

function dp(pts: P[], eps: number): P[] {
  if (pts.length < 3) return pts.slice();
  const [a, b] = [pts[0], pts[pts.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let k = -1, dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], d = L === 0 ? Math.hypot(x - a[0], y - a[1]) : Math.abs((b[0] - a[0]) * (a[1] - y) - (a[0] - x) * (b[1] - a[1])) / L;
    if (d > dmax) { dmax = d; k = i; }
  }
  if (dmax <= eps) return [a, b];
  const l = dp(pts.slice(0, k + 1), eps), r = dp(pts.slice(k), eps);
  return [...l.slice(0, -1), ...r];
}

/** Douglas–Peucker simplification of a closed contour: split at the point farthest from the first, simplify both halves. */
export function approxClosed(pts: P[], eps: number): P[] {
  if (pts.length < 4) return pts.slice();
  let far = 0, dm = -1; pts.forEach(([x, y], i) => { const d = Math.hypot(x - pts[0][0], y - pts[0][1]); if (d > dm) { dm = d; far = i; } });
  const a = dp(pts.slice(0, far + 1), eps), b = dp([...pts.slice(far), pts[0]], eps);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}
