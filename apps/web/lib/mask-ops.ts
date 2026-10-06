/** Module 14: binary masks (0/255) built from shapes, combined with bitwise logic, and used to restrict operations. */

export type Shape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "ring"; cx: number; cy: number; r0: number; r1: number }
  | { kind: "poly"; pts: [number, number][] };

/** Point-in-polygon by ray casting (pixel centre at x, y). */
function inPoly(x: number, y: number, pts: [number, number][]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** A 0/255 mask of a shape, like cv2.circle / cv2.rectangle / cv2.fillPoly with thickness -1 (pixel-centre rule). */
export function shapeMask(w: number, h: number, s: Shape) {
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let on = false;
    if (s.kind === "circle") on = (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r * s.r;
    else if (s.kind === "rect") on = x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h;
    else if (s.kind === "ring") { const d = (x - s.cx) ** 2 + (y - s.cy) ** 2; on = d <= s.r1 * s.r1 && d > s.r0 * s.r0; }
    else on = inPoly(x + 0.5, y + 0.5, s.pts);
    m[y * w + x] = on ? 255 : 0;
  }
  return m;
}

export type LogicOp = "A" | "B" | "and" | "or" | "xor" | "notA" | "andNot";
export const LOGIC: Record<LogicOp, { label: string; code: string }> = {
  A: { label: "A", code: "A" },
  B: { label: "B", code: "B" },
  and: { label: "A AND B", code: "cv2.bitwise_and(A, B)" },
  or: { label: "A OR B", code: "cv2.bitwise_or(A, B)" },
  xor: { label: "A XOR B", code: "cv2.bitwise_xor(A, B)" },
  notA: { label: "NOT A", code: "cv2.bitwise_not(A)" },
  andNot: { label: "A AND NOT B", code: "cv2.bitwise_and(A, cv2.bitwise_not(B))" },
};

/** Bitwise logic on 8-bit masks, exactly as cv2.bitwise_* on 0/255 values. */
export function logic(a: Uint8Array, b: Uint8Array, op: LogicOp) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    out[i] = op === "A" ? x : op === "B" ? y : op === "and" ? x & y : op === "or" ? x | y : op === "xor" ? x ^ y : op === "notA" ? 255 - x : x & (255 - y);
  }
  return out;
}

/** cv2.mean(img, mask): per-channel mean over the pixels where mask != 0 (img packed with c channels). */
export function maskedMean(img: ArrayLike<number>, c: number, mask: ArrayLike<number>) {
  const s = new Array(c).fill(0); let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) { n++; for (let k = 0; k < c; k++) s[k] += img[i * c + k]; }
  return { mean: s.map((v) => (n ? v / n : 0)), n };
}

export const count = (m: ArrayLike<number>) => { let n = 0; for (let i = 0; i < m.length; i++) if (m[i]) n++; return n; };
