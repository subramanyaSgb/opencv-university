import { test } from "node:test";
import assert from "node:assert/strict";
import { inBounds, normRegion, rectPoints, regionMean, regionShape, sliceExpr } from "./grid-ops.ts";

test("normRegion accepts corners in any order", () => {
  assert.deepEqual(normRegion([3, 5], [1, 2]), { r0: 1, r1: 3, c0: 2, c1: 5 });
});

test("slice is rows first and end-exclusive (Chapter 1.2, section 23)", () => {
  const g = normRegion([0, 0], [1, 1]);
  assert.equal(sliceExpr(g), "image[0:2, 0:2]");
  assert.deepEqual(regionShape(g), [2, 2]);
});

test("OpenCV rectangle points are (x, y) = (column, row)", () => {
  // Same box as numpy z[30:130, 50:250] = 255  ==  cv2.rectangle(z, (50, 30), (249, 129), 255, -1)
  const g = { r0: 30, r1: 129, c0: 50, c1: 249 };
  assert.deepEqual(rectPoints(g), [[50, 30], [249, 129]]);
  assert.equal(sliceExpr(g), "image[30:130, 50:250]");
  assert.deepEqual(regionShape(g), [100, 200]);
});

test("regionMean and bounds", () => {
  const img = [[0, 50, 100], [50, 100, 150], [100, 150, 255]];
  assert.equal(regionMean(img, { r0: 0, r1: 1, c0: 0, c1: 1 }), 50);
  assert.ok(inBounds(2, 2, 3, 3));
  assert.ok(!inBounds(3, 2, 3, 3));
  assert.ok(!inBounds(2, 3, 3, 3));
});
