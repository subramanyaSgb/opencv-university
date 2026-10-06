import { test } from "node:test";
import assert from "node:assert/strict";
import { closing, polyFit, correct } from "./illum-ops.ts";

test("closing removes a dark dot smaller than the kernel and keeps a flat background", () => {
  const img = new Array(49).fill(200); img[24] = 20;
  const c = closing(img, 7, 7, 3);
  assert.ok(c.every((v) => v === 200));
});

test("polyFit recovers an exact quadratic surface", () => {
  const w = 20, h = 10, img = new Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = x / (w - 1), b = y / (h - 1); img[y * w + x] = 50 + 30 * a - 20 * b + 10 * a * a + 5 * a * b + 8 * b * b; }
  const fit = polyFit(img, w, h, () => true);
  fit.forEach((v, i) => assert.ok(Math.abs(v - img[i]) < 1e-6));
});

test("division removes multiplicative shading, subtraction removes additive", () => {
  const bg = [100, 200], obj = [50, 100]; // same reflectance 0.5 under two light levels
  assert.deepEqual(Array.from(correct(obj, bg, "divide")), [75, 75]);
  assert.deepEqual(Array.from(correct([110, 210], bg, "subtract")), [160, 160]);
});
