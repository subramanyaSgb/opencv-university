/** Module 23: morphology on binary (0/255) and grey images, structuring elements as cv2.getStructuringElement, skeletons, distance transforms. */

export type Shape = "rect" | "cross" | "ellipse";
export type SE = { k: Uint8Array; w: number; h: number };

/** Same masks as cv2.getStructuringElement(shape, (w, h)). */
export function structuringElement(shape: Shape, w: number, h: number): SE {
  const k = new Uint8Array(w * h), cx = Math.floor(w / 2), cy = Math.floor(h / 2);
  if (shape === "rect") k.fill(1);
  else if (shape === "cross") { for (let x = 0; x < w; x++) k[cy * w + x] = 1; for (let y = 0; y < h; y++) k[y * w + cx] = 1; }
  else {
    const r = Math.floor(h / 2), c = Math.floor(w / 2), inv = r > 0 ? 1 / (r * r) : 0;
    for (let i = 0; i < h; i++) {
      const dy = i - r; let j1 = 0, j2 = 0;
      if (Math.abs(dy) <= r) { const dx = Math.round(c * Math.sqrt((r * r - dy * dy) * inv)); j1 = Math.max(c - dx, 0); j2 = Math.min(c + dx + 1, w); }
      for (let j = j1; j < j2; j++) k[i * w + j] = 1;
    }
  }
  return { k, w, h };
}

/** Erosion (min) or dilation (max) over the structuring element; pixels outside the image are ignored (OpenCV's default border value). */
function minmax(img: ArrayLike<number>, w: number, h: number, se: SE, isMax: boolean) {
  const out = new Uint8Array(w * h), ax = Math.floor(se.w / 2), ay = Math.floor(se.h / 2), off: [number, number][] = [];
  for (let j = 0; j < se.h; j++) for (let i = 0; i < se.w; i++) if (se.k[j * se.w + i]) off.push([i - ax, j - ay]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = isMax ? 0 : 255;
    for (const [dx, dy] of off) {
      const xx = x + dx, yy = y + dy; // OpenCV applies the element as is (no reflection) for both
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const p = img[yy * w + xx]; if (isMax ? p > v : p < v) v = p;
    }
    out[y * w + x] = v;
  }
  return out;
}

export const erode = (img: ArrayLike<number>, w: number, h: number, se: SE, it = 1) => { let r: ArrayLike<number> = img; for (let i = 0; i < it; i++) r = minmax(r, w, h, se, false); return Uint8Array.from(r); };
export const dilate = (img: ArrayLike<number>, w: number, h: number, se: SE, it = 1) => { let r: ArrayLike<number> = img; for (let i = 0; i < it; i++) r = minmax(r, w, h, se, true); return Uint8Array.from(r); };

export type Op = "erode" | "dilate" | "open" | "close" | "gradient" | "tophat" | "blackhat";
/** As cv2.morphologyEx (iterations repeat each primitive: open = erode^n then dilate^n). */
export function morph(img: ArrayLike<number>, w: number, h: number, op: Op, se: SE, it = 1) {
  if (op === "erode") return erode(img, w, h, se, it);
  if (op === "dilate") return dilate(img, w, h, se, it);
  if (op === "open") return dilate(erode(img, w, h, se, it), w, h, se, it);
  if (op === "close") return erode(dilate(img, w, h, se, it), w, h, se, it);
  if (op === "gradient") { const d = dilate(img, w, h, se, it), e = erode(img, w, h, se, it); return d.map((v, i) => v - e[i]); }
  if (op === "tophat") { const o = dilate(erode(img, w, h, se, it), w, h, se, it); return Uint8Array.from(img, (v, i) => v - o[i]); }
  const c = erode(dilate(img, w, h, se, it), w, h, se, it); return c.map((v, i) => v - img[i]);
}

/** Morphological skeleton (Lantuéjoul): union over k of erode^k(X) − open(erode^k(X)), 3 × 3 cross. */
export function morphSkeleton(img: ArrayLike<number>, w: number, h: number) {
  const se = structuringElement("cross", 3, 3), skel = new Uint8Array(w * h);
  let cur = Uint8Array.from(img);
  for (let k = 0; k < 500; k++) {
    if (!cur.some((v) => v)) break;
    const op = dilate(erode(cur, w, h, se), w, h, se);
    for (let i = 0; i < w * h; i++) if (cur[i] && !op[i]) skel[i] = 255;
    cur = erode(cur, w, h, se);
  }
  return skel;
}

/** Zhang–Suen thinning (as cv2.ximgproc.thinning, THINNING_ZHANGSUEN). */
export function thinZhangSuen(img: ArrayLike<number>, w: number, h: number) {
  const a = Uint8Array.from(img, (v) => (v ? 1 : 0)), P = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : a[y * w + x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const del: number[] = [];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { // border pixels are never removed (as OpenCV)
        if (!a[y * w + x]) continue;
        const p = [P(x, y - 1), P(x + 1, y - 1), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1), P(x - 1, y + 1), P(x - 1, y), P(x - 1, y - 1)]; // p2..p9
        const B = p.reduce((s, v) => s + v, 0); if (B < 2 || B > 6) continue;
        let A = 0; for (let i = 0; i < 8; i++) if (p[i] === 0 && p[(i + 1) % 8] === 1) A++;
        if (A !== 1) continue;
        const [p2, , p4, , p6, , p8] = p;
        if (step === 0 ? p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0 : p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0) del.push(y * w + x);
      }
      for (const i of del) a[i] = 0;
      if (del.length) changed = true;
    }
  }
  return Uint8Array.from(a, (v) => v * 255);
}

/** Distance to the nearest zero pixel. "l1" and "c" exact (two-pass); "l2" exact Euclidean (Felzenszwalb–Huttenlocher). */
export function distanceTransform(img: ArrayLike<number>, w: number, h: number, metric: "l1" | "l2" | "c") {
  const INF = 1e12, d = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = img[i] ? INF : 0;
  if (metric !== "l2") {
    const diag = metric === "c" ? 1 : 2;
    const pass = (x: number, y: number, nb: [number, number, number][]) => { let v = d[y * w + x]; for (const [dx, dy, c] of nb) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) v = Math.min(v, d[yy * w + xx] + c); } d[y * w + x] = v; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pass(x, y, [[-1, 0, 1], [0, -1, 1], [-1, -1, diag], [1, -1, diag]]);
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) pass(x, y, [[1, 0, 1], [0, 1, 1], [1, 1, diag], [-1, 1, diag]]);
    return d;
  }
  const f1 = (f: Float64Array, n: number) => { // 1-D squared distance transform
    const out = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1); let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) ** 2 + f[v[k]]; }
    return out;
  };
  const col = new Float64Array(h);
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) col[y] = d[y * w + x]; const r = f1(col, h); for (let y = 0; y < h; y++) d[y * w + x] = r[y]; }
  const row = new Float64Array(w);
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) row[x] = d[y * w + x]; const r = f1(row, w); for (let x = 0; x < w; x++) d[y * w + x] = Math.sqrt(r[x]); }
  return d;
}
