import { test } from "node:test";
import assert from "node:assert/strict";
import { covariance, eigSym2 } from "./pca-ops.ts";

const near = (a: number, b: number, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} vs ${b}`);

test("eigen of the chapter's covariance matrix (matches np.linalg.eigh)", () => {
  const { l1, l2, v1 } = eigSym2(1592.5, 784.8, 684.9);
  near(l1, 2045.3, 0.1); near(l2, 232.2, 0.1);
  near((Math.atan2(v1[1], v1[0]) * 180) / Math.PI, 29.98, 0.02);
});

test("A v = lambda v for both eigenvectors", () => {
  const a = 3, b = 1, d = 2;
  const { l1, l2, v1, v2 } = eigSym2(a, b, d);
  near(a * v1[0] + b * v1[1], l1 * v1[0]); near(b * v1[0] + d * v1[1], l1 * v1[1]);
  near(a * v2[0] + b * v2[1], l2 * v2[0]); near(b * v2[0] + d * v2[1], l2 * v2[1]);
});

test("covariance of points on a line along x", () => {
  const { cx, cy, C } = covariance([[0, 5], [2, 5], [4, 5]]);
  near(cx, 2); near(cy, 5); near(C[0][0], 8 / 3); near(C[1][1], 0); near(C[0][1], 0);
});
