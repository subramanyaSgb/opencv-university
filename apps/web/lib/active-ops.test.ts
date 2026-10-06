import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { snakeMatrix, edgeForce, snakeStep, resample, chanVeseStep, gradient } from "./active-ops.ts";

const R = JSON.parse(readFileSync(new URL("./active-ref.json", import.meta.url), "utf8"));

test("gradient matches np.gradient on a small array", () => {
  const { gx, gy } = gradient([1, 2, 4, 7, 11, 16], 3, 2);
  assert.deepEqual(Array.from(gx), [1, 1.5, 2, 4, 4.5, 5]); assert.deepEqual(Array.from(gy), [6, 9, 12, 6, 9, 12]);
});

test("snake matrix rows sum to 1 after inversion (constant contour stays put)", () => {
  const P = snakeMatrix(20, 0.1, 0.2, 1);
  for (const r of P) assert.ok(Math.abs(r.reduce((a, b) => a + b, 0) - 1) < 1e-9);
});

test("a shrinking snake locks onto a disc", () => {
  const w = 80, h = 80, img = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) img[y * w + x] = Math.hypot(x - 40, y - 40) <= 20 ? 200 : 50;
  const F = edgeForce(img, w, h, 2), n = 60, P = snakeMatrix(n, 0.05, 0.1, 1);
  let x = Float64Array.from({ length: n }, (_, i) => 40 + 32 * Math.cos((2 * Math.PI * i) / n)), y = Float64Array.from({ length: n }, (_, i) => 40 + 32 * Math.sin((2 * Math.PI * i) / n));
  for (let it = 0; it < 300; it++) { [x, y] = snakeStep(x, y, P, F, w, h, { alpha: 0.05, beta: 0.1, tau: 1, wEdge: 2, balloon: -0.4 }); if ((it + 1) % 10 === 0) [x, y] = resample(x, y, n); }
  const r = Array.from(x, (v, i) => Math.hypot(v - 40, y[i] - 40)), mean = r.reduce((a, b) => a + b, 0) / n;
  assert.ok(Math.abs(mean - 20) < 1.5, `mean radius ${mean}`);
});

test("Chan–Vese equals the NumPy reference (checkerboard start, 60 iterations)", () => {
  const img = Float64Array.from(R.img, (v: number) => v / 255);
  let phi = new Float64Array(R.w * R.h); let c1 = 0, c2 = 0;
  for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) phi[y * R.w + x] = Math.sin((Math.PI * x) / 5) * Math.sin((Math.PI * y) / 5);
  for (let i = 0; i < R.cv.iters; i++) ({ phi, c1, c2 } = chanVeseStep(phi, img, R.w, R.h, 0.2, 1, 1));
  let inside = 0, sum = 0; phi.forEach((v) => { if (v > 0) inside++; sum += v; });
  assert.ok(Math.abs(inside - R.cv.inside) <= 2, `${inside} vs ${R.cv.inside}`);
  assert.ok(Math.abs(c1 - R.cv.c1) < 1e-6 && Math.abs(sum - R.cv.sum) < 1e-3 * Math.abs(R.cv.sum));
});
