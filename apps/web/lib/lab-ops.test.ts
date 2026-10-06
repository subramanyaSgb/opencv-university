import { test } from "node:test";
import assert from "node:assert/strict";
import { de2000, de76, labToRgb } from "./lab-ops.ts";
import { toLab } from "./cvd-ops.ts";

// test pairs from Sharma, Wu & Dalal (2005), "The CIEDE2000 color-difference formula: implementation notes"
test("CIEDE2000 reference pairs", () => {
  assert.ok(Math.abs(de2000([50, 2.6772, -79.7751], [50, 0, -82.7485]) - 2.0425) < 1e-4);
  assert.ok(Math.abs(de2000([50, 0, 0], [50, -1, 2]) - 2.3669) < 1e-4);
  assert.ok(Math.abs(de2000([50, 2.5, 0], [73, 25, -18]) - 27.1492) < 1e-4);
});

test("ΔE76 and round trip", () => {
  assert.equal(de76([50, 0, 0], [53, 4, 0]), 5);
  const rgb: [number, number, number] = [200, 120, 40];
  assert.deepEqual(labToRgb(toLab(rgb) as [number, number, number]), rgb);
});
