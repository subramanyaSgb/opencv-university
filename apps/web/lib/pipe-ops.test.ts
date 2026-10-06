import { test } from "node:test";
import assert from "node:assert/strict";
import { gaussian, applyStep, runPipeline } from "./pipe-ops.ts";

test("gaussian keeps a constant image and spreads an impulse symmetrically", () => {
  const c = gaussian(new Array(25).fill(100), 5, 5, 1);
  assert.ok(c.every((v) => Math.abs(v - 100) < 1e-9));
  const imp = new Array(49).fill(0); imp[24] = 255;
  const g = gaussian(imp, 7, 7, 1);
  assert.ok(Math.abs(g[23] - g[25]) < 1e-9 && g[24] > g[23]);
});

test("otsu step makes a two-level image binary; order of steps matters", () => {
  const img = Uint8Array.from([10, 10, 200, 200, 10, 200]);
  assert.deepEqual(Array.from(applyStep(img, 6, 1, "otsu")), [0, 0, 255, 255, 0, 255]);
  const a = runPipeline(Uint8Array.from([10, 12, 200, 205, 11, 198, 9, 202, 10]), 3, 3, ["blur", "otsu"]);
  const b = runPipeline(Uint8Array.from([10, 12, 200, 205, 11, 198, 9, 202, 10]), 3, 3, ["otsu", "blur"]);
  assert.notDeepEqual(Array.from(a[2]), Array.from(b[2]));
});
