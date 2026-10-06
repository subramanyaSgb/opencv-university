// Rolling shutter and flicker helpers for ShutterLab (Chapter 2.9). Unit-tested.

/** Time from the first row's exposure start to the last row's, in seconds. */
export function readoutTime(rows: number, lineTime: number): number {
  return rows * lineTime;
}

/** Horizontal skew in pixels for an object at `speed` m/s during the readout, at `mmPerPx`. */
export function skewPx(speed: number, readout: number, mmPerPx: number): number {
  return (speed * 1000 * readout) / mmPerPx;
}

/**
 * Relative brightness of a row exposed from t0 for `exposure` seconds under a light
 * 1 + depth·cos(2π·f·t): the average of the light over the exposure window.
 */
export function rowFlicker(t0: number, exposure: number, f: number, depth: number): number {
  const w = 2 * Math.PI * f;
  return 1 + (depth * (Math.sin(w * (t0 + exposure)) - Math.sin(w * t0))) / (w * exposure);
}

/** Peak-to-peak row brightness variation (fraction of the mean) over `rows` rows. */
export function bandingDepth(exposure: number, f: number, depth: number, rows: number, lineTime: number): number {
  let lo = Infinity, hi = -Infinity, sum = 0;
  for (let y = 0; y < rows; y++) {
    const b = rowFlicker(y * lineTime, exposure, f, depth);
    lo = Math.min(lo, b); hi = Math.max(hi, b); sum += b;
  }
  return (hi - lo) / (sum / rows);
}
