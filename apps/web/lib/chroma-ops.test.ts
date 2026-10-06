import { test } from "node:test";
import assert from "node:assert/strict";
import { observe, chroma, saturated } from "./chroma-ops.ts";

test("intensity changes RGB but not chromaticity (until saturation)", () => {
  const red: [number, number, number] = [0.6, 0.15, 0.1];
  const a = observe(red, 1), b = observe(red, 0.4);
  assert.deepEqual(a, [153, 38, 26]);
  assert.deepEqual(b, [61, 15, 10]);
  const ca = chroma(a)!, cb = chroma(b)!;
  ca.forEach((v, i) => assert.ok(Math.abs(v - cb[i]) < 0.01));
  const c = observe(red, 2);                 // 306 -> clipped
  assert.ok(saturated(c));
  assert.ok(Math.abs(chroma(c)![0] - ca[0]) > 0.02);
});

test("a tinted light changes chromaticity", () => {
  const grey: [number, number, number] = [0.5, 0.5, 0.5];
  assert.deepEqual(chroma(observe(grey, 1))!.map((v) => Math.round(v * 1000) / 1000), [0.333, 0.333, 0.333]);
  const warm = chroma(observe(grey, 1, [1.2, 1, 0.7]))!;
  assert.ok(warm[0] > 0.4 && warm[2] < 0.25);
  assert.equal(chroma([0, 0, 0]), null);
});
