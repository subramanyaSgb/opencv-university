// Pure helpers for indexing figures (IndexExplorer). Unit-tested in grid-ops.test.ts.

export interface Region {
  r0: number;
  r1: number;
  c0: number;
  c1: number;
}

/** Region from two clicked corners, in any order (inclusive). */
export function normRegion(a: [number, number], b: [number, number]): Region {
  return {
    r0: Math.min(a[0], b[0]),
    r1: Math.max(a[0], b[0]),
    c0: Math.min(a[1], b[1]),
    c1: Math.max(a[1], b[1]),
  };
}

/** NumPy slice for an inclusive region: rows first, end exclusive. */
export function sliceExpr(g: Region, name = "image"): string {
  return `${name}[${g.r0}:${g.r1 + 1}, ${g.c0}:${g.c1 + 1}]`;
}

/** Shape of that slice: (height, width). */
export function regionShape(g: Region): [number, number] {
  return [g.r1 - g.r0 + 1, g.c1 - g.c0 + 1];
}

/** OpenCV corner points for cv2.rectangle: (x, y) = (column, row), both corners inclusive. */
export function rectPoints(g: Region): [[number, number], [number, number]] {
  return [
    [g.c0, g.r0],
    [g.c1, g.r1],
  ];
}

export function regionMean(values: number[][], g: Region): number {
  let sum = 0;
  let n = 0;
  for (let r = g.r0; r <= g.r1; r++) {
    for (let c = g.c0; c <= g.c1; c++) {
      sum += values[r][c];
      n++;
    }
  }
  return n ? sum / n : 0;
}

/** Is (r, c) inside a rows×cols image? */
export function inBounds(r: number, c: number, rows: number, cols: number): boolean {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}
