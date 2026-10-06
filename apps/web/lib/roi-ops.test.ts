import { test } from "node:test";
import assert from "node:assert/strict";
import { inRange, rectFromDrag } from "./roi-ops.ts";

test("drag in any direction, clipped, empty", () => {
  assert.deepEqual(rectFromDrag([50, 40], [10, 90], 320, 200), [10, 40, 40, 50]);
  assert.deepEqual(rectFromDrag([300, 190], [400, 250], 320, 200), [300, 190, 20, 10]);
  assert.equal(rectFromDrag([5, 5], [5, 30], 320, 200), null);
});

test("inRange is inclusive at both ends", () => {
  const r = inRange([10, 20, 30, 40], 20, 30);
  assert.deepEqual([...r.mask], [0, 255, 255, 0]);
  assert.equal(r.count, 2);
});
