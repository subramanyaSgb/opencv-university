import { CMAPS } from "./colormap-data.ts";
import { toLab, simulate, type RGB, type Cvd } from "./cvd-ops.ts";

export const MAP_NAMES = ["viridis", "cividis", "inferno", "turbo", "jet", "gray"] as const;

export function lut(name: string, i: number): RGB {
  const s = CMAPS[name];
  const k = Math.max(0, Math.min(255, Math.round(i))) * 6;
  return [parseInt(s.slice(k, k + 2), 16), parseInt(s.slice(k + 2, k + 4), 16), parseInt(s.slice(k + 4, k + 6), 16)];
}

/** L* of every entry (optionally as seen with a colour vision deficiency). */
export function lightness(name: string, cvd: Cvd = "normal") {
  return Array.from({ length: 256 }, (_, i) => toLab(simulate(lut(name, i), cvd))[0]);
}

/** Lightness increases (or decreases) steadily: no reversals larger than `tol` L* units. */
export function monotonic(L: number[], tol = 0.5) {
  const d = L.slice(1).map((v, i) => v - L[i]);
  return d.every((x) => x >= -tol) || d.every((x) => x <= tol);
}
