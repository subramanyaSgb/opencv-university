import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pad, filter2D, borderIndex, toU8 } from "./conv-ops.ts";

const R = JSON.parse(readFileSync(new URL("./conv-ref.json", import.meta.url), "utf8"));

test("borderIndex follows OpenCV (gfedcb|abcdefgh|gfedcba for reflect101)", () => {
  assert.deepEqual([-3, -2, -1].map((p) => borderIndex(p, 8, "reflect101")), [3, 2, 1]);
  assert.deepEqual([-3, -2, -1].map((p) => borderIndex(p, 8, "reflect")), [2, 1, 0]);
  assert.deepEqual([8, 9].map((p) => borderIndex(p, 8, "wrap")), [0, 1]);
});

test("pad equals cv2.copyMakeBorder for all modes (recorded)", () => {
  for (const b of ["constant", "replicate", "reflect", "reflect101", "wrap"] as const) assert.deepEqual(Array.from(pad(R.img, 7, 6, 2, b).d), R["pad_" + b], b);
});

test("filter2D equals cv2.filter2D on float32 (recorded) for four border modes", () => {
  for (const b of ["constant", "replicate", "reflect", "reflect101"] as const) {
    const o = filter2D(R.img, 7, 6, R.k, b);
    o.forEach((v, i) => assert.ok(Math.abs(v - R[b][i]) < 1e-3, `${b} ${i}`));
  }
  assert.deepEqual(Array.from(toU8([2.5, 3.5, -4, 300])), [2, 4, 0, 255]);
});
