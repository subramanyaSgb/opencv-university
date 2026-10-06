// Neighbourhoods, connected components and grid distances for ConnectivityLab (Chapter 3.6). Unit-tested.

export type Grid = number[][]; // 1 = foreground, 0 = background

const N4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const N8 = [...N4, [-1, -1], [-1, 1], [1, -1], [1, 1]];

/** Label connected foreground pixels (BFS). Returns labels (0 = background) and the number of objects. */
export function label(g: Grid, conn: 4 | 8): { labels: number[][]; count: number } {
  const h = g.length, w = g[0].length;
  const labels = g.map((row) => row.map(() => 0));
  const steps = conn === 4 ? N4 : N8;
  let count = 0;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    if (!g[r][c] || labels[r][c]) continue;
    count++;
    const queue: [number, number][] = [[r, c]];
    labels[r][c] = count;
    while (queue.length) {
      const [y, x] = queue.shift() as [number, number];
      for (const [dy, dx] of steps) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < h && xx >= 0 && xx < w && g[yy][xx] && !labels[yy][xx]) {
          labels[yy][xx] = count;
          queue.push([yy, xx]);
        }
      }
    }
  }
  return { labels, count };
}

export type Metric = "cityblock" | "chessboard" | "euclidean";

/** Distance between two pixels (row, col) with the chosen grid metric. */
export function distance(a: [number, number], b: [number, number], m: Metric): number {
  const dy = Math.abs(a[0] - b[0]), dx = Math.abs(a[1] - b[1]);
  return m === "cityblock" ? dx + dy : m === "chessboard" ? Math.max(dx, dy) : Math.hypot(dx, dy);
}
