import { test } from "node:test";
import assert from "node:assert/strict";
import { alongRes, crossRes, dataRate, lineRateForSquare } from "./linescan-ops.ts";

const close = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("Code example 1: 1500 mm over 4096 px at 5 m/s needs 13.65 kHz, 56 MB/s", () => {
  const c = crossRes(1500, 4096);
  close(c, 0.366, 0.001);
  close(lineRateForSquare(5, c) / 1000, 13.65, 0.01);
  close(dataRate(4096, lineRateForSquare(5, c)) / 1e6, 55.9, 0.1);
});

test("1 m/s at 1 kHz moves 1 mm per line", () => {
  assert.equal(alongRes(1, 1000), 1);
});
