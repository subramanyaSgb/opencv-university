import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate, deltaE } from "./cvd-ops.ts";

// expected values from the Python examples in Chapter 9.4 (OpenCV 4.13 Lab, NumPy simulation)
test("simulated status colours", () => {
  assert.deepEqual(simulate([40, 180, 60], "deuteranopia"), [168, 152, 71]);
  assert.deepEqual(simulate([220, 40, 40], "deuteranopia"), [143, 128, 30]);
  assert.deepEqual(simulate([220, 40, 40], "tritanopia"), [243, 0, 43]);
});

test("ΔE close to OpenCV's Lab", () => {
  assert.ok(Math.abs(deltaE([220, 40, 40], [40, 180, 60]) - 127.3) < 1.5);
  assert.ok(Math.abs(deltaE(simulate([220, 40, 40], "deuteranopia"), simulate([40, 180, 60], "deuteranopia")) - 11.8) < 1.5);
  assert.ok(Math.abs(deltaE([230, 159, 0], [0, 114, 178]) - 120.2) < 1.5);
});
