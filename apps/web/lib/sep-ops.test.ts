import { test } from "node:test";
import assert from "node:assert/strict";
import { separability, preset, outer } from "./sep-ops.ts";

test("outer products are rank 1; the Laplacian is rank 2; a disk is not separable", () => {
  for (const n of ["box", "gauss", "sobel"]) assert.ok(separability(preset(n, 5)).rank1Share > 0.999999, n);
  const lap = separability(preset("laplace", 3));
  assert.equal(lap.sv.filter((s) => s > 1e-6 * lap.sv[0]).length, 2);
  assert.ok(separability(preset("disk", 7)).rank1Share < 0.99);
});

test("rank-1 factors reproduce a separable kernel", () => {
  const K = outer([1, 2, 1], [-1, 0, 1]), { col, row } = separability(K);
  const R = outer(col, row);
  K.forEach((r, i) => r.forEach((v, j) => assert.ok(Math.abs(R[i][j] - v) < 1e-9)));
});
