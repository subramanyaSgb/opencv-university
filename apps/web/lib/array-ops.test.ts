import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMSIZE, nbytes, offset, strides } from "./array-ops.ts";

test("strides of a 200 x 320 x 3 uint8 image match NumPy: (960, 3, 1)", () => {
  assert.deepEqual(strides([200, 320, 3], ITEMSIZE.uint8), [960, 3, 1]);
  assert.equal(nbytes([200, 320, 3], 1), 192000);
});

test("float32 gray image and offsets", () => {
  const s = strides([480, 640], ITEMSIZE.float32);
  assert.deepEqual(s, [2560, 4]);
  assert.equal(offset([2, 5], s), 2 * 2560 + 5 * 4);
});

test("offset of pixel (row 1, col 2, channel 0) in a 2 x 3 x 3 array", () => {
  assert.equal(offset([1, 2, 0], strides([2, 3, 3], 1)), 15);
});
