import { test } from "node:test";
import assert from "node:assert/strict";
import { affine, applyH, homography, type P } from "./homography-ops.ts";

const corners: P[] = [[70, 40], [270, 62], [255, 170], [52, 140]];
const rect: P[] = [[0, 0], [240, 0], [240, 120], [0, 120]];

test("homography matches cv2.getPerspectiveTransform", () => {
  const H = homography(corners, rect);
  const cv = [[1.30815177, 0.235467318, -100.989316], [-0.13674451, 1.24313191, -40.1531607], [3.51091238e-4, 2.72844224e-4, 1]];
  H.forEach((r, i) => r.forEach((v, j) => assert.ok(Math.abs(v - cv[i][j]) < 1e-6 * Math.max(1, Math.abs(cv[i][j])), `${i},${j}: ${v}`)));
  const { p, w } = applyH(H, [160, 100]);
  assert.ok(Math.abs(w - 1.08345902) < 1e-6);
  assert.ok(Math.abs(p[0] - 131.86169805 / 1.08345902) < 1e-6);
  corners.forEach((c, i) => applyH(H, c).p.forEach((v, k) => assert.ok(Math.abs(v - rect[i][k]) < 1e-9)));
});

test("affine from 3 pairs matches cv2.getAffineTransform", () => {
  const A = affine([[0, 0], [100, 0], [0, 50]], [[20, 30], [106.6, 80], [-5, 73.3]]);
  const r = (v: number) => Math.round(v * 1000) / 1000;
  assert.deepEqual(A.map((row) => row.map(r)), [[0.866, -0.5, 20], [0.5, 0.866, 30], [0, 0, 1]]);
  const { p } = applyH(A, [100, 50]);
  assert.deepEqual(p.map((v) => Math.round(v * 10) / 10), [81.6, 123.3]);
});

test("degenerate points throw", () => {
  assert.throws(() => homography([[0, 0], [1, 1], [2, 2], [3, 3]], rect));
});
