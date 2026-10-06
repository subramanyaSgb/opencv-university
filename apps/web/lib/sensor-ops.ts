// Simple sensor model for SensorLab (Chapter 2.5). Unit-tested in sensor-ops.test.ts.
// photons → electrons (QE) with shot noise √e, plus read noise; gain and ADC map electrons to 8-bit DN.

export const QE = 0.6;
export const FULL_WELL = 10000; // electrons; maps to 255 DN at gain 1

/** Mean electrons collected for a given number of photons. */
export function electrons(photons: number, qe = QE): number {
  return photons * qe;
}

/** Total temporal noise in electrons: shot noise and read noise add in quadrature. */
export function noiseElectrons(e: number, readNoise: number, darkE = 0): number {
  return Math.sqrt(e + darkE + readNoise * readNoise);
}

/** Signal-to-noise ratio (no gain dependence: gain scales signal and noise together). */
export function snr(e: number, readNoise: number, darkE = 0): number {
  return e / noiseElectrons(e, readNoise, darkE);
}

/** Electrons to 8-bit digital numbers with gain (before clipping). */
export function toDN(e: number, gain: number, fullWell = FULL_WELL): number {
  return (e * gain * 255) / fullWell;
}

/** Dynamic range in dB: full well over read noise. */
export function dynamicRangeDb(fullWell: number, readNoise: number): number {
  return 20 * Math.log10(fullWell / readNoise);
}

/** Small seeded RNG (mulberry32) so the simulated noise is stable between renders. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box–Muller). */
export function gauss(r: () => number): number {
  const u = Math.max(r(), 1e-12), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Poisson sample: exact (Knuth) for small means, normal approximation above 30. */
export function poisson(mean: number, r: () => number): number {
  if (mean <= 0) return 0;
  if (mean > 30) return Math.max(0, Math.round(mean + Math.sqrt(mean) * gauss(r)));
  const L = Math.exp(-mean);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}
