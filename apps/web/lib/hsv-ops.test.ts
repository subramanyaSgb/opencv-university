import { test } from "node:test";
import assert from "node:assert/strict";
import { bgrToHsv8, bgrToHsvFloat, hsv8ToBgr } from "./hsv-ops.ts";

// reference values from cv2.cvtColor(..., COLOR_BGR2HSV / COLOR_HSV2BGR), OpenCV 4.13.0
test("BGR -> 8-bit HSV", () => {
  const cases: [number[], number[]][] = [
    [[0, 0, 255], [0, 255, 255]], [[0, 255, 0], [60, 255, 255]], [[255, 0, 0], [120, 255, 255]],
    [[0, 255, 255], [30, 255, 255]], [[40, 150, 255], [15, 215, 255]], [[128, 128, 128], [0, 0, 128]],
    [[10, 20, 200], [2, 242, 200]], [[200, 20, 10], [118, 242, 200]], [[30, 60, 90], [15, 170, 90]],
  ];
  for (const [bgr, hsv] of cases) assert.deepEqual(bgrToHsv8(bgr as [number, number, number]), hsv, String(bgr));
});

test("float hue in degrees", () => {
  assert.ok(Math.abs(bgrToHsvFloat([40, 150, 255])[0] - 30.698) < 1e-3);
});

test("HSV -> BGR", () => {
  assert.deepEqual(hsv8ToBgr([170, 200, 200]), [95, 43, 200]);
  assert.deepEqual(hsv8ToBgr([5, 200, 200]), [43, 69, 200]);
  assert.deepEqual(hsv8ToBgr([90, 255, 128]), [128, 128, 0]);
});
