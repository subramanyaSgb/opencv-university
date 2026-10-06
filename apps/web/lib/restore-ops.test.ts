import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { unsharp, laplacianSharpen, makePsf, otf, convolveFFT, wiener, richardsonLucy, fft2 } from "./restore-ops.ts";

const R = JSON.parse(readFileSync(new URL("./restore-ref.json", import.meta.url), "utf8"));
const W = 32, H = 16;
const close = (a: ArrayLike<number>, b: number[], tol: number) => { for (let i = 0; i < b.length; i++) assert.ok(Math.abs(a[i] - b[i]) <= tol, `index ${i}: ${a[i]} vs ${b[i]}`); };

test("FFT round trip", () => {
  const re = Float64Array.from(R.img), im = new Float64Array(W * H);
  fft2(re, im, W, H); fft2(re, im, W, H, true); close(re, R.img, 1e-9);
});

test("circular blur, Wiener and Richardson–Lucy equal the NumPy FFT reference", () => {
  const T = otf(makePsf("gauss", 1.5), W, H), img = Float64Array.from(R.img);
  const b = convolveFFT(img, W, H, T); close(b, R.blur, 1e-6);
  close(wiener(b, W, H, T, 0.01), R.wiener, 1e-6);
  close(richardsonLucy(b, W, H, T, 5), R.rl, 1e-6);
});

test("unsharp mask and Laplacian sharpening match OpenCV within 1", () => {
  close(unsharp(R.img, W, H, 1.0, 1.5), R.unsharp, 1);
  close(laplacianSharpen(R.img, W, H, 0.5), R.lap, 1); // halves: Math.round vs np.rint
});

test("PSFs sum to 1; motion PSF is a line", () => {
  for (const p of [makePsf("gauss", 2), makePsf("motion", 9, 30), makePsf("disk", 3)]) assert.ok(Math.abs(p.k.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  const m = makePsf("motion", 7, 0), r = (m.size - 1) / 2;
  assert.ok(m.k[r * m.size + r] > 0 && m.k[0] === 0);
});
