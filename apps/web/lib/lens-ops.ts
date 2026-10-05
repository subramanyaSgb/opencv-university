// Thin-lens helpers for FocusLab and LensFov (Chapter 2.2). Unit-tested in lens-ops.test.ts.
// Ideal thin lens, paraxial rays, no aberrations or diffraction. All lengths in millimetres.

/** Where a lens of focal length f forms the sharp image of an object s away: 1/f = 1/s + 1/s'. */
export function imageDistance(f: number, s: number): number {
  return 1 / (1 / f - 1 / s);
}

/**
 * Blur circle diameter on a sensor placed at `sensor` behind the lens, for an object whose sharp
 * image would form at `sharpAt`, with an aperture of diameter D (similar triangles of the light cone).
 */
export function blurCircle(D: number, sensor: number, sharpAt: number): number {
  return (D * Math.abs(sensor - sharpAt)) / sharpAt;
}

/** Width of the scene a sensor of width w sees at working distance wd (measured from the lens): w·(wd − f)/f. */
export function fovWidth(wd: number, sensorW: number, f: number): number {
  return (sensorW * (wd - f)) / f;
}
