import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { polygonArea, perimeter, approxClosed, type P } from "./contour-ops.ts";

const R = JSON.parse(readFileSync(new URL("./contour-ref.json", import.meta.url), "utf8"));
const D = JSON.parse(readFileSync(new URL("./contour-data.json", import.meta.url), "utf8"));

test("area and perimeter equal cv2.contourArea / cv2.arcLength", () => {
  assert.ok(Math.abs(polygonArea(R.pts) - R.area) < 1e-6);
  assert.ok(Math.abs(perimeter(R.pts) - R.perim) < 1e-3); // OpenCV sums in float32
});

test("Douglas–Peucker vertex counts are close to cv2.approxPolyDP", () => {
  for (const e of [1, 3, 8]) { const n = approxClosed(R.pts as P[], e).length; assert.ok(Math.abs(n - R[`n${e}`]) <= 2, `eps ${e}: ${n} vs ${R[`n${e}`]}`); }
});

test("precomputed data: 6 external contours, 10 in the tree, washer hole is a child", () => {
  assert.equal(D.modes.external.length, 6); assert.equal(D.modes.tree.length, 10);
  assert.ok(D.modes.tree.some((c: { hier: number[] }) => c.hier[3] >= 0));
});
