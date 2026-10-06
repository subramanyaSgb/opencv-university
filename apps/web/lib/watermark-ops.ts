// Bit planes and a least-significant-bit (LSB) watermark, for BitPlaneLab (Chapter 4.6). Unit-tested.

/** Bit k (0 = least significant) of every value, as 0/1. */
export function bitPlane(values: ArrayLike<number>, k: number): Uint8Array {
  const out = new Uint8Array(values.length);
  for (let i = 0; i < values.length; i++) out[i] = (values[i] >> k) & 1;
  return out;
}

/** Replace bit 0 of every value with the mark bit (0/1). Changes each value by at most 1. */
export function embedLsb(values: ArrayLike<number>, mark: ArrayLike<number>): Uint8Array {
  const out = new Uint8Array(values.length);
  for (let i = 0; i < values.length; i++) out[i] = (values[i] & 0xfe) | (mark[i] & 1);
  return out;
}

/** Fraction (0..1) of positions where a and b agree. */
export function agreement(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return a.length ? same / a.length : 1;
}
