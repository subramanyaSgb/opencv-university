import { test } from "node:test";
import assert from "node:assert/strict";
import { pitchMM, arcmin, visibility, zoomNeeded } from "./acuity-ops.ts";

test("24-inch full-HD screen: pixel pitch about 0.277 mm", () => {
  assert.ok(Math.abs(pitchMM(24, 1920, 1080) - 0.27673) < 1e-4);
});

test("one such pixel at 600 mm is about 1.6 arcmin", () => {
  const a = arcmin(pitchMM(24, 1920, 1080), 600);
  assert.ok(Math.abs(a - 1.5856) < 1e-3);
  assert.equal(visibility(a), "limit");
});

test("1 mm at 3438 mm is 1 arcmin; zoom needed scales inversely", () => {
  assert.ok(Math.abs(arcmin(1, 3437.75) - 1) < 1e-4);
  const z = zoomNeeded(1, 0.27673, 600, 4);
  assert.ok(Math.abs(z * arcmin(0.27673, 600) - 4) < 1e-3);
});
