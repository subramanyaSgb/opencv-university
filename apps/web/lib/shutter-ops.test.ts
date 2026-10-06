import { test } from "node:test";
import assert from "node:assert/strict";
import { bandingDepth, readoutTime, skewPx } from "./shutter-ops.ts";

const close = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("Code example 1: 1080 rows × 15 µs = 16.2 ms; 2 m/s at 0.5 mm/px gives 65 px of skew", () => {
  const t = readoutTime(1080, 15e-6);
  close(t, 0.0162, 1e-12);
  close(skewPx(2, t, 0.5), 64.8, 1e-9);
});

test("Code example 2: 100 Hz flicker, depth 0.3: 2.5 ms → 56.6 %, 10 ms → 0 %", () => {
  close(bandingDepth(2.5e-3, 100, 0.3, 1080, 15e-6) * 100, 56.6, 0.05);
  close(bandingDepth(10e-3, 100, 0.3, 1080, 15e-6), 0, 1e-9);
});
