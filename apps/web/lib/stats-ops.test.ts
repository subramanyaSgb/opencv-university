import { test } from "node:test";
import assert from "node:assert/strict";
import { erf, gaussPdf, mean, median, normals, robustSigma, std, twoSidedTail, variance } from "./stats-ops.ts";

test("mean, variance, std, median", () => {
  const v = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(mean(v), 5);
  assert.equal(variance(v), 4);
  assert.equal(std(v), 2);
  assert.ok(Math.abs(std(v, 1) - Math.sqrt(32 / 7)) < 1e-12);
  assert.equal(median(v), 4.5);
  assert.equal(median([3, 1, 2]), 2);
});

test("68-95-99.7", () => {
  assert.ok(Math.abs(1 - twoSidedTail(1) - 0.6827) < 1e-4);
  assert.ok(Math.abs(1 - twoSidedTail(2) - 0.9545) < 1e-4);
  assert.ok(Math.abs(twoSidedTail(3) - 0.0027) < 1e-4);
  assert.ok(Math.abs(erf(0)) < 1e-9);
  assert.ok(Math.abs(gaussPdf(0, 0, 1) - 0.3989423) < 1e-6);
});

test("seeded normals have the right mean and spread; robust sigma resists outliers", () => {
  const x = normals(20000, 100, 4, 7);
  assert.ok(Math.abs(mean(x) - 100) < 0.1);
  assert.ok(Math.abs(std(x) - 4) < 0.1);
  assert.deepEqual(normals(5, 0, 1, 3), normals(5, 0, 1, 3));
  const dirty = x.slice(0, 1000).concat(Array(50).fill(0));
  assert.ok(std(dirty) > 15);
  assert.ok(Math.abs(robustSigma(dirty) - 4) < 0.6);
});
