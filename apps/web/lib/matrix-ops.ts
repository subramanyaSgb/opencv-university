// Small-matrix operations on 8-bit "images" for MatrixLab (Chapter 5.1). Unit-tested.

export type M = number[][];
export type Overflow = "saturate" | "wrap" | "none";

export function clip(v: number, mode: Overflow): number {
  if (mode === "none") return v;
  if (mode === "saturate") return Math.min(255, Math.max(0, Math.round(v)));
  return ((Math.round(v) % 256) + 256) % 256;
}

export const map2 = (a: M, b: M, f: (x: number, y: number) => number): M => a.map((r, i) => r.map((v, j) => f(v, b[i][j])));
export const transpose = (a: M): M => a[0].map((_, j) => a.map((r) => r[j]));
export const flipLR = (a: M): M => a.map((r) => [...r].reverse());
export const flipUD = (a: M): M => [...a].reverse();
export const rot90cw = (a: M): M => flipLR(transpose(a));
export const rowSums = (a: M): number[] => a.map((r) => r.reduce((s, v) => s + v, 0));
export const colSums = (a: M): number[] => a[0].map((_, j) => a.reduce((s, r) => s + r[j], 0));

export function matmul(a: M, b: M): M {
  if (a[0].length !== b.length) throw new Error("inner sizes differ");
  return a.map((r) => b[0].map((_, j) => r.reduce((s, v, k) => s + v * b[k][j], 0)));
}

export type Op = "add" | "sub" | "mul" | "scale" | "blend" | "mask" | "T" | "flip" | "rot" | "matmul";

/** Apply an operation; returns the raw result and the 8-bit result under the chosen overflow rule. */
export function apply(op: Op, a: M, b: M, k: number, mode: Overflow): { raw: M; out: M } {
  let raw: M;
  switch (op) {
    case "add": raw = map2(a, b, (x, y) => x + y); break;
    case "sub": raw = map2(a, b, (x, y) => x - y); break;
    case "mul": raw = map2(a, b, (x, y) => x * y); break;
    case "scale": raw = a.map((r) => r.map((v) => v * k)); break;
    case "blend": raw = map2(a, b, (x, y) => (1 - k) * x + k * y); break;
    case "mask": raw = map2(a, b, (x, y) => (y > 0 ? x : 0)); break;
    case "T": raw = transpose(a); break;
    case "flip": raw = flipLR(a); break;
    case "rot": raw = rot90cw(a); break;
    case "matmul": raw = matmul(a, b); break;
  }
  return { raw, out: raw.map((r) => r.map((v) => clip(v, mode))) };
}
