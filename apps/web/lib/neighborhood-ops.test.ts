import { test } from "node:test";
import assert from "node:assert/strict";
import { applyAt, applyNb, isInterior, median, reflect101, replicate, window3 } from "./neighborhood-ops.ts";

const noisy = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => (r === 2 && c === 2 ? 0 : 100)));

test("borders: reflect-101 and replicate", () => {
  assert.equal(reflect101(-1, 5), 1);
  assert.equal(reflect101(5, 5), 3);
  assert.equal(replicate(-1, 5), 0);
  assert.equal(replicate(5, 5), 4);
});

test("mean matches cv2.blur(noisy, (3, 3)) on OpenCV 4.13.0", () => {
  assert.deepEqual(applyNb(noisy, "mean"), [
    [100, 100, 100, 100, 100],
    [100, 89, 89, 89, 100],
    [100, 89, 89, 89, 100],
    [100, 89, 89, 89, 100],
    [100, 100, 100, 100, 100],
  ]);
});

test("median matches cv2.medianBlur(noisy, 3): the noise pixel disappears", () => {
  assert.ok(applyNb(noisy, "median").flat().every((v) => v === 100));
});

test("chapter 1.5 section 11: mean of 10..90 is 50", () => {
  const g = [[10, 20, 30], [40, 50, 60], [70, 80, 90]];
  assert.equal(applyAt(g, 1, 1, "mean"), 50);
  assert.deepEqual(window3(g, 1, 1, "mean"), [10, 20, 30, 40, 50, 60, 70, 80, 90]);
  assert.ok(isInterior(g, 1, 1));
  assert.ok(!isInterior(g, 0, 1));
  assert.equal(median([5, 1, 9, 3, 7, 2, 8, 4, 6]), 5);
});
