import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { houghLines, lineEnds, houghCircles, ransacLine, ransacIterations, circleKasa, circleGeometric, ellipseDirect, arcPoints, cvRound } from "./hough-ops.ts";
import { gradients } from "./edge-ops.ts";

const R = JSON.parse(readFileSync(new URL("./hough-ref.json", import.meta.url), "utf8"));
const edge = new Uint8Array(R.w * R.h); for (const i of R.edge) edge[i] = 255;

test("cvRound rounds half to even", () => { assert.deepEqual([0.5, 1.5, 2.5, -0.5, -1.5, 2.4].map(cvRound), [0, 2, 2, -0, -2, 2]); });

test("houghLines equals cv2.HoughLines (same lines, same order)", () => {
  for (const c of R.lines) {
    const got = houghLines(edge, R.w, R.h, c.rho, c.theta, c.thr).lines;
    assert.equal(got.length, c.lines.length, `rho ${c.rho} theta ${c.theta} thr ${c.thr}`);
    got.forEach((l, k) => { assert.ok(Math.abs(l.rho - c.lines[k][0]) < 1e-4); assert.ok(Math.abs(l.theta - c.lines[k][1]) < 1e-5); });
  }
});

test("lineEnds clips a line to the image", () => {
  assert.deepEqual(lineEnds(50, 0, 320, 200), [50, 0, 50, 200]);
  assert.deepEqual(lineEnds(30, Math.PI / 2, 320, 200)?.map((v) => Math.round(v * 1e6) / 1e6), [0, 30, 320, 30]);
});

test("houghCircles finds a synthetic circle", () => {
  const w = 80, h = 60, img = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) img[y * w + x] = Math.hypot(x - 40, y - 30) <= 15 ? 200 : 40;
  const { gx, gy } = gradients(img, w, h), e = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) e[i] = Math.hypot(gx[i], gy[i]) > 200 ? 1 : 0;
  const { centres } = houghCircles(e, gx, gy, w, h, 8, 25, 20, 10);
  assert.ok(Math.hypot(centres[0].x - 40, centres[0].y - 30) <= 1);
  assert.ok(Math.abs(centres[0].r - 15) <= 1.5);
});

test("RANSAC finds the line among outliers; iteration formula", () => {
  const p = arcPoints({ cx: 0, cy: 0, a: 1, b: 1, angle: 0 }, 0, 0, 0, 0, 0, [1, 1]); assert.equal(p.length, 0);
  const pts: [number, number][] = [];
  for (let k = 0; k < 50; k++) pts.push([k * 4, 20 + k * 2]);
  for (let k = 0; k < 50; k++) pts.push([(k * 37) % 200, (k * 53) % 150]);
  const r = ransacLine(pts, 200, 1.5, 5);
  assert.ok(r.inliers.filter(Boolean).length >= 50);
  assert.ok(Math.abs(r.refit.dy / r.refit.dx - 0.5) < 0.01);
  assert.equal(ransacIterations(0.99, 0.5, 2), 17);
});

test("circle fits: Kåsa and geometric recover an exact circle", () => {
  const p = arcPoints({ cx: 50, cy: 40, a: 20, b: 20, angle: 0 }, 0, 360, 30, 0, 0, [1, 1]);
  for (const c of [circleKasa(p), circleGeometric(p)]) { assert.ok(Math.abs(c.cx - 50) < 1e-6 && Math.abs(c.cy - 40) < 1e-6 && Math.abs(c.r - 20) < 1e-6); }
});

test("ellipseDirect equals cv2.fitEllipseDirect", () => {
  const e = ellipseDirect(R.ell.pts)!;
  assert.ok(Math.abs(e.cx - R.ell.cx) < 1e-3 && Math.abs(e.cy - R.ell.cy) < 1e-3, `${e.cx} ${e.cy}`);
  assert.ok(Math.abs(2 * e.a - Math.max(R.ell.W, R.ell.H)) < 1e-3 && Math.abs(2 * e.b - Math.min(R.ell.W, R.ell.H)) < 1e-3, `${e.a} ${e.b}`);
  const ref = R.ell.W >= R.ell.H ? R.ell.ang % 180 : (R.ell.ang + 90) % 180;
  const d = Math.abs(e.angle - ref) % 180; assert.ok(Math.min(d, 180 - d) < 1e-2, `${e.angle} vs ${ref}`);
});
