/** Chapter 17.4: separability of kernels via singular values (Jacobi eigenvalues of KᵀK), and kernel presets of any size. */

/** Eigen-decomposition of a symmetric matrix by cyclic Jacobi rotations. Returns eigenvalues (descending) and eigenvectors as columns. */
export function jacobiEig(Ain: number[][]) {
  const n = Ain.length, A = Ain.map((r) => r.slice()), V: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j): number => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  const idx = A.map((_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  return { values: idx.map((i) => A[i][i]), vectors: idx.map((i) => V.map((r) => r[i])) };
}

/** Singular values of K (descending) and the best rank-1 factors: K ≈ col · rowᵀ. */
export function separability(K: number[][]) {
  const n = K[0].length, KtK = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => K.reduce((s, r) => s + r[i] * r[j], 0)));
  const { values, vectors } = jacobiEig(KtK);
  const sv = values.map((v) => Math.sqrt(Math.max(0, v)));
  const row = vectors[0], col = K.map((r) => r.reduce((s, v, j) => s + v * row[j], 0)); // K·v1 = σ1·u1
  const total = sv.reduce((a, s) => a + s * s, 0);
  return { sv, row, col, rank1Share: total ? (sv[0] * sv[0]) / total : 1 };
}

export function gaussian1D(k: number, sigma: number) {
  const r = (k - 1) / 2, g = Array.from({ length: k }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma))), s = g.reduce((a, b) => a + b, 0);
  return g.map((v) => v / s);
}
export const outer = (c: number[], r: number[]) => c.map((a) => r.map((b) => a * b));

export function preset(name: string, k: number): number[][] {
  const r = (k - 1) / 2;
  if (name === "box") return outer(new Array(k).fill(1 / k), new Array(k).fill(1 / k));
  if (name === "gauss") { const g = gaussian1D(k, 0.3 * ((k - 1) * 0.5 - 1) + 0.8); return outer(g, g); }
  if (name === "disk") { const m: number[][] = Array.from({ length: k }, (_, y) => Array.from({ length: k }, (_, x): number => ((x - r) ** 2 + (y - r) ** 2 <= r * r + 0.5 ? 1 : 0))); const s = m.flat().reduce((a, b) => a + b, 0); return m.map((row) => row.map((v) => v / s)); }
  if (name === "laplace") return Array.from({ length: k }, (_, y) => Array.from({ length: k }, (_, x) => (x === r && y === r ? -4 : (x === r && Math.abs(y - r) === 1) || (y === r && Math.abs(x - r) === 1) ? 1 : 0)));
  // sobel-like derivative: smoothing column [1 2 1]-style binomial times central difference
  const bin = Array.from({ length: k }, (_, i) => { let c = 1; for (let j = 0; j < i; j++) c = (c * (k - 1 - j)) / (j + 1); return c; });
  const diff = Array.from({ length: k }, (_, i) => (i < r ? -1 : i > r ? 1 : 0));
  return outer(bin, diff);
}
