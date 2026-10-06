// Exposure and motion-blur helpers for MotionLab (Chapter 2.6). Unit-tested.

/** Distance in mm an object moving at `speed` m/s travels during an exposure of `exposureUs` microseconds. */
export function travelMm(speed: number, exposureUs: number): number {
  return speed * 1000 * exposureUs * 1e-6;
}

/** Motion blur in pixels for a scale of `mmPerPx`. */
export function blurPx(speed: number, exposureUs: number, mmPerPx: number): number {
  return travelMm(speed, exposureUs) / mmPerPx;
}

/** Longest exposure (µs) that keeps motion blur at or below `maxPx` pixels. */
export function maxExposureUs(speed: number, mmPerPx: number, maxPx: number): number {
  return (maxPx * mmPerPx) / (speed * 1000) * 1e6;
}
