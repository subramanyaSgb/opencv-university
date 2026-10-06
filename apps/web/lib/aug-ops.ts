/** Chapter 15.6: random augmentation parameters (seeded), the affine matrix they imply, and box transformation. */

export type AugOn = { flip: boolean; rotate: boolean; scale: boolean; bright: boolean; noise: boolean; cutout: boolean };
export type AugParams = { flip: boolean; angle: number; scale: number; gain: number; offset: number; noise: number; cut: { x: number; y: number; s: number } | null };

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Draw one set of parameters; `strength` (0..1) scales the ranges. */
export function sample(seed: number, on: AugOn, strength: number, w: number, h: number): AugParams {
  const r = rng(seed), u = (a: number, b: number) => a + (b - a) * r();
  return {
    flip: on.flip && r() < 0.5,
    angle: on.rotate ? u(-20, 20) * strength : 0,
    scale: on.scale ? u(1 - 0.3 * strength, 1 + 0.3 * strength) : 1,
    gain: on.bright ? u(1 - 0.4 * strength, 1 + 0.4 * strength) : 1,
    offset: on.bright ? u(-40, 40) * strength : 0,
    noise: on.noise ? 15 * strength : 0,
    cut: on.cutout ? { x: u(0, w - 40), y: u(0, h - 40), s: 20 + 40 * strength } : null,
  };
}

/** 2 × 3 affine matrix (like cv2.getRotationMatrix2D about the centre, then an optional horizontal flip). */
export function affine(p: AugParams, w: number, h: number) {
  const a = (p.angle * Math.PI) / 180, c = Math.cos(a) * p.scale, s = Math.sin(a) * p.scale, cx = w / 2, cy = h / 2;
  let m = [c, s, (1 - c) * cx - s * cy, -s, c, s * cx + (1 - c) * cy];
  if (p.flip) m = [-m[0], -m[1], w - m[2], m[3], m[4], m[5]]; // x' -> w - x'
  return m;
}

/** Axis-aligned box around the four transformed corners (how detection labels are usually updated). */
export function transformBox(b: { x: number; y: number; w: number; h: number }, m: number[]) {
  const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(([x, y]) => [m[0] * x + m[1] * y + m[2], m[3] * x + m[4] * y + m[5]]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
