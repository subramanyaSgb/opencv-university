import { test } from "node:test";
import assert from "node:assert/strict";
import { perceived, staircase } from "./contrast-ops.ts";

// values from the NumPy example in Chapter 9.3 (sigma 4, radius 15, a = 0.6)
test("Mach band overshoot at a step edge", () => {
  const p = perceived(staircase([60, 100, 140, 180], 20), 4, 0.6, 15).map((v) => Math.round(v));
  assert.deepEqual(p.slice(16, 24), [55, 54, 52, 49, 111, 108, 106, 105]);
  assert.deepEqual(p.slice(28, 32), [100, 100, 100, 100]);
});

test("no inhibition, no change", () => {
  const s = staircase([10, 20], 5);
  assert.deepEqual(perceived(s, 2, 0).map((v) => Math.round(v * 1e6) / 1e6), s);
});
