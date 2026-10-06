// Field of view, angle of view and lens planning for FovPlanner (Chapter 2.4). Unit-tested.
// Thin lens, square pixels, no distortion; lengths in millimetres.
import { fovWidth } from "./lens-ops.ts";

export const STANDARD_LENSES = [6, 8, 12, 16, 25, 35, 50, 75];

/** Sensor width in mm from its pixel count and pixel size. */
export function sensorWidth(px: number, pitchMm: number): number {
  return px * pitchMm;
}

/** Full horizontal angle of view in degrees for a sensor of width w behind a lens of focal length f. */
export function angleOfView(w: number, f: number): number {
  return (2 * Math.atan(w / (2 * f)) * 180) / Math.PI;
}

/** Focal length that gives exactly `fov` at working distance wd (thin lens solved for f). */
export function focalForFov(w: number, wd: number, fov: number): number {
  return (w * wd) / (fov + w);
}

/** Apparent length of an object whose top is h closer to the camera than the calibration plane at wd. */
export function heightError(trueLen: number, wd: number, h: number): number {
  return (trueLen * wd) / (wd - h);
}

export type LensOption = { f: number; fov: number; mmpp: number; featurePx: number; ok: boolean };

/** Evaluate standard lenses against a requirement: FOV at least `needFov`, feature covers at least `pxPerFeature` pixels. */
export function planLenses(px: number, pitchMm: number, wd: number, needFov: number, featureMm: number, pxPerFeature: number): LensOption[] {
  const w = sensorWidth(px, pitchMm);
  return STANDARD_LENSES.filter((f) => f < wd / 4).map((f) => {
    const fov = fovWidth(wd, w, f);
    const mmpp = fov / px;
    const featurePx = featureMm / mmpp;
    return { f, fov, mmpp, featurePx, ok: fov >= needFov && featurePx >= pxPerFeature };
  });
}
