import { test } from "node:test";
import assert from "node:assert/strict";
import { srgbToLinear, linearToSrgb, weber, ramp } from "./weber-ops.ts";

// values from the Python example in Chapter 9.2
test("sRGB transfer", () => {
  assert.ok(Math.abs(srgbToLinear(128) - 0.2159) < 1e-4);
  assert.equal(linearToSrgb(0.5), 188);
  assert.equal(linearToSrgb(srgbToLinear(77)), 77);
});

test("Weber contrast with and without ambient light", () => {
  assert.ok(Math.abs(weber(30, 24) - 0.296) < 1e-3);
  assert.ok(Math.abs(weber(30, 24, 0.02) - 0.117) < 1e-3);
  assert.ok(Math.abs(weber(200, 194) - 0.066) < 1e-3);
});

test("ramps", () => {
  assert.deepEqual(ramp(5, true), [0, 64, 128, 191, 255]);
  assert.deepEqual(ramp(3, false), [0, 188, 255]);
});
