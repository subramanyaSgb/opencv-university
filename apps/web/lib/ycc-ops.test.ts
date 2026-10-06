import { test } from "node:test";
import assert from "node:assert/strict";
import { bgrToYcrcb, ycrcbToBgr } from "./ycc-ops.ts";

// reference values from cv2.cvtColor(..., COLOR_BGR2YCrCb / COLOR_YCrCb2BGR), OpenCV 4.13.0
test("BGR -> YCrCb", () => {
  const cases: [number[], number[]][] = [
    [[0, 0, 255], [76, 255, 85]], [[0, 255, 0], [150, 21, 43]], [[255, 0, 0], [29, 107, 255]],
    [[128, 128, 128], [128, 128, 128]], [[40, 150, 255], [169, 189, 55]], [[20, 75, 120], [82, 155, 93]],
    [[10, 37, 60], [41, 142, 111]], [[255, 255, 255], [255, 128, 128]],
  ];
  // OpenCV's 8-bit path uses fixed-point arithmetic: allow a difference of 1
  for (const [bgr, ycc] of cases) bgrToYcrcb(bgr as [number, number, number]).forEach((v, i) => assert.ok(Math.abs(v - ycc[i]) <= 1, String(bgr)));
});

test("YCrCb -> BGR", () => {
  assert.deepEqual(ycrcbToBgr([100, 150, 90]), [33, 97, 131]);
});
