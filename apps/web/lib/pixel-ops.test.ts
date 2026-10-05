import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyPointOp,
  clampU8,
  countAbove,
  explainPointOp,
  gridStats,
  mapGrid,
  moveSelection,
  roundHalfEven,
  setPixel,
  sliderPercent,
  validateGrid,
  wrapU8,
  type OpParams,
} from "./pixel-ops.ts";

// The 3×3 image from the Chapter 1.1 Code section. Expected values match
// the real output of opencv-python 4.13.0.92 printed in the chapter.
const IMG = [
  [50, 80, 120],
  [90, 200, 230],
  [30, 160, 255],
];
const sat: OpParams = { amount: 50, threshold: 128, arithmetic: "saturate", factor: 0.5 };
const wrap: OpParams = { ...sat, arithmetic: "wrap" };

test("clampU8 and wrapU8 match OpenCV saturation and NumPy uint8 wrap", () => {
  assert.equal(clampU8(260), 255);
  assert.equal(clampU8(-5), 0);
  assert.equal(wrapU8(260), 4); // OpenCV tutorial example: 250 + 10 with NumPy -> 4
  assert.equal(wrapU8(-1), 255);
});

test("invert matches cv2.bitwise_not", () => {
  assert.deepEqual(mapGrid(IMG, (v) => applyPointOp("invert", v)), [
    [205, 175, 135],
    [165, 55, 25],
    [225, 95, 0],
  ]);
});

test("brighten +50 matches cv2.add (saturating)", () => {
  assert.deepEqual(mapGrid(IMG, (v) => applyPointOp("brighten", v, sat)), [
    [100, 130, 170],
    [140, 250, 255],
    [80, 210, 255],
  ]);
});

test("brighten +50 with wrap matches NumPy img + 50", () => {
  assert.deepEqual(mapGrid(IMG, (v) => applyPointOp("brighten", v, wrap)), [
    [100, 130, 170],
    [140, 250, 24],
    [80, 210, 49],
  ]);
});

test("threshold matches cv2.threshold(img, 128, 255, THRESH_BINARY)", () => {
  assert.deepEqual(mapGrid(IMG, (v) => applyPointOp("threshold", v, sat)), [
    [0, 0, 0],
    [0, 255, 255],
    [0, 255, 255],
  ]);
  assert.equal(applyPointOp("threshold", 128, sat), 0, "128 is not > 128");
});

test("stats: mean 135, 4 pixels above 128", () => {
  assert.equal(gridStats(IMG).mean, 135);
  assert.equal(countAbove(IMG, 128), 4);
});

test("explanations show real numbers", () => {
  assert.equal(explainPointOp("invert", 230), "255 − 230 = 25");
  assert.equal(explainPointOp("brighten", 230, sat), "230 + 50 = 280 → clipped to 255");
  assert.equal(explainPointOp("brighten", 230, wrap), "230 + 50 = 280 → wraps around to 24");
  assert.equal(explainPointOp("brighten", 10, { ...sat, amount: -20 }), "10 − 20 = -10 → clipped to 0");
  assert.equal(explainPointOp("threshold", 120, sat), "120 ≤ 128 → 0");
});

test("validateGrid rejects ragged and out-of-range grids", () => {
  assert.doesNotThrow(() => validateGrid(IMG));
  assert.throws(() => validateGrid([[1, 2], [3]]), /row 1/);
  assert.throws(() => validateGrid([[256]]), /0\.\.255/);
  assert.throws(() => validateGrid([]), /empty/);
});

test("setPixel clamps and does not mutate the input", () => {
  const out = setPixel(IMG, 0, 0, 999);
  assert.equal(out[0][0], 255);
  assert.equal(IMG[0][0], 50);
});

test("moveSelection stays inside the grid", () => {
  assert.deepEqual(moveSelection([0, 0], "ArrowUp", 3, 3), [0, 0]);
  assert.deepEqual(moveSelection([0, 0], "ArrowRight", 3, 3), [0, 1]);
  assert.deepEqual(moveSelection([2, 2], "ArrowDown", 3, 3), [2, 2]);
});

test("sliderPercent clamps to 0..100", () => {
  assert.equal(sliderPercent(150, 100, 200), 25);
  assert.equal(sliderPercent(0, 100, 200), 0);
  assert.equal(sliderPercent(999, 100, 200), 100);
});

test("multiply ×0.5 matches cv2.multiply (Chapter 1.1, section 6)", () => {
  const img = [[100, 150, 200], [50, 120, 250], [20, 80, 180]];
  assert.deepEqual(mapGrid(img, (v) => applyPointOp("multiply", v, sat)), [
    [50, 75, 100],
    [25, 60, 125],
    [10, 40, 90],
  ]);
});

test("multiply rounds half to even and clips, like cv2.multiply", () => {
  // opencv-python 4.13.0.92: cv2.multiply([[101,103,105,1,3]], 0.5) -> [[50,52,52,0,2]]
  assert.deepEqual([101, 103, 105, 1, 3].map((v) => applyPointOp("multiply", v, sat)), [50, 52, 52, 0, 2]);
  assert.equal(applyPointOp("multiply", 200, { ...sat, factor: 2 }), 255);
  assert.equal(roundHalfEven(2.5), 2);
  assert.equal(roundHalfEven(3.5), 4);
  assert.equal(explainPointOp("multiply", 150, sat), "150 × 0.5 = 75");
  assert.equal(explainPointOp("multiply", 101, sat), "101 × 0.5 = 50.5 → 50");
});
