/** White balance for Chapter 10.6. Scenes are lists of patches with linear reflectance (B, G, R) and an area weight. */
export type Trip = [number, number, number];
export interface Patch { name: string; refl: Trip; area: number }

/** Linear camera values (0..255) of a patch under an illuminant (per-channel gains), clipped. */
export function capture(p: Patch, light: Trip): Trip {
  return p.refl.map((r, i) => Math.min(255, 255 * r * light[i])) as Trip;
}

export type WbMethod = "none" | "greyworld" | "whitepatch" | "reference";

/** Per-channel gains (B, G, R) that the method applies; G is kept at 1. */
export function gains(scene: Patch[], light: Trip, method: WbMethod, refName = "white card"): Trip {
  const obs = scene.map((p) => ({ p, v: capture(p, light) }));
  let est: Trip;
  if (method === "none") return [1, 1, 1];
  if (method === "greyworld") {
    const tot = scene.reduce((a, p) => a + p.area, 0);
    est = [0, 1, 2].map((i) => obs.reduce((a, o) => a + o.v[i] * o.p.area, 0) / tot) as Trip;
  } else if (method === "whitepatch") {
    est = [0, 1, 2].map((i) => Math.max(...obs.map((o) => o.v[i]))) as Trip;
  } else {
    est = obs.find((o) => o.p.name === refName)!.v;
  }
  return [est[1] / est[0], 1, est[1] / est[2]];
}

export function apply(v: Trip, g: Trip): Trip {
  return v.map((x, i) => Math.min(255, x * g[i])) as Trip;
}

/** Colour cast of a neutral patch: max channel ratio − 1 (0 = perfectly neutral). */
export function cast(v: Trip) {
  const m = Math.min(...v);
  return m > 0 ? Math.max(...v) / m - 1 : Infinity;
}
