import { test } from "node:test";
import assert from "node:assert/strict";
import { scene, inRangeHsv, tally } from "./inrange-ops.ts";

test("orange range finds the orange cap (minus its highlight) and nothing else", () => {
  const { bgr, id } = scene();
  const { hit, tot } = tally(inRangeHsv(bgr, 10, 22, 120, 50), id);
  assert.ok((hit.get(1) ?? 0) / tot.get(1)! > 0.9);
  for (const o of [0, 2, 3, 4]) assert.ok((hit.get(o) ?? 0) < 5, `object ${o}`);
});

test("red needs a wrapping range to include crimson", () => {
  const { bgr, id } = scene();
  const low = tally(inRangeHsv(bgr, 0, 8, 120, 50), id);
  const wrap = tally(inRangeHsv(bgr, 170, 8, 120, 50), id);
  assert.ok((low.hit.get(3) ?? 0) < 0.1 * low.tot.get(3)!);
  assert.ok((wrap.hit.get(3) ?? 0) > 0.9 * wrap.tot.get(3)!);
  assert.ok((wrap.hit.get(2) ?? 0) > 0.9 * wrap.tot.get(2)!);
});
