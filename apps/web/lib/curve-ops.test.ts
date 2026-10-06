import { test } from "node:test";
import assert from "node:assert/strict";
import { lut, histogram } from "./curve-ops.ts";

// reference values computed with NumPy/OpenCV formulas in Chapters 11.1–11.4
test("negative, log, gamma", () => {
  assert.equal(lut("negative")[30], 225);
  const L = lut("log");
  assert.deepEqual([L[0], L[1], L[10], L[100], L[255]], [0, 32, 110, 212, 255]);
  const G = lut("gamma", { gamma: 0.5 });
  assert.deepEqual([G[0], G[16], G[64], G[255]], [0, 64, 128, 255]);
});

test("stretch, slice, threshold, contrast", () => {
  const S = lut("stretch", { lo: 50, hi: 150 });
  assert.deepEqual([S[40], S[50], S[100], S[150], S[200]], [0, 0, 128, 255, 255]);
  assert.deepEqual([lut("slice", { lo: 100, hi: 150 })[120], lut("slice", { lo: 100, hi: 150 })[90], lut("slice", { lo: 100, hi: 150, keep: true })[90]], [255, 0, 90]);
  assert.deepEqual([lut("threshold", { t: 128 })[128], lut("threshold", { t: 128 })[129]], [0, 255]);
  assert.equal(lut("contrast", { alpha: 1.5, beta: -40 })[100], 110);
});

test("histogram", () => {
  const h = histogram([0, 0, 255, 7]);
  assert.equal(h[0], 2); assert.equal(h[7], 1); assert.equal(h[255], 1);
});
