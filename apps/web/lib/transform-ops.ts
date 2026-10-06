// 2 × 2 linear transforms of points for TransformLab (Chapter 5.2). Unit-tested.
// Image convention: x to the right, y DOWN. A positive angle in rot() therefore turns clockwise on screen.

export type M2 = [[number, number], [number, number]];
export type V2 = [number, number];

export const rot = (deg: number): M2 => {
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return [[c, -s], [s, c]];
};
export const scale = (sx: number, sy: number): M2 => [[sx, 0], [0, sy]];
export const shear = (k: number): M2 => [[1, k], [0, 1]];
export const mul = (a: M2, b: M2): M2 => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
export const apply = (m: M2, p: V2): V2 => [m[0][0] * p[0] + m[0][1] * p[1], m[1][0] * p[0] + m[1][1] * p[1]];
export const det = (m: M2): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
export function inv(m: M2): M2 {
  const d = det(m);
  if (Math.abs(d) < 1e-12) throw new Error("not invertible");
  return [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]];
}

export type Step = "rotate" | "scale" | "shear";
/** Compose steps applied in the given order: the LAST step's matrix is on the LEFT. */
export function compose(order: Step[], deg: number, sx: number, sy: number, k: number): M2 {
  const of = (s: Step): M2 => (s === "rotate" ? rot(deg) : s === "scale" ? scale(sx, sy) : shear(k));
  return order.reduce<M2>((acc, s) => mul(of(s), acc), [[1, 0], [0, 1]]);
}
