// Ideal pinhole camera helpers for PinholeLab (Chapter 2.1). Unit-tested in pinhole-ops.test.ts.
// Geometric optics only: no lens, no diffraction (Chapter 2.3), no distortion (Module 41).

/** Image height for an object of height X at distance Z, sensor at distance f behind the pinhole: x = f·X/Z. */
export function project(f: number, X: number, Z: number): number {
  return (f * X) / Z;
}

/**
 * Geometric blur spot on the sensor for a point at distance Z seen through a hole of diameter d.
 * Rays through the two edges of the hole spread by similar triangles: b = d·(Z + f)/Z.
 */
export function blurSpot(d: number, f: number, Z: number): number {
  return (d * (Z + f)) / Z;
}

/** Light collected relative to a reference hole: proportional to hole area, so (d / dRef)². */
export function relativeLight(d: number, dRef: number): number {
  return (d / dRef) ** 2;
}
