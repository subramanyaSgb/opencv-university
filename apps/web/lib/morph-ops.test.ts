import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { structuringElement, morph, dilate, distanceTransform, thinZhangSuen, type Shape } from "./morph-ops.ts";

const R = JSON.parse(readFileSync(new URL("./morph-ref.json", import.meta.url), "utf8"));

test("structuring elements equal cv2.getStructuringElement", () => {
  for (const nm of ["rect", "cross", "ellipse"] as Shape[]) for (const [w, h] of [[3, 3], [5, 5], [7, 5], [4, 4]])
    assert.deepEqual(Array.from(structuringElement(nm, w, h).k), R[`se_${nm}_${w}x${h}`], `${nm} ${w}x${h}`);
});

test("morphologyEx operations equal OpenCV on a grey image", () => {
  const se = structuringElement("ellipse", 5, 5);
  for (const op of ["erode", "dilate", "open", "close", "gradient", "tophat", "blackhat"] as const)
    assert.deepEqual(Array.from(morph(R.g, 15, 12, op, se)), R[`g_${op}`], op);
  assert.deepEqual(Array.from(dilate(R.g, 15, 12, structuringElement("rect", 4, 4))), R.g_dilate_4x4, "even-sized element");
});

test("distance transforms equal cv2.distanceTransform (L1, C exact; L2 precise)", () => {
  for (const m of ["l1", "c", "l2"] as const) {
    const d = distanceTransform(R.crop, 160, 60, m);
    R[`dt_${m}`].forEach((v: number, i: number) => assert.ok(Math.abs(d[i] - v) < 1e-3, `${m} ${i}: ${d[i]} vs ${v}`));
  }
});

test("Zhang–Suen thinning equals cv2.ximgproc.thinning", () => {
  const t = thinZhangSuen(R.crop, 160, 60); let diff = 0;
  t.forEach((v, i) => { if (v !== R.thin[i]) diff++; });
  assert.ok(diff <= 4, `${diff} pixels differ`);
});
