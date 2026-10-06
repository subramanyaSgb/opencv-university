// NumPy broadcasting rules, for BroadcastLab (Chapter 6.4). Unit-tested against NumPy behaviour.

/** Result shape of broadcasting a and b, or an error message naming the clashing axis. */
export function broadcast(a: number[], b: number[]): { shape: number[] } | { error: string } {
  const n = Math.max(a.length, b.length);
  const pa = Array(n - a.length).fill(1).concat(a), pb = Array(n - b.length).fill(1).concat(b);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (pa[i] === pb[i] || pa[i] === 1 || pb[i] === 1) out.push(Math.max(pa[i], pb[i]));
    else return { error: `axis ${i - n} (counting from the right): ${pa[i]} vs ${pb[i]}; sizes must be equal or 1` };
  }
  return { shape: out };
}

/** Parse "200, 320, 3" or "(200,320,3)" into a shape. */
export function parseShape(s: string): number[] | null {
  const parts = s.replace(/[()\s]/g, "").split(",").filter((p) => p !== "");
  if (!parts.length) return [];
  const v = parts.map(Number);
  return v.every((x) => Number.isInteger(x) && x >= 0) ? v : null;
}
