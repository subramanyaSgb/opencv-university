import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { box, median, bilateral, addNoise, psnr } from "./denoise-ops.ts";

const R = JSON.parse(readFileSync(new URL("./denoise-ref.json", import.meta.url), "utf8"));
const W = 17, H = 14;

test("median equals cv2.medianBlur (3 and 5)", () => {
  assert.deepEqual(Array.from(median(R.img, W, H, 3)), R.med3);
  assert.deepEqual(Array.from(median(R.img, W, H, 5)), R.med5);
});

test("box equals cv2.blur within 1; bilateral close to cv2.bilateralFilter", () => {
  box(R.img, W, H, 5).forEach((v, i) => assert.ok(Math.abs(v - R.box5[i]) <= 1));
  const b = bilateral(R.img, W, H, 5, 40, 3); let bad = 0;
  b.forEach((v, i) => { if (Math.abs(v - R.bil[i]) > 2) bad++; });
  assert.ok(bad / b.length < 0.05, `${bad} pixels differ by more than 2`); // OpenCV uses float LUTs and its own window rounding
});

test("noise is reproducible; PSNR of identical images is infinite", () => {
  const img = new Array(100).fill(128);
  assert.deepEqual(addNoise(img, "gaussian", 10, 3), addNoise(img, "gaussian", 10, 3));
  assert.equal(psnr(img, img), Infinity);
  const sp = addNoise(img, "saltpepper", 0.2, 3), changed = Array.from(sp).filter((v) => v !== 128).length;
  assert.ok(changed > 5 && changed < 40);
});
