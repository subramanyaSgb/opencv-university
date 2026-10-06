/** Chapter 10.7: a synthetic colour scene with ground-truth object ids, and OpenCV-style HSV inRange with hue wrap-around. */
import { bgrToHsv8, type Trip } from "./hsv-ops.ts";

export const W = 160, H = 100;
export const OBJECTS = [
  { id: 1, name: "orange cap", bgr: [30, 140, 250] as Trip },
  { id: 2, name: "red cap", bgr: [30, 30, 210] as Trip },
  { id: 3, name: "crimson cap", bgr: [70, 25, 200] as Trip },
  { id: 4, name: "green cap", bgr: [60, 170, 40] as Trip },
  { id: 5, name: "cardboard", bgr: [70, 110, 150] as Trip },
];

/** Deterministic pseudo-random numbers (mulberry32). */
function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function scene() {
  const bgr = new Uint8ClampedArray(W * H * 3), id = new Uint8Array(W * H);
  const rand = rng(7);
  const shapes = [
    { o: 1, cx: 30, cy: 35, r: 16 }, { o: 2, cx: 75, cy: 30, r: 15 }, { o: 3, cx: 120, cy: 32, r: 15 },
    { o: 4, cx: 40, cy: 75, r: 14 }, { o: 5, cx: 105, cy: 75, r: 0, w: 40, h: 22 },
  ];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const shade = 1 - 0.55 * (x / W);                       // light falls off to the right
    let col: Trip = [118, 120, 122], o = 0;               // grey belt
    for (const s of shapes) {
      const inside = s.r ? (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r * s.r : Math.abs(x - s.cx) <= s.w! / 2 && Math.abs(y - s.cy) <= s.h! / 2;
      if (inside) { col = OBJECTS[s.o - 1].bgr; o = s.o; }
    }
    let k = shade;
    if (o === 1 && (x - 25) ** 2 + (y - 30) ** 2 <= 9) { col = [250, 250, 250]; k = 1; }   // specular highlight
    for (let c = 0; c < 3; c++) bgr[(y * W + x) * 3 + c] = col[c] * k + (rand() - 0.5) * 12;
    id[y * W + x] = o;
  }
  return { bgr, id };
}

/** cv2.inRange on HSV with lo/hi per channel; if hLo > hHi the hue range wraps around 179 → 0. */
export function inRangeHsv(bgr: Uint8ClampedArray, hLo: number, hHi: number, sMin: number, vMin: number) {
  const n = bgr.length / 3, mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const [h, s, v] = bgrToHsv8([bgr[3 * i], bgr[3 * i + 1], bgr[3 * i + 2]]);
    const hOk = hLo <= hHi ? h >= hLo && h <= hHi : h >= hLo || h <= hHi;
    mask[i] = hOk && s >= sMin && v >= vMin ? 255 : 0;
  }
  return mask;
}

/** Pixels of each object (and of the background, id 0) that ended up in the mask. */
export function tally(mask: Uint8Array, id: Uint8Array) {
  const hit = new Map<number, number>(), tot = new Map<number, number>();
  id.forEach((o, i) => { tot.set(o, (tot.get(o) ?? 0) + 1); if (mask[i]) hit.set(o, (hit.get(o) ?? 0) + 1); });
  return { hit, tot };
}
