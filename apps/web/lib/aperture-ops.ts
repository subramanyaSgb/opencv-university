// Aperture, depth of field and diffraction helpers for ApertureLab (Chapter 2.3). Unit-tested.
// Ideal thin lens; lengths in millimetres. Diffraction: Airy disk diameter to the first dark ring.
import { blurCircle, imageDistance } from "./lens-ops.ts";

export const WAVELENGTH_MM = 0.00055; // green light, 550 nm

/** f-number N = f / D. */
export function fNumber(f: number, D: number): number {
  return f / D;
}

/** Light collected at f-number N relative to f-number ref: proportional to aperture area, so (ref / N)². */
export function lightRelative(N: number, ref: number): number {
  return (ref / N) ** 2;
}

/** Airy disk diameter (first dark ring) on the sensor: 2.44 · λ · N. */
export function airyDiameter(N: number, wavelength = WAVELENGTH_MM): number {
  return 2.44 * wavelength * N;
}

/** Near and far limits of acceptable sharpness for focus distance s and acceptable blur c (exact thin-lens form). */
export function dofLimits(f: number, N: number, s: number, c: number): { near: number; far: number; hyperfocal: number } {
  const H = (f * f) / (N * c) + f;
  const near = (s * (H - f)) / (H + s - 2 * f);
  const far = s < H ? (s * (H - f)) / (H - s) : Infinity;
  return { near, far, hyperfocal: H };
}

/** Worst defocus blur (mm on the sensor) over a part spanning [s1, s2], focus set at s. */
export function defocusOverRange(f: number, N: number, s: number, s1: number, s2: number): number {
  const sensor = imageDistance(f, s);
  return Math.max(...[s1, s2].map((x) => blurCircle(f / N, sensor, imageDistance(f, x))));
}

/** Rough total blur: defocus and diffraction combined as root-sum-square. */
export function totalBlur(defocus: number, airy: number): number {
  return Math.hypot(defocus, airy);
}
