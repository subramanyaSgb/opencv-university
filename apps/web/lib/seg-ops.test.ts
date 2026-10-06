import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { floodFill, growMean, kmeans, meanShiftFilter, watershed, slic, iou, bgrToLab8 } from "./seg-ops.ts";

const R = JSON.parse(readFileSync(new URL("./seg-ref.json", import.meta.url), "utf8"));
const img = Uint8Array.from(R.img);
const sumIdx = (m: Uint8Array) => { let n = 0, s = 0; m.forEach((v, i) => { if (v) { n++; s += i; } }); return [n, s]; };

test("floodFill equals cv2.floodFill (fixed and floating range, 4 and 8 connectivity)", () => {
  for (const c of R.ff) assert.deepEqual(sumIdx(floodFill(img, R.w, R.h, c.x, c.y, c.t, c.t, c.fixed, c.conn)), [c.n, c.idx], JSON.stringify(c));
});

test("growMean equals the Python reference (BFS, running mean)", () => {
  for (const c of R.gm) assert.deepEqual(sumIdx(growMean(img, R.w, R.h, c.x, c.y, c.T)), [c.n, c.idx]);
});

test("meanShiftFilter equals cv2.pyrMeanShiftFiltering (maxLevel 0)", () => {
  const crop = Uint8Array.from(R.crop);
  for (const c of R.ms) { const o = meanShiftFilter(crop, R.cw, R.ch, c.sp, c.sr); let d = 0; o.forEach((v, i) => { if (v !== c.out[i]) d++; }); assert.equal(d, 0, `sp ${c.sp} sr ${c.sr}: ${d} values differ`); }
});

test("watershed equals cv2.watershed", () => {
  const mk = new Int32Array(R.w * R.h); for (const [i, v] of R.mk) mk[i] = v;
  const ref: number[] = []; for (const [v, n] of R.wsRle) for (let k = 0; k < n; k++) ref.push(v);
  const got = watershed(img, R.w, R.h, mk); let d = 0; got.forEach((v, i) => { if (v !== ref[i]) d++; });
  assert.equal(d, 0, `${d} pixels differ`);
});

test("kmeans separates two clusters and never increases the cost", () => {
  const X = new Float64Array([0, 0, 1, 0, 0, 1, 10, 10, 11, 10, 10, 11]);
  const r = kmeans(X, 6, 2, 2, 5, 3);
  assert.equal(new Set([r.labels[0], r.labels[1], r.labels[2]]).size, 1); assert.notEqual(r.labels[0], r.labels[3]);
  for (let i = 1; i < r.history.length; i++) assert.ok(r.history[i] <= r.history[i - 1] + 1e-9);
});

test("slic gives connected superpixels near the requested count; iou; Lab of white", () => {
  const { labels, n } = slic(bgrToLab8(img, R.w * R.h), R.w, R.h, 20, 10);
  assert.ok(n >= 70 && n <= 130, `n = ${n}`); assert.ok(labels.every((v) => v >= 0 && v < n));
  assert.equal(iou([1, 1, 0, 0], [1, 0, 1, 0]), 1 / 3);
  const L = bgrToLab8([255, 255, 255], 1); assert.ok(Math.abs(L[0] - 255) < 0.5 && Math.abs(L[1] - 128) < 0.5 && Math.abs(L[2] - 128) < 0.5);
});
