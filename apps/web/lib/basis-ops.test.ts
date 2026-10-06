import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dct2, keepLargest, haar2, softThreshold, gaborKernel, radon, rampFilter, backproject } from "./basis-ops.ts";

const R = JSON.parse(readFileSync(new URL("./basis-ref.json", import.meta.url), "utf8"));
const maxDiff = (a: ArrayLike<number>, b: ArrayLike<number>) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };

test("dct2 equals cv2.dct and inverts", () => {
  assert.ok(maxDiff(dct2(R.a, 16), R.dct) < 1e-9);
  assert.ok(maxDiff(dct2(dct2(R.a, 16), 16, true), R.a) < 1e-9);
  assert.ok(maxDiff(keepLargest(R.a, 16, 1, "dct"), R.a) < 1e-9 && maxDiff(keepLargest(R.a, 16, 1, "dft"), R.a) < 1e-9);
});

test("gaborKernel equals cv2.getGaborKernel", () => {
  for (const g of R.gabor) { const [k, s, t, l, gm, p] = g.args; assert.ok(maxDiff(gaborKernel(k, s, t, l, gm, p).flat(), g.k) < 1e-12); }
});

test("Haar: orthonormal (energy preserved) and perfectly invertible; threshold 0 changes nothing", () => {
  const c = haar2(R.a, 16, 3), e = (v: ArrayLike<number>) => Array.from(v).reduce((s, x) => s + x * x, 0);
  assert.ok(Math.abs(e(c) - e(R.a)) < 1e-6);
  assert.ok(maxDiff(haar2(c, 16, 3, true), R.a) < 1e-9);
  assert.ok(maxDiff(softThreshold(c, 16, 3, 0), c) === 0);
});

test("Radon of a centred dot peaks at the centre; filtered back-projection restores a disc", () => {
  const n = 64, dot = new Float64Array(n * n); dot[31 * n + 31] = dot[31 * n + 32] = dot[32 * n + 31] = dot[32 * n + 32] = 1;
  for (const p of radon(dot, n, [0, 45, 90, 135])) { const m = p.indexOf(Math.max(...p)); assert.ok(m >= 30 && m <= 33); }
  const disc = new Float64Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) disc[y * n + x] = Math.hypot(x - 31.5, y - 31.5) < 15 ? 1 : 0;
  const angles = Array.from({ length: 90 }, (_, i) => i * 2), rec = backproject(rampFilter(radon(disc, n, angles)), n, angles);
  const inside = rec[32 * n + 32], outside = rec[32 * n + 58];
  assert.ok(Math.abs(inside - 1) < 0.15 && Math.abs(outside) < 0.15, `${inside} ${outside}`);
});
