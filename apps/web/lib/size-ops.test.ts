import { test } from "node:test";
import assert from "node:assert/strict";
import { frameBytes, linkBytesPerSec } from "./size-ops.ts";

test("Code example 1: 2448 × 2048 12-bit mono is 10 027 008 bytes; 1920 × 1080 BGR is 6 220 800", () => {
  assert.equal(frameBytes(2448, 2048, 1, 12), 10027008);
  assert.equal(frameBytes(1920, 1080, 3, 8), 6220800);
});

test("Code example 3: GigE ≈ 112.5 MB/s → 22.4 fps of 5 MP mono", () => {
  const fps = linkBytesPerSec(1e9) / frameBytes(2448, 2048, 1, 8);
  assert.ok(Math.abs(fps - 22.4) < 0.05);
});
