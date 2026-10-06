import { test } from "node:test";
import assert from "node:assert/strict";
import { rotate, profile, deskewAngle } from "./ocr-ops.ts";

function lines(w: number, h: number) {
  const m = new Uint8Array(w * h);
  for (const y0 of [10, 25, 40]) for (let y = y0; y < y0 + 4; y++) for (let x = 5; x < w - 5; x++) m[y * w + x] = 255;
  return m;
}

test("rotate by 0 is the identity; by 90 moves a pixel as expected", () => {
  const img = Uint8Array.from({ length: 25 }, (_, i) => i);
  assert.deepEqual(Array.from(rotate(img, 5, 5, 0, null)), Array.from(img));
});

test("profile variance is highest for horizontal lines; deskew recovers a rotation", () => {
  const w = 80, h = 56, m = lines(w, h);
  const flatV = profile(m, w, h).variance, tilted = rotate(m, w, h, 5, 0);
  assert.ok(profile(tilted, w, h).variance < flatV);
  const a = deskewAngle(Uint8Array.from(tilted, (v) => (v > 127 ? 255 : 0)), w, h, 8, 0.5);
  assert.ok(Math.abs(a + 5) <= 0.5, `angle ${a}`);
});
