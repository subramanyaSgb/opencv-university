// Pure 3 × 3 neighbourhood helpers for NeighborhoodLab. Unit-tested in neighborhood-ops.test.ts.
// Border rules match OpenCV 4.13.0: cv2.blur uses BORDER_REFLECT_101 (…c b | a b c | b a…),
// cv2.medianBlur replicates the edge pixel (…a a | a b c | c c…).

export type Grid = number[][];
export type NbOp = "mean" | "median";

/** Index inside 0..n-1 with OpenCV's default reflect-101 border (no edge repeat). */
export function reflect101(i: number, n: number): number {
  if (n === 1) return 0;
  while (i < 0 || i >= n) {
    if (i < 0) i = -i;
    if (i >= n) i = 2 * n - 2 - i;
  }
  return i;
}

/** Index clamped to 0..n-1 (replicate border). */
export function replicate(i: number, n: number): number {
  return Math.min(Math.max(i, 0), n - 1);
}

/** The 3 × 3 values around (r, c), row by row, using the border rule for `op`. */
export function window3(g: Grid, r: number, c: number, op: NbOp): number[] {
  const H = g.length;
  const W = g[0].length;
  const fix = op === "mean" ? reflect101 : replicate;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) out.push(g[fix(r + dr, H)][fix(c + dc, W)]);
  return out;
}

/** True when every one of the 9 window pixels is inside the image. */
export function isInterior(g: Grid, r: number, c: number): boolean {
  return r > 0 && c > 0 && r < g.length - 1 && c < g[0].length - 1;
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** One output pixel. Mean is the sum / 9 rounded (cv2.blur); median is the middle of 9 (cv2.medianBlur). */
export function applyAt(g: Grid, r: number, c: number, op: NbOp): number {
  const w = window3(g, r, c, op);
  return op === "mean" ? Math.round(w.reduce((a, b) => a + b, 0) / 9) : median(w);
}

export function applyNb(g: Grid, op: NbOp): Grid {
  return g.map((row, r) => row.map((_, c) => applyAt(g, r, c, op)));
}
