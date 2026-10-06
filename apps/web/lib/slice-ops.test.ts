import { test } from "node:test";
import assert from "node:assert/strict";
import { indices, text } from "./slice-ops.ts";

// expected values from Python: list(range(10))[slice]
test("basic and stepped slices", () => {
  assert.deepEqual(indices(10, { start: 2, stop: 5, step: 1 }), [2, 3, 4]);
  assert.deepEqual(indices(10, { start: null, stop: null, step: 2 }), [0, 2, 4, 6, 8]);
  assert.deepEqual(indices(10, { start: 1, stop: null, step: 3 }), [1, 4, 7]);
});

test("negative indices and reversed slices", () => {
  assert.deepEqual(indices(10, { start: -3, stop: null, step: 1 }), [7, 8, 9]);
  assert.deepEqual(indices(10, { start: null, stop: null, step: -1 }), [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
  assert.deepEqual(indices(10, { start: 8, stop: 2, step: -2 }), [8, 6, 4]);
  assert.deepEqual(indices(10, { start: null, stop: -8, step: -3 }), [9, 6, 3]);
});

test("out-of-range bounds are clipped, empty slices are empty", () => {
  assert.deepEqual(indices(5, { start: 3, stop: 100, step: 1 }), [3, 4]);
  assert.deepEqual(indices(5, { start: 4, stop: 2, step: 1 }), []);
  assert.throws(() => indices(5, { start: 0, stop: 5, step: 0 }));
  assert.equal(text({ start: 2, stop: null, step: 2 }), "2::2");
  assert.equal(text({ start: null, stop: 4, step: 1 }), ":4");
});
