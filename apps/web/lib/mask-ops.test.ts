import { test } from "node:test";
import assert from "node:assert/strict";
import { shapeMask, logic, maskedMean, count } from "./mask-ops.ts";

test("circle and rect masks have the expected pixel counts (cv2.circle r=2 → 13 px; rect 3×2 → 6 px)", () => {
  assert.equal(count(shapeMask(7, 7, { kind: "circle", cx: 3, cy: 3, r: 2 })), 13);
  assert.equal(count(shapeMask(7, 7, { kind: "rect", x: 1, y: 1, w: 3, h: 2 })), 6);
});

test("bitwise logic on 0/255 masks", () => {
  const a = Uint8Array.from([0, 0, 255, 255]), b = Uint8Array.from([0, 255, 0, 255]);
  assert.deepEqual(Array.from(logic(a, b, "and")), [0, 0, 0, 255]);
  assert.deepEqual(Array.from(logic(a, b, "or")), [0, 255, 255, 255]);
  assert.deepEqual(Array.from(logic(a, b, "xor")), [0, 255, 255, 0]);
  assert.deepEqual(Array.from(logic(a, b, "notA")), [255, 255, 0, 0]);
  assert.deepEqual(Array.from(logic(a, b, "andNot")), [0, 0, 255, 0]);
});

test("masked mean uses only mask pixels", () => {
  const img = [10, 20, 30, 40], mask = [0, 255, 255, 0];
  const r = maskedMean(img, 1, mask);
  assert.equal(r.n, 2); assert.equal(r.mean[0], 25);
});
