import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { equalizeLut, clahe, hist, matchLut } from "./hist-ops.ts";

// reference: a 20 × 32 crop of sample-plate-poor, with cv2.equalizeHist and cv2.createCLAHE(2.0, (4, 4)) results (OpenCV 4.13.0)
const ref = JSON.parse(readFileSync(new URL("./hist-ref.json", import.meta.url), "utf8")) as { img: number[][]; eq: number[][]; clahe: number[][] };
const flat = ref.img.flat();

test("equalizeHist matches OpenCV exactly", () => {
  const lut = equalizeLut(flat);
  assert.deepEqual(flat.map((v) => lut[v]), ref.eq.flat());
});

test("CLAHE matches OpenCV within 1 level", () => {
  const out = clahe(flat, 32, 20, 2, 4, 4);
  const exp = ref.clahe.flat();
  let maxd = 0;
  out.forEach((v, i) => { maxd = Math.max(maxd, Math.abs(v - exp[i])); });
  assert.ok(maxd <= 1, `max difference ${maxd}`);
});

test("matching a histogram onto itself is the identity on used values", () => {
  const lut = matchLut(flat, flat);
  const used = hist(flat).map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  used.forEach((v) => assert.equal(lut[v], v));
});
