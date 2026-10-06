import { test } from "node:test";
import assert from "node:assert/strict";
import { agreement, bitPlane, embedLsb } from "./watermark-ops.ts";

test("bit planes of 200 = 11001000", () => {
  assert.deepEqual([...[7, 6, 5, 4, 3, 2, 1, 0].map((k) => bitPlane([200], k)[0])], [1, 1, 0, 0, 1, 0, 0, 0]);
});

test("LSB embedding changes values by at most 1 and is recovered exactly", () => {
  const v = [0, 1, 128, 255, 77];
  const mark = [1, 0, 1, 0, 1];
  const s = embedLsb(v, mark);
  assert.deepEqual([...s], [1, 0, 129, 254, 77]);
  s.forEach((x, i) => assert.ok(Math.abs(x - v[i]) <= 1));
  assert.equal(agreement(bitPlane(s, 0), mark), 1);
});

test("agreement", () => {
  assert.equal(agreement([1, 0, 1, 0], [1, 1, 1, 1]), 0.5);
  assert.equal(agreement([], []), 1);
});
