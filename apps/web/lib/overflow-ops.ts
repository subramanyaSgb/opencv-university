// 8-bit arithmetic under different overflow rules, for OverflowLab (Chapter 6.3). Unit-tested.

export const wrapU8 = (v: number) => ((Math.trunc(v) % 256) + 256) % 256;
/** OpenCV saturate_cast<uchar>: round half to even, then clip to 0..255. */
export function satU8(v: number): number {
  const r = Math.round(v);
  const even = Math.abs(v % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
  return Math.min(255, Math.max(0, even));
}

export type Op = "add" | "sub" | "avg" | "absdiff" | "mul";
export const OPS: { k: Op; label: string }[] = [
  { k: "add", label: "a + b" }, { k: "sub", label: "a − b" }, { k: "avg", label: "(a + b) / 2" },
  { k: "absdiff", label: "|a − b|" }, { k: "mul", label: "a × b / 255" },
];

/** Results of one operation in NumPy uint8, OpenCV, and exact (int/float) arithmetic. */
export function compute(op: Op, a: number, b: number): { numpy: number; opencv: number; exact: number; note: string } {
  switch (op) {
    case "add": return { numpy: wrapU8(a + b), opencv: satU8(a + b), exact: a + b, note: "a + b on uint8 arrays / cv2.add" };
    case "sub": return { numpy: wrapU8(a - b), opencv: satU8(a - b), exact: a - b, note: "a - b / cv2.subtract" };
    case "avg": return { numpy: Math.floor(wrapU8(a + b) / 2), opencv: satU8(0.5 * a + 0.5 * b), exact: (a + b) / 2, note: "(a + b) // 2 / cv2.addWeighted(a, .5, b, .5, 0)" };
    case "absdiff": return { numpy: Math.abs(wrapU8(a - b)), opencv: Math.abs(a - b), exact: Math.abs(a - b), note: "np.abs(a - b) / cv2.absdiff" };
    case "mul": return { numpy: Math.floor(wrapU8(a * b) / 255), opencv: satU8((a * b) / 255), exact: (a * b) / 255, note: "a * b // 255 / cv2.multiply(a, b, scale=1/255)" };
  }
}
