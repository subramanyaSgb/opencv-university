import { test } from "node:test";
import assert from "node:assert/strict";
import { autoLimits, colour, norm } from "./imshow-ops.ts";

test("auto limits make a 100..140 image use the full colour range (matches im.get_clim())", () => {
  assert.deepEqual(autoLimits([100, 120, 140]), [100, 140]);
  assert.equal(norm(140, 100, 140), 1);
  assert.equal(norm(120, 0, 255), 120 / 255);
  assert.equal(norm(300, 0, 255), 1);
  assert.equal(norm(5, 5, 5), 0);
});

test("colour maps", () => {
  assert.deepEqual(colour(0, "gray"), [0, 0, 0]);
  assert.deepEqual(colour(1, "gray"), [255, 255, 255]);
  assert.deepEqual(colour(0, "viridis"), [0x44, 0x01, 0x54]);
  assert.deepEqual(colour(1, "viridis"), [0xfd, 0xe7, 0x25]);
  assert.deepEqual(colour(0.5, "viridis"), [0x21, 0x91, 0x8c]);
});
