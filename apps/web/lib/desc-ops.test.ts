import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hexBytes, knn2, ratioTest, crossCheck, findH, ransacH, applyH, cornerError, ransacIters, POSTER_H, type Norm } from "./desc-ops.ts";

const D = JSON.parse(readFileSync(new URL("../public/data/desc-data.json", import.meta.url), "utf8"));
const R = JSON.parse(readFileSync(new URL("./desc-ref.json", import.meta.url), "utf8"));

test("knn2, ratio test and cross-check equal cv2.BFMatcher (SIFT L2, ORB and AKAZE Hamming)", () => {
  for (const [name, norm] of [["SIFT", "L2"], ["ORB", "HAMMING"], ["AKAZE", "HAMMING"]] as [string, Norm][]) {
    const A = D[name]["poster"].d.map(hexBytes), B = D[name]["poster-b"].d.map(hexBytes);
    const ab = knn2(A, B, norm), ba = knn2(B, A, norm);
    const sameBest = ab.filter((m, i) => m.t === R[name].best[i]).length;
    assert.ok(sameBest >= ab.length - 2, `${name}: ${sameBest}/${ab.length} best matches agree`);   // ties may resolve differently
    assert.equal(ratioTest(ab, 0.75).length, R[name].ratio);
    const cc = crossCheck(ab, ba).map((m) => [m.q, m.t]).sort((a, b) => a[0] - b[0]);
    assert.ok(Math.abs(cc.length - R[name].cross.length) <= 2, `${name}: cross ${cc.length} vs ${R[name].cross.length}`);
  }
});

test("findH agrees with cv2.findHomography(method 0) within 0.05 px; RANSAC recovers POSTER_H from noisy matches", () => {
  const H = findH(R.ls.src, R.ls.dst)!;
  assert.ok(cornerError(H, R.ls.H, 300, 300) < 0.05);   // OpenCV adds a Levenberg–Marquardt refinement: 0.013 px apart
  const src: [number, number][] = [], dst: [number, number][] = [];
  for (let i = 0; i < 60; i++) {
    const x = (i * 37) % 300 + 5, y = (i * 53) % 220 + 5; src.push([x, y]);
    dst.push(i % 4 === 0 ? [(i * 71) % 300, (i * 29) % 240] : applyH(POSTER_H, x, y));       // 25 % outliers
  }
  const r = ransacH(src, dst, 2, 200, 7);
  assert.equal(r.count, 45);
  assert.ok(cornerError(r.H!, POSTER_H, 320, 240) < 1e-6);
  assert.equal(ransacIters(0.99, 0.5), 72);
});
