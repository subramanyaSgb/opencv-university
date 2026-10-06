import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gradients, canny, parabolaPeak } from "./edge-ops.ts";

const R = JSON.parse(readFileSync(new URL("./edge-ref.json", import.meta.url), "utf8"));

test("Sobel and Scharr equal cv2.Sobel / cv2.Scharr (BORDER_REFLECT_101)", () => {
  const s = gradients(R.small, 9, 7), c = gradients(R.small, 9, 7, "scharr");
  assert.deepEqual(Array.from(s.gx), R.sx); assert.deepEqual(Array.from(s.gy), R.sy); assert.deepEqual(Array.from(c.gx), R.chx);
});

test("Canny equals cv2.Canny on a scene crop (L1 and L2 magnitude)", () => {
  for (const [lo, hi, l2, ref] of [[50, 150, false, R.canny], [30, 90, true, R.canny2]] as const) {
    const e = canny(R.crop, 120, 80, lo, hi, l2).edge; let diff = 0;
    e.forEach((v, i) => { if (v !== ref[i]) diff++; });
    assert.ok(diff <= 2, `${diff} pixels differ`);
  }
});

test("parabola peak", () => { assert.equal(Math.abs(parabolaPeak(1, 2, 1)), 0); assert.ok(Math.abs(parabolaPeak(0, 4, 2) - 1 / 6) < 1e-12); });
