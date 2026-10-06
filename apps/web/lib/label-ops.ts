/** Module 25: connected-component labelling (labels in raster order of first pixel; OpenCV may number them differently) and region statistics as cv2.connectedComponentsWithStats. */

export type Stats = { area: number; x: number; y: number; w: number; h: number; cx: number; cy: number };

/** Label non-zero pixels; connectivity 4 or 8. Returns labels (0 = background) and n (number of labels including background). */
export function label(img: ArrayLike<number>, w: number, h: number, connectivity: 4 | 8 = 8) {
  const parent: number[] = [0], lab = new Int32Array(w * h);
  const find = (a: number) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const union = (a: number, b: number) => { a = find(a); b = find(b); if (a !== b) { if (a < b) parent[b] = a; else parent[a] = b; } };
  const nb = connectivity === 8 ? [[-1, 0], [-1, -1], [0, -1], [1, -1]] : [[-1, 0], [0, -1]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!img[i]) continue;
    let l = 0;
    for (const [dx, dy] of nb) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w) continue;
      const q = lab[yy * w + xx]; if (!q) continue;
      if (!l) l = q; else union(l, q);
    }
    if (!l) { l = parent.length; parent.push(l); }
    lab[i] = l;
  }
  // relabel roots in raster order of first appearance
  const map = new Int32Array(parent.length); let n = 1;
  for (let i = 0; i < w * h; i++) { const l = lab[i]; if (!l) continue; const r = find(l); if (!map[r]) map[r] = n++; lab[i] = map[r]; }
  return { labels: lab, n };
}

/** Per-label statistics (index 0 = background), as cv2.connectedComponentsWithStats. */
export function stats(labels: Int32Array, n: number, w: number, h: number): Stats[] {
  const s = Array.from({ length: n }, () => ({ area: 0, x: w, y: h, x1: -1, y1: -1, sx: 0, sy: 0 }));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = s[labels[y * w + x]]; t.area++; t.sx += x; t.sy += y;
    if (x < t.x) t.x = x; if (y < t.y) t.y = y; if (x > t.x1) t.x1 = x; if (y > t.y1) t.y1 = y;
  }
  return s.map((t) => ({ area: t.area, x: t.x, y: t.y, w: t.x1 - t.x + 1, h: t.y1 - t.y + 1, cx: t.sx / Math.max(t.area, 1), cy: t.sy / Math.max(t.area, 1) }));
}
