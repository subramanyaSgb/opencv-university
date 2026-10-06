import { test } from "node:test";
import assert from "node:assert/strict";
import { memory, STAGES } from "./graph-ops.ts";

test("eager keeps one full image per intermediate result", () => {
  const all = STAGES;
  const m = memory(all, 1000, 800);
  // image stages: diff, blur, thr, erode, dilate -> all 5 feed another stage (count is the final output)
  assert.equal(m.intermediates, 5);
  assert.equal(m.eager, 5 * 1000 * 800);
  // fluid windows: blur 5 + thr 1 + erode 3 + dilate 3 + count 1 = 13 lines
  assert.equal(m.fluid, 13 * 1000);
});

test("without a reduction the last image is the output, not an intermediate", () => {
  const m = memory(STAGES.slice(0, 3), 100, 100);
  assert.equal(m.intermediates, 2);
  assert.equal(m.fluid, (5 + 1) * 100);
});
