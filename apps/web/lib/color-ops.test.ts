import { test } from "node:test";
import assert from "node:assert/strict";
import { averageOf, grayOf, isGray, reverse, simpleName, type RGB } from "./color-ops.ts";

test("grayOf matches cv2.cvtColor BGR2GRAY for the chapter's examples (OpenCV 4.13.0)", () => {
  assert.equal(grayOf([200, 100, 50]), 124); // section 27
  assert.equal(grayOf([200, 0, 0]), 60); // red disc in sample-redgreen
  assert.equal(grayOf([0, 102, 0]), 60); // green background in sample-redgreen
  assert.equal(grayOf([220, 0, 0]), 66); // sample-color: red disc
  assert.equal(grayOf([0, 180, 0]), 106); // green block
  assert.equal(grayOf([20, 70, 220]), 72); // blue triangle
  assert.equal(grayOf([255, 150, 40]), 169); // orange bar
});

test("grayscale is not the plain average", () => {
  assert.equal(averageOf([0, 180, 0]), 60);
  assert.notEqual(averageOf([0, 180, 0]), grayOf([0, 180, 0]));
});

test("BGR and RGB are the same numbers in reverse order", () => {
  const redRGB: RGB = [255, 0, 0];
  assert.deepEqual(reverse(redRGB), [0, 0, 255]);
  assert.deepEqual(reverse(reverse(redRGB)), redRGB);
});

test("R = G = B is gray; simple names", () => {
  assert.ok(isGray([128, 128, 128]));
  assert.ok(!isGray([128, 128, 129]));
  assert.equal(simpleName([255, 0, 0]), "red");
  assert.equal(simpleName([255, 255, 0]), "yellow");
  assert.equal(simpleName([0, 255, 255]), "cyan");
  assert.equal(simpleName([255, 255, 255]), "white");
  assert.equal(simpleName([0, 0, 0]), "black");
  assert.equal(simpleName([120, 50, 30]), null);
});
