// Python slice semantics (start:stop:step) for SliceLab (Chapter 6.2). Unit-tested against Python behaviour.

export type Slice = { start: number | null; stop: number | null; step: number };

/** Indices selected by a Python slice on an axis of length n (like range(*slice(...).indices(n))). */
export function indices(n: number, s: Slice): number[] {
  const step = s.step;
  if (step === 0) throw new Error("slice step cannot be zero");
  const norm = (v: number | null, dflt: number, lo: number, hi: number) => {
    if (v === null) return dflt;
    let x = v < 0 ? v + n : v;
    if (x < lo) x = lo;
    if (x > hi) x = hi;
    return x;
  };
  const out: number[] = [];
  if (step > 0) {
    const a = norm(s.start, 0, 0, n), b = norm(s.stop, n, 0, n);
    for (let i = a; i < b; i += step) out.push(i);
  } else {
    const a = norm(s.start, n - 1, -1, n - 1), b = norm(s.stop, -1, -1, n - 1);
    for (let i = a; i > b; i += step) out.push(i);
  }
  return out;
}

/** Text of a slice as Python would write it. */
export function text(s: Slice): string {
  const a = s.start === null ? "" : String(s.start), b = s.stop === null ? "" : String(s.stop);
  return s.step === 1 ? `${a}:${b}` : `${a}:${b}:${s.step}`;
}
