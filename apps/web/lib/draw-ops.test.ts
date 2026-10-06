import { test } from "node:test";
import assert from "node:assert/strict";
import { circle, line8, rect } from "./draw-ops.ts";

const sorted = (p: [number, number][]) => [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

// Reference pixel sets from cv2.line(img, p0, p1, 255, 1, cv2.LINE_8), OpenCV 4.13.0
test("lines match OpenCV LINE_8 exactly", () => {
  assert.deepEqual(sorted(line8([1, 2], [13, 7])), [[1, 2], [2, 2], [3, 3], [4, 3], [5, 4], [6, 4], [7, 4], [8, 5], [9, 5], [10, 6], [11, 6], [12, 7], [13, 7]]);
  assert.deepEqual(sorted(line8([2, 10], [6, 1])), [[2, 9], [2, 10], [3, 7], [3, 8], [4, 5], [4, 6], [5, 3], [5, 4], [6, 1], [6, 2]]);
  assert.deepEqual(sorted(line8([14, 3], [1, 9])), [[1, 9], [2, 9], [3, 8], [4, 8], [5, 7], [6, 7], [7, 6], [8, 6], [9, 5], [10, 5], [11, 4], [12, 4], [13, 3], [14, 3]]);
  assert.equal(line8([12, 1], [3, 10]).length, 10);
  assert.deepEqual(line8([5, 5], [5, 5]), [[5, 5]]);
});

test("rectangles and circles", () => {
  assert.equal(rect([0, 0], [3, 2], 1).length, 10);
  assert.equal(rect([0, 0], [3, 2], -1).length, 12);
  const c = circle([8, 8], 5, 1);
  assert.ok(c.some(([x, y]) => x === 13 && y === 8) && c.some(([x, y]) => x === 8 && y === 3));
});
