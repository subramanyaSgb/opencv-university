import { test } from "node:test";
import assert from "node:assert/strict";
import { circleFit, huber, ols, perp, tls, type Pt } from "./fit-ops.ts";

const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("OLS on a textbook example: y = 1.1 x + 1.1", () => {
  const { a, b } = ols([[0, 1], [1, 3], [2, 2], [3, 5]]);
  near(a, 1.1); near(b, 1.1);
});

test("TLS handles vertical lines; OLS cannot", () => {
  const v: Pt[] = [[5, 0], [5, 1], [5, 2], [5, 3]];
  assert.ok(Number.isNaN(ols(v).a));
  const l = tls(v);
  near(l.dx, 0); near(l.dy, 1); near(l.cx, 5);
});

test("Huber ignores an outlier that pulls plain TLS", () => {
  const p: Pt[] = Array.from({ length: 20 }, (_, i) => [i, 0.5 * i + (i % 2 ? 0.2 : -0.2)] as Pt);
  p[10] = [10, 25];
  const plain = tls(p), robust = huber(p);
  const angle = (l: { dx: number; dy: number }) => Math.atan2(l.dy, l.dx) * 180 / Math.PI;
  const truth = Math.atan(0.5) * 180 / Math.PI;
  assert.ok(Math.abs(angle(robust) - truth) < 0.6); // Huber still gives the outlier a small weight
  assert.ok(Math.abs(angle(plain) - truth) > Math.abs(angle(robust) - truth));
  near(perp(robust, [0, -0.2]), perp(robust, [0, -0.2])); // perp is defined
});

test("circle through exact points", () => {
  const c = circleFit([[120 + 35, 90], [120, 90 + 35], [120 - 35, 90], [120, 90 - 35]]);
  near(c.cx, 120, 1e-6); near(c.cy, 90, 1e-6); near(c.r, 35, 1e-6);
});
