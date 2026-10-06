import { test } from "node:test";
import assert from "node:assert/strict";
import { avgPool2x2, avgPoolBackward, maxPool2x2, maxPoolBackward } from "./pool-ops.ts";

const grid = [
  [1, 8, 3, 2],
  [4, 2, 1, 9],
  [5, 6, 7, 1],
  [0, 3, 2, 4],
];

test("maxPool2x2 and avgPool2x2 match a hand-computed result", () => {
  assert.deepEqual(maxPool2x2(grid), [[8, 9], [6, 7]]);
  assert.deepEqual(avgPool2x2(grid), [[3.75, 3.75], [3.5, 3.5]]);
});

test("maxPoolBackward routes the gradient only to the max of each window (finite-difference check)", () => {
  const dOut = [[1, 1], [1, 1]];
  const grad = maxPoolBackward(grid, dOut);
  const eps = 1e-6;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const plus = grid.map((r) => r.slice()); plus[i][j] += eps;
    const minus = grid.map((r) => r.slice()); minus[i][j] -= eps;
    const sum = (g: number[][]) => maxPool2x2(g).flat().reduce((a, b) => a + b, 0);
    const numeric = (sum(plus) - sum(minus)) / (2 * eps);
    assert.ok(Math.abs(numeric - grad[i][j]) < 1e-4, `[${i}][${j}]: numeric=${numeric}, analytic=${grad[i][j]}`);
  }
});

test("avgPoolBackward splits the gradient evenly (1/4) across every cell in each window", () => {
  const dOut = [[4, 8], [12, 16]];
  const grad = avgPoolBackward(dOut, 4, 4);
  assert.deepEqual(grad, [[1, 1, 2, 2], [1, 1, 2, 2], [3, 3, 4, 4], [3, 3, 4, 4]]);
});
