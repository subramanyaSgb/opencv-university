// Image size and bandwidth helpers for SizeCalc (Chapter 4.1). Unit-tested.

/** Bytes per uncompressed frame. Samples of 9–16 bits are stored in 2 bytes. */
export function frameBytes(w: number, h: number, channels: number, bits: number): number {
  return w * h * channels * (bits <= 8 ? 1 : 2);
}

/** Usable payload of a link in bytes per second, assuming a fraction `eff` of the raw bit rate. */
export function linkBytesPerSec(bitsPerSec: number, eff = 0.9): number {
  return (bitsPerSec / 8) * eff;
}
