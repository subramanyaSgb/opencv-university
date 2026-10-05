// Pixel ↔ millimetre helpers for ScaleCalc. Unit-tested in scale-ops.test.ts.
// Simple model: a flat object, square pixels, no lens distortion, camera square-on (Chapter 41 removes these limits).

/** Millimetres covered by one pixel: field of view width / image width in pixels. */
export function mmPerPixel(fovMm: number, imagePx: number): number {
  return fovMm / imagePx;
}

/** Physical length of something that spans `px` pixels. */
export function lengthMm(px: number, fovMm: number, imagePx: number): number {
  return px * mmPerPixel(fovMm, imagePx);
}

/** Round to a sensible number of decimals for display. */
export function fmt(v: number, digits = 2): string {
  return (Math.round(v * 10 ** digits) / 10 ** digits).toString();
}
