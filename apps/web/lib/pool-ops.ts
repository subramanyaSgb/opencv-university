/** Module 51.4: max and average pooling (2x2, stride 2), forward and backward, pure and
 *  unit-tested. Mirrors the chapter's own NumPy code and its finite-difference gradient check. */

export type Grid = number[][];

/** Non-overlapping 2x2 max pooling, stride 2. grid dimensions must be even. */
export function maxPool2x2(grid: Grid): Grid {
  const H = grid.length, W = grid[0].length;
  const out: Grid = [];
  for (let i = 0; i < H; i += 2) {
    const row: number[] = [];
    for (let j = 0; j < W; j += 2) row.push(Math.max(grid[i][j], grid[i][j + 1], grid[i + 1][j], grid[i + 1][j + 1]));
    out.push(row);
  }
  return out;
}

/** Non-overlapping 2x2 average pooling, stride 2. */
export function avgPool2x2(grid: Grid): Grid {
  const H = grid.length, W = grid[0].length;
  const out: Grid = [];
  for (let i = 0; i < H; i += 2) {
    const row: number[] = [];
    for (let j = 0; j < W; j += 2) row.push((grid[i][j] + grid[i][j + 1] + grid[i + 1][j] + grid[i + 1][j + 1]) / 4);
    out.push(row);
  }
  return out;
}

/** Which of the 4 cells in each window was the max: returns an index 0-3 (TL,TR,BL,BR) per pooled cell, for drawing the "switch". */
export function maxPoolArgmax(grid: Grid): number[][] {
  const H = grid.length, W = grid[0].length;
  const out: number[][] = [];
  for (let i = 0; i < H; i += 2) {
    const row: number[] = [];
    for (let j = 0; j < W; j += 2) {
      const vals = [grid[i][j], grid[i][j + 1], grid[i + 1][j], grid[i + 1][j + 1]];
      row.push(vals.indexOf(Math.max(...vals)));
    }
    out.push(row);
  }
  return out;
}

/** Backward pass for max pooling: upstream gradient dOut routes entirely to the max location in each window. */
export function maxPoolBackward(grid: Grid, dOut: Grid): Grid {
  const H = grid.length, W = grid[0].length;
  const dIn: Grid = Array.from({ length: H }, () => new Array(W).fill(0));
  for (let i = 0; i < H; i += 2) for (let j = 0; j < W; j += 2) {
    const vals: [number, number, number][] = [[grid[i][j], i, j], [grid[i][j + 1], i, j + 1], [grid[i + 1][j], i + 1, j], [grid[i + 1][j + 1], i + 1, j + 1]];
    const [, bi, bj] = vals.reduce((a, b) => (b[0] > a[0] ? b : a));
    dIn[bi][bj] += dOut[i / 2][j / 2];
  }
  return dIn;
}

/** Backward pass for average pooling: upstream gradient dOut splits evenly (1/4 each) across every cell in each window. */
export function avgPoolBackward(dOut: Grid, H: number, W: number): Grid {
  const dIn: Grid = Array.from({ length: H }, () => new Array(W).fill(0));
  for (let i = 0; i < H; i += 2) for (let j = 0; j < W; j += 2) {
    const g = dOut[i / 2][j / 2] / 4;
    dIn[i][j] = g; dIn[i][j + 1] = g; dIn[i + 1][j] = g; dIn[i + 1][j + 1] = g;
  }
  return dIn;
}
