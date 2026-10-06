import { test } from "node:test";
import assert from "node:assert/strict";
import { gray } from "./gray-ops.ts";

// BT.601 values from cv2.cvtColor(..., COLOR_BGR2GRAY), OpenCV 4.13.0
test("BT.601 matches OpenCV", () => {
  assert.equal(gray([40, 40, 200], "bt601"), 88);
  assert.equal(gray([40, 140, 60], "bt601"), 105);
  assert.equal(gray([200, 90, 30], "bt601"), 85);
  assert.equal(gray([40, 190, 230], "bt601"), 185);
});

test("a red label on a green background can vanish in grey", () => {
  const red: [number, number, number] = [40, 40, 200], green: [number, number, number] = [40, 112, 60];
  assert.equal(gray(red, "bt601"), gray(green, "bt601"));
  assert.ok(Math.abs(gray(red, "r") - gray(green, "r")) > 100);
  assert.equal(gray([128, 128, 128], "lstar"), 137);
});
