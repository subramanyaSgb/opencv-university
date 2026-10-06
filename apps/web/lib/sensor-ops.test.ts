import { test } from "node:test";
import assert from "node:assert/strict";
import { dynamicRangeDb, electrons, gauss, noiseElectrons, poisson, rng, snr, toDN } from "./sensor-ops.ts";

const close = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("shot noise: 100 e- → SNR 10; 10 000 e- → SNR 100 (no read noise)", () => {
  close(snr(100, 0), 10, 1e-9);
  close(snr(10000, 0), 100, 1e-9);
});

test("Code example 2: 12 000 photons → 7200 e- → SNR 84.6; 750 photons → SNR 20.4", () => {
  close(snr(electrons(12000), 6), 84.6, 0.05);
  close(snr(electrons(750), 6), 20.4, 0.05);
  close(noiseElectrons(0, 6), 6, 1e-9);
});

test("gain 1: full well is 255 DN; dynamic range 10 000 / 6 is 64.4 dB", () => {
  close(toDN(10000, 1), 255, 1e-9);
  close(dynamicRangeDb(10000, 6), 64.4, 0.05);
});

test("seeded Poisson and normal samplers have the right mean and spread", () => {
  const r = rng(7);
  const n = 20000;
  for (const m of [4, 400]) {
    let s = 0, s2 = 0;
    for (let i = 0; i < n; i++) { const x = poisson(m, r); s += x; s2 += x * x; }
    const mean = s / n, v = s2 / n - mean * mean;
    close(mean, m, m * 0.03 + 0.1);
    close(v, m, m * 0.08 + 0.3);
  }
  let g = 0;
  for (let i = 0; i < n; i++) g += gauss(r);
  close(g / n, 0, 0.03);
});
