import { test } from "node:test";
import assert from "node:assert/strict";
import { sample, affine, transformBox } from "./aug-ops.ts";

const ALL = { flip: true, rotate: true, scale: true, bright: true, noise: true, cutout: true };

test("sampling is reproducible for a seed and respects switches", () => {
  assert.deepEqual(sample(5, ALL, 1, 320, 200), sample(5, ALL, 1, 320, 200));
  const none = sample(5, { flip: false, rotate: false, scale: false, bright: false, noise: false, cutout: false }, 1, 320, 200);
  assert.equal(none.angle, 0); assert.equal(none.scale, 1); assert.equal(none.flip, false); assert.equal(none.cut, null);
});

test("affine matches cv2.getRotationMatrix2D((160,100), 30, 1) and flips map x to w - x", () => {
  const m = affine({ flip: false, angle: 30, scale: 1, gain: 1, offset: 0, noise: 0, cut: null }, 320, 200);
  // cv2: [[0.866, 0.5, -28.564], [-0.5, 0.866, 93.397]]
  [0.8660254, 0.5, -28.5640646, -0.5, 0.8660254, 93.3974596].forEach((v, i) => assert.ok(Math.abs(m[i] - v) < 1e-6));
  const f = affine({ flip: true, angle: 0, scale: 1, gain: 1, offset: 0, noise: 0, cut: null }, 320, 200);
  const b = transformBox({ x: 10, y: 20, w: 30, h: 40 }, f);
  assert.deepEqual([b.x, b.y, b.w, b.h], [280, 20, 30, 40]);
});
