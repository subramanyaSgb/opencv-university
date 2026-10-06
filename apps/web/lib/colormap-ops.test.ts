import { test } from "node:test";
import assert from "node:assert/strict";
import { lut, lightness, monotonic } from "./colormap-ops.ts";

// endpoints recorded from cv2.applyColorMap; lightness checks match the Python example in Chapter 9.5
test("lookup tables", () => {
  assert.deepEqual(lut("gray", 77), [77, 77, 77]);
  assert.equal(lut("viridis", 0).length, 3);
});

test("perceptually uniform maps are monotonic in L*, jet and turbo are not", () => {
  for (const m of ["viridis", "cividis", "inferno", "gray"]) assert.ok(monotonic(lightness(m)), m);
  for (const m of ["jet", "turbo"]) assert.ok(!monotonic(lightness(m)), m);
  const Lv = lightness("viridis");
  assert.ok(Math.abs(Lv[0] - 14.8) < 1.5 && Math.abs(Lv[255] - 90.7) < 1.5);
});
