/** Chapter 14.5: synthetic video (textured background, moving object, sensor noise) and frame-differencing methods. */

export const W = 160, H = 100, OBJ = 24;

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

/** Fixed background: a horizontal gradient with a gentle texture (same in every frame). */
export function background() {
  const r = rng(11), b = new Float64Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) b[y * W + x] = 70 + 0.5 * x + 12 * Math.sin(x / 5) * Math.sin(y / 7) + 4 * (r() - 0.5);
  return b;
}

/** Object's left x at frame t; it moves right, stops for frames 12–19, then moves on. */
export const objX = (t: number) => 10 + 5 * Math.min(t, 12) + 5 * Math.max(0, t - 19);
export const OBJ_Y = 38;

/** Frame t: background, the object (uniform 170 with a slight texture), Gaussian noise of std sigma; plus the true object mask. */
export function frame(bg: Float64Array, t: number, sigma = 3) {
  const r = rng(1000 + t), f = new Uint8Array(W * H), truth = new Uint8Array(W * H), x0 = objX(t);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, inObj = x >= x0 && x < x0 + OBJ && y >= OBJ_Y && y < OBJ_Y + OBJ;
    const v = inObj ? 170 + 3 * Math.sin((x - x0) / 2) : bg[i];
    f[i] = Math.max(0, Math.min(255, Math.round(v + sigma * gauss(r))));
    truth[i] = inObj ? 1 : 0;
  }
  return { f, truth };
}

export type DiffMethod = "two" | "three" | "reference" | "running";

/** Motion mask at frame t (t ≥ 2) for a method; running average uses alpha per frame from frame 0. */
export function motionMask(frames: Uint8Array[], t: number, m: DiffMethod, thr: number, alpha = 0.05, ref?: Uint8Array) {
  const n = W * H, out = new Uint8Array(n), cur = frames[t];
  if (m === "two" || m === "three") {
    const p = frames[t - 1], q = frames[t - 2];
    for (let i = 0; i < n; i++) {
      const d1 = Math.abs(cur[i] - p[i]) > thr;
      out[i] = m === "two" ? (d1 ? 1 : 0) : d1 && Math.abs(p[i] - q[i]) > thr ? 1 : 0; // three-frame: marks the object at t − 1
    }
    return out;
  }
  let bgm: Float64Array;
  if (m === "reference") bgm = Float64Array.from(ref!);
  else { bgm = Float64Array.from(frames[0]); for (let k = 1; k < t; k++) for (let i = 0; i < n; i++) bgm[i] = (1 - alpha) * bgm[i] + alpha * frames[k][i]; }
  for (let i = 0; i < n; i++) out[i] = Math.abs(cur[i] - bgm[i]) > thr ? 1 : 0;
  return out;
}
