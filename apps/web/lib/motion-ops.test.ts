import { test } from "node:test";
import assert from "node:assert/strict";
import { blurPx, maxExposureUs, travelMm } from "./motion-ops.ts";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("2 m/s for 1 ms is 2 mm; at 0.5 mm/px that is 4 px of blur", () => {
  close(travelMm(2, 1000), 2);
  close(blurPx(2, 1000, 0.5), 4);
});

test("max exposure for 0.5 px blur at 0.5 mm/px: 500 µs at 0.5 m/s, 25 µs at 10 m/s", () => {
  close(maxExposureUs(0.5, 0.5, 0.5), 500);
  close(maxExposureUs(10, 0.5, 0.5), 25);
});
