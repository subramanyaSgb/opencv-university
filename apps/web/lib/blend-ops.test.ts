import { test } from "node:test";
import assert from "node:assert/strict";
import { addWeighted, composite, feather } from "./blend-ops.ts";

test("addWeighted matches recorded cv2.addWeighted results (float32, half to even)", () => {
  const a = [0, 10, 100, 255, 3], b = [255, 20, 101, 0, 4];
  assert.deepEqual(Array.from(addWeighted(a, 0.5, b, 0.5)), [128, 15, 100, 128, 4]);
  assert.deepEqual(Array.from(addWeighted(a, 0.25, b, 0.75)), [191, 18, 101, 64, 4]);
  assert.deepEqual(Array.from(addWeighted(a, 0.7, b, 1 - 0.7)), [76, 13, 100, 178, 3]);
});

test("composite: alpha 255 takes a, 0 takes b; linear-light mix of black and white is brighter than 128", () => {
  const out = composite([200, 10], [50, 90], [255, 0], 1);
  assert.deepEqual(Array.from(out), [200, 90]);
  assert.equal(composite([0], [255], [128], 1)[0], 127);
  assert.ok(composite([0], [255], [128], 1, true)[0] > 180);
});

test("feather keeps a constant mask and softens an edge", () => {
  assert.deepEqual(Array.from(feather(new Array(9).fill(255), 3, 3, 1)), new Array(9).fill(255));
  const edge = feather([0, 0, 0, 255, 255, 255], 6, 1, 1);
  assert.ok(edge[2] > 0 && edge[3] < 255);
});
