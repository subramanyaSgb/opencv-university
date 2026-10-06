import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dft, idft, logSpectrum, transfer, applyFilter, notchReject, peaks, wave, psnr, freq } from "./fourier-ops.ts";

const R = JSON.parse(readFileSync(new URL("./fourier-ref.json", import.meta.url), "utf8"));
const maxDiff = (a: ArrayLike<number>, b: ArrayLike<number>) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };

test("logSpectrum equals log1p(|fftshift(fft2)|)", () => { assert.ok(maxDiff(logSpectrum(dft(R.crop, 64, 64), 64, 64), R.logspec) < 1e-9); });
test("ideal, Butterworth, Gaussian low- and high-pass equal NumPy", () => {
  for (const k of ["ideal", "butterworth", "gaussian"] as const) {
    assert.ok(maxDiff(applyFilter(R.crop, transfer(k, 10, 64, 64), 64, 64), R[k]) < 1e-8, k);
    assert.ok(maxDiff(applyFilter(R.crop, transfer(k, 10, 64, 64, true), 64, 64), R[k + "_hp"]) < 1e-8, k + " hp");
  }
});
test("inverse of forward is the identity; freq order", () => {
  assert.ok(maxDiff(idft(dft(R.crop, 64, 64), 64, 64), R.crop) < 1e-9);
  assert.deepEqual([0, 1, 31, 32, 33, 63].map((i) => freq(i, 64)), [0, 1, 31, -32, -31, -1]);
});
test("a wave has a peak at its frequency; a notch removes it", () => {
  const w = wave(64, 64, 5, 3, 20, 0.3, 100), P = peaks(dft(w, 64, 64), 64, 64, 1);
  assert.deepEqual([P[0].u, P[0].v], [5, 3]);
  const out = applyFilter(w, notchReject([[5, 3]], 2, 64, 64), 64, 64);
  const mean = out.reduce((a, b) => a + b, 0) / out.length;
  assert.ok(maxDiff(out, new Float64Array(64 * 64).fill(mean)) < 1e-6); // the wave is gone; the notch skirts dim the mean slightly
  assert.equal(psnr([1, 2], [1, 2]), Infinity);
});
