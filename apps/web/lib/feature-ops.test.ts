import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { harris, minEig, goodFeatures, fast, fastScore, segmentTest, ssdSurface, eig2, applyH, FEAT_H, repeatability } from "./feature-ops.ts";

const R = JSON.parse(readFileSync(new URL("./feature-ref.json", import.meta.url), "utf8"));
const rel = (a: ArrayLike<number>, b: number[]) => { const s = Math.max(...b.map(Math.abs)); let m = 0; for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m / s; };

test("Harris and min-eigenvalue maps equal cv2.cornerHarris / cv2.cornerMinEigenVal", () => {
  assert.ok(rel(harris(R.img, R.w, R.h, 2, 0.04), R.harris2) < 1e-5);
  assert.ok(rel(harris(R.img, R.w, R.h, 3, 0.04), R.harris3) < 1e-5);
  assert.ok(rel(minEig(R.img, R.w, R.h, 3), R.mineig3) < 1e-5);
});

test("goodFeatures equals cv2.goodFeaturesToTrack (min-eigenvalue and Harris)", () => {
  assert.deepEqual(goodFeatures(R.img, R.w, R.h, { quality: 0.01, minDistance: 5 }).map((p) => [p.x, p.y]), R.gftt);
  assert.deepEqual(goodFeatures(R.img, R.w, R.h, { maxCorners: 10, quality: 0.02, minDistance: 8, useHarris: true }).map((p) => [p.x, p.y]), R.gfttH);
});

test("FAST-9 keypoints and scores equal cv2.FastFeatureDetector", () => {
  const all = fast(R.img, R.w, R.h, 20, false).map((p) => [p.x, p.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assert.deepEqual(all, R.fastAll);
  const key = (a: number[]) => `${a[0]},${a[1]},${a[2]}`;
  assert.deepEqual(fast(R.img, R.w, R.h, 20, true).map((p) => key([p.x, p.y, p.score!])).sort(), R.fastNms.map(key).sort());
  const [x, y] = R.fastNms[0]; const s = fastScore(R.img, R.w, x, y);
  assert.ok(segmentTest(R.img, R.w, x, y, s) !== 0 && segmentTest(R.img, R.w, x, y, s + 1) === 0);
});

test("SSD surface, eigenvalues, homography and repeatability helpers", () => {
  const E = ssdSurface(R.img, R.w, 30, 30, 2, 1); assert.equal(E[4], 0);
  assert.deepEqual(eig2(2, 0, 5), [2, 5]);
  const [x, y] = applyH(FEAT_H, 0, 0); assert.ok(Math.abs(x - 40) < 1e-12 && Math.abs(y + 25) < 1e-12);
  const pa = [{ x: 0, y: 0 }], pb = [{ x: 41, y: -25 }];
  assert.deepEqual(repeatability(pa, pb, FEAT_H, 1.5, () => true), { n: 1, hit: 1, rate: 1 });
});
