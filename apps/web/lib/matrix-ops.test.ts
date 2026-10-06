import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, clip, colSums, matmul, rot90cw, rowSums, transpose } from "./matrix-ops.ts";

const A = [[1, 2], [3, 4]];
const B = [[10, 0], [0, 1]];

test("element-wise vs matrix product (matches the chapter's NumPy output)", () => {
  assert.deepEqual(apply("mul", A, B, 1, "none").raw, [[10, 0], [0, 4]]);
  assert.deepEqual(matmul(A, B), [[10, 2], [30, 4]]);
  assert.deepEqual(transpose(A), [[1, 3], [2, 4]]);
});

test("rotation = transpose + flip", () => {
  assert.deepEqual(rot90cw([[1, 2, 3], [4, 5, 6]]), [[4, 1], [5, 2], [6, 3]]);
});

test("overflow rules", () => {
  assert.equal(clip(300, "saturate"), 255);
  assert.equal(clip(-20, "saturate"), 0);
  assert.equal(clip(300, "wrap"), 44);
  assert.equal(clip(-20, "wrap"), 236);
  assert.equal(clip(300, "none"), 300);
});

test("sums and masks", () => {
  assert.deepEqual(rowSums(A), [3, 7]);
  assert.deepEqual(colSums(A), [4, 6]);
  assert.deepEqual(apply("mask", [[50, 60], [70, 80]], [[1, 0], [0, 255]], 0, "saturate").out, [[50, 0], [0, 80]]);
  assert.deepEqual(apply("blend", [[0, 200]], [[100, 100]], 0.25, "saturate").out, [[25, 175]]);
});

test("matmul needs matching inner sizes", () => {
  assert.throws(() => matmul([[1, 2]], [[1, 2]]));
});
