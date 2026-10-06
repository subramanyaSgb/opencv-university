import { test } from "node:test";
import assert from "node:assert/strict";
import { compute, satU8, wrapU8 } from "./overflow-ops.ts";

test("match the chapter's NumPy / OpenCV table for a = 200, b = 100", () => {
  assert.deepEqual([compute("add", 200, 100).numpy, compute("add", 200, 100).opencv], [44, 255]);
  assert.deepEqual([compute("sub", 100, 200).numpy, compute("sub", 100, 200).opencv], [156, 0]);
  assert.deepEqual([compute("avg", 200, 100).numpy, compute("avg", 200, 100).opencv], [22, 150]);
  assert.deepEqual([compute("absdiff", 100, 200).numpy, compute("absdiff", 100, 200).opencv], [156, 100]);
});

test("wrap and saturate", () => {
  assert.equal(wrapU8(300), 44);
  assert.equal(wrapU8(-100), 156);
  assert.equal(satU8(127.5), 128);
  assert.equal(satU8(126.5), 126);
  assert.equal(satU8(-3), 0);
  assert.equal(satU8(999), 255);
});
