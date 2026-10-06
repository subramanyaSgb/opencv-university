import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticGaussianMtf, gaussianEsf, lsfFromEsf, mtf50, mtfAt, sampleEsf } from "./mtf-ops.ts";

test("gaussianEsf: 0.5 at the edge, -> 0 and 1 far from it, matches a sharp step at sigma = 0", () => {
  assert.ok(Math.abs(gaussianEsf(0, 1.2) - 0.5) < 1e-6);
  assert.ok(gaussianEsf(-10, 1.2) < 1e-6);
  assert.ok(gaussianEsf(10, 1.2) > 1 - 1e-6);
  assert.equal(gaussianEsf(-0.1, 0), 0);
  assert.equal(gaussianEsf(0.1, 0), 1);
});

test("measured MTF (ESF -> LSF -> DFT) matches the closed-form Gaussian MTF, as in the chapter's own cv2.GaussianBlur + binning check", () => {
  const sigma = 1.2, binWidth = 0.1;
  const esf = sampleEsf(sigma, binWidth);
  const lsf = lsfFromEsf(esf, binWidth);
  const freqs = [0.05, 0.1, 0.2, 0.3, 0.4];
  const measured = mtfAt(lsf, binWidth, freqs);
  freqs.forEach((f, i) => {
    assert.ok(Math.abs(measured[i] - analyticGaussianMtf(f, sigma)) < 0.001);
  });
});

test("mtf50 matches the frequency where the closed-form MTF actually crosses 0.5", () => {
  for (const sigma of [0.8, 1.2, 1.6, 2.0]) {
    const f50 = mtf50(sigma);
    assert.ok(Math.abs(analyticGaussianMtf(f50, sigma) - 0.5) < 1e-9);
  }
});
