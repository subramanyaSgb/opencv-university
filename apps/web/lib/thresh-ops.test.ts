import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { histogram, otsu, triangle, kapur, segment, metrics, localStats } from "./thresh-ops.ts";

const CASES = JSON.parse(readFileSync(new URL("./thresh-ref.json", import.meta.url), "utf8")) as { img: number[]; w: number; h: number; otsu: number; triangle: number; kapur: number; mean: number[]; gauss: number[] }[];

test("Otsu and triangle thresholds equal cv2.threshold's (recorded)", () => {
  for (const c of CASES) {
    assert.equal(otsu(histogram(c.img)), c.otsu);
    assert.equal(triangle(histogram(c.img)), c.triangle);
    assert.equal(kapur(histogram(c.img)), c.kapur); // NumPy reference (no OpenCV function)
  }
});

test("adaptive mean equals cv2.adaptiveThreshold; Gaussian within 3 % of pixels", () => {
  for (const c of CASES) {
    const m = segment(c.img, c.w, c.h, "mean", { block: 7, C: 5 }).mask;
    assert.deepEqual(Array.from(m), c.mean);
    const g = segment(c.img, c.w, c.h, "gauss", { block: 7, C: 5 }).mask;
    const diff = g.reduce((a, v, i) => a + (v !== c.gauss[i] ? 1 : 0), 0);
    assert.ok(diff / g.length < 0.03, `gauss differs on ${diff} pixels`);
  }
});

test("local stats of a constant image; Kapur splits a two-level image between the levels", () => {
  const { mean, std } = localStats(new Array(25).fill(7), 5, 5, 1);
  assert.ok(mean.every((v) => Math.abs(v - 7) < 1e-9) && std.every((v) => v < 1e-6));
  const h = new Array(256).fill(0); h[50] = 100; h[200] = 100;
  const t = kapur(h); assert.ok(t >= 50 && t < 200);
});

test("hysteresis keeps weak pixels only when connected to strong ones", () => {
  // row: strong(10) weak(80) weak(80) bg(200) weak(80)
  const img = [10, 80, 80, 200, 80];
  const m = segment(img, 5, 1, "hysteresis", { ts: 30, tw: 100 }).mask;
  assert.deepEqual(Array.from(m), [1, 1, 1, 0, 0]);
});

test("metrics", () => {
  const r = metrics([1, 1, 0, 0], [1, 0, 1, 0]);
  assert.equal(r.tp, 1); assert.equal(r.fp, 1); assert.equal(r.fn, 1); assert.equal(r.f1, 0.5); assert.ok(Math.abs(r.iou - 1 / 3) < 1e-9);
});
