import { test } from "node:test";
import assert from "node:assert/strict";
import { distance, label } from "./conn-ops.ts";

const blobs = [
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1],
];

test("Code example 2: corner-touching blobs are 3 objects with 4-connectivity, 1 with 8", () => {
  assert.equal(label(blobs, 4).count, 3);
  assert.equal(label(blobs, 8).count, 1);
});

test("Code example 3: (1, 2) to (4, 6): city-block 7, chessboard 4, Euclidean 5", () => {
  assert.equal(distance([1, 2], [4, 6], "cityblock"), 7);
  assert.equal(distance([1, 2], [4, 6], "chessboard"), 4);
  assert.equal(distance([1, 2], [4, 6], "euclidean"), 5);
});
