// Aliasing helpers for AliasLab (Chapter 3.5). Unit-tested.

/** The frequency a pattern of frequency f appears to have when sampled at fs (same units, e.g. cycles per mm). */
export function aliasFrequency(f: number, fs: number): number {
  return Math.abs(f - Math.round(f / fs) * fs);
}

/** Nyquist frequency: the highest frequency that can be represented, fs / 2. */
export function nyquist(fs: number): number {
  return fs / 2;
}
