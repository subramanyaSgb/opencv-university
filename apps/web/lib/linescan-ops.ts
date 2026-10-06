// Line-scan camera helpers for LineScanLab (Chapter 2.10). Unit-tested.

/** mm per pixel across the line (field of view width ÷ sensor pixels). */
export function crossRes(fovMm: number, pixels: number): number {
  return fovMm / pixels;
}

/** mm the object moves between two lines: speed (m/s) ÷ line rate (Hz). */
export function alongRes(speed: number, lineRateHz: number): number {
  return (speed * 1000) / lineRateHz;
}

/** Line rate (Hz) that gives square pixels at this speed. */
export function lineRateForSquare(speed: number, crossMm: number): number {
  return (speed * 1000) / crossMm;
}

/** Bytes per second for 8-bit pixels. */
export function dataRate(pixels: number, lineRateHz: number, bytesPerPixel = 1): number {
  return pixels * lineRateHz * bytesPerPixel;
}
