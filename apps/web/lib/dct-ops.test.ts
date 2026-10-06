import { test } from "node:test";
import assert from "node:assert/strict";
import { dct8, idct8, jpegBlock, qtable, roundHalfEven, ZIGZAG, zigzagRun } from "./dct-ops.ts";

const smooth = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => 100 + 6 * c + 3 * r));
const edge = Array.from({ length: 8 }, () => Array.from({ length: 8 }, (_, c) => (c < 4 ? 60 : 180)));

test("DCT of the smooth block matches cv2.dct (rounded)", () => {
  const F = dct8(smooth.map((r) => r.map((v) => v - 128)));
  assert.equal(Math.round(F[0][0]), 28);
  assert.equal(Math.round(F[0][1]), -109);
  assert.equal(Math.round(F[1][0]), -55);
  assert.equal(Math.round(F[1][1]), 0);
});

test("IDCT inverts the DCT", () => {
  const back = idct8(dct8(edge));
  back.forEach((row, r) => row.forEach((v, c) => assert.ok(Math.abs(v - edge[r][c]) < 1e-9)));
});

test("quality scaling matches the tables OpenCV/libjpeg writes", () => {
  assert.deepEqual(qtable(50)[0].slice(0, 4), [16, 11, 10, 16]);
  assert.deepEqual(qtable(75)[0].slice(0, 4), [8, 6, 5, 8]);
  assert.deepEqual(qtable(10)[0].slice(0, 4), [80, 55, 50, 80]);
  assert.ok(qtable(100).flat().every((v) => v === 1));
});

test("q50 round trip of the smooth block matches OpenCV's decode", () => {
  const { q, rec, nonzero, maxErr } = jpegBlock(smooth, 50);
  assert.deepEqual(q[0].slice(0, 4), [2, -10, 0, -1]);
  assert.equal(q[1][0], -5);
  assert.equal(nonzero, 4);
  assert.deepEqual(rec[0], [100, 106, 114, 119, 124, 130, 137, 143]);
  assert.equal(maxErr, 3);
});

test("edge block at q10 rings like libjpeg", () => {
  const { rec, maxErr } = jpegBlock(edge, 10);
  assert.deepEqual(rec[0], [46, 82, 40, 58, 178, 196, 154, 190]);
  assert.equal(maxErr, 26);
});

test("zigzag order and run", () => {
  assert.deepEqual(ZIGZAG.slice(0, 6), [[0, 0], [0, 1], [1, 0], [2, 0], [1, 1], [0, 2]]);
  const { q } = jpegBlock(edge, 50);
  assert.deepEqual(zigzagRun(q), [-4, -40, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
});

test("round half to even", () => {
  assert.equal(roundHalfEven(2.5), 2);
  assert.equal(roundHalfEven(3.5), 4);
  assert.equal(roundHalfEven(-2.5), -2);
  assert.equal(roundHalfEven(-0.4), -0);
});
