// Pixel rasterisation like OpenCV's LINE_8 lines (checked against cv2.line on 4.13.0), plus rectangles and a
// midpoint circle (approximately like cv2.circle). For DrawLab (Chapter 7.5). Unit-tested.

export type Px = [number, number];

/** 8-connected line from p0 to p1, stepping along the major axis; rounding as cv2.line(…, LINE_8). */
export function line8([x0, y0]: Px, [x1, y1]: Px): Px[] {
  const dx = x1 - x0, dy = y1 - y0, adx = Math.abs(dx), ady = Math.abs(dy);
  const out: Px[] = [];
  if (adx === 0 && ady === 0) return [[x0, y0]];
  const major = Math.max(adx, ady), minor = Math.min(adx, ady);
  for (let i = 0; i <= major; i++) {
    const m = Math.floor((2 * minor * i + major - 1) / (2 * major));
    if (adx >= ady) out.push([x0 + Math.sign(dx) * i, y0 + Math.sign(dy) * m]);
    else out.push([x0 + Math.sign(dx) * m, y0 + Math.sign(dy) * i]);
  }
  return out;
}

/** Rectangle outline (thickness 1) or filled (thickness -1). */
export function rect([x0, y0]: Px, [x1, y1]: Px, thickness: number): Px[] {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(y0, y1), Math.max(y0, y1)];
  const out: Px[] = [];
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) if (thickness < 0 || x === a || x === b || y === c || y === d) out.push([x, y]);
  return out;
}

/** Midpoint circle outline, or a filled disc. */
export function circle([cx, cy]: Px, r: number, thickness: number): Px[] {
  const set = new Set<string>();
  if (thickness < 0) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r) set.add(`${cx + x},${cy + y}`);
  } else {
    let x = r, y = 0, err = 1 - r;
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) set.add(`${cx + a},${cy + b}`);
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
  }
  return [...set].map((s) => s.split(",").map(Number) as Px);
}
