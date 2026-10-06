import { test } from "node:test";
import assert from "node:assert/strict";
import { centralDiff, edgeProfile, secondDiff, smooth, subpixelPeak } from "./deriv-ops.ts";

const f = edgeProfile(20, 10.3, 1);

test("profile and differences match the chapter's NumPy output", () => {
  assert.deepEqual(f.slice(6, 15), [52, 55, 64, 82, 114, 150, 177, 191, 196]);
  assert.deepEqual(centralDiff(f).slice(6, 15), [2, 6, 13.5, 25, 34, 31.5, 20.5, 9.5, 4]);
  assert.deepEqual(secondDiff(f).slice(6, 15), [2, 6, 9, 14, 4, -9, -13, -9, -2]);
});

test("sub-pixel edge = 10.28", () => {
  const p = subpixelPeak(centralDiff(f));
  assert.equal(p.index, 10);
  assert.equal(Math.round(p.position * 100) / 100, 10.28);
});

test("smoothing keeps a constant, reduces a spike, sigma 0 is identity", () => {
  assert.deepEqual(smooth([5, 5, 5, 5], 1).map((v) => Math.round(v * 1e9) / 1e9), [5, 5, 5, 5]);
  const s = smooth([0, 0, 0, 10, 0, 0, 0], 1);
  assert.ok(s[3] < 5 && s[3] > 3);
  assert.deepEqual(smooth([1, 2], 0), [1, 2]);
});
