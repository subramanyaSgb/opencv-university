// Homogeneous 3 × 3 transforms: affine from 3 point pairs, homography from 4, applying with the divide by w.
// For HomographyLab (Chapter 5.3). Unit-tested against cv2.getPerspectiveTransform.

export type M3 = number[][];
export type P = [number, number];

/** Solve A x = b (small dense systems) by Gaussian elimination with partial pivoting. */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const m = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[piv][c])) piv = r;
    if (Math.abs(m[piv][c]) < 1e-12) throw new Error("singular: points are degenerate (e.g. three on a line)");
    [m[c], m[piv]] = [m[piv], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((r, i) => r[n] / r[i]);
}

/** Homography H (h33 = 1) mapping src[i] to dst[i], 4 pairs. */
export function homography(src: P[], dst: P[]): M3 {
  const A: number[][] = [], b: number[] = [];
  src.forEach(([x, y], i) => {
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  });
  const h = solve(A, b);
  return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
}

/** Affine map (last row 0 0 1) from 3 pairs. */
export function affine(src: P[], dst: P[]): M3 {
  const A: number[][] = [], b: number[] = [];
  src.forEach(([x, y], i) => {
    A.push([x, y, 1, 0, 0, 0]); b.push(dst[i][0]);
    A.push([0, 0, 0, x, y, 1]); b.push(dst[i][1]);
  });
  const h = solve(A, b);
  return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [0, 0, 1]];
}

/** Apply a 3 × 3 matrix to (x, y): returns the point after dividing by w, and w itself. */
export function applyH(H: M3, [x, y]: P): { p: P; w: number } {
  const X = H[0][0] * x + H[0][1] * y + H[0][2];
  const Y = H[1][0] * x + H[1][1] * y + H[1][2];
  const w = H[2][0] * x + H[2][1] * y + H[2][2];
  return { p: [X / w, Y / w], w };
}
