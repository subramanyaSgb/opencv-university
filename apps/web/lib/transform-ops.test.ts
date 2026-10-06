import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, compose, det, inv, mul, rot, scale } from "./transform-ops.ts";

const close = (a: number[], b: number[]) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-9, `${a} vs ${b}`));

test("R(90) maps (1, 0) to (0, 1)", () => close(apply(rot(90), [1, 0]), [0, 1]));

test("order matters (matches the chapter's NumPy output)", () => {
  const S = scale(2, 1);
  close(apply(mul(rot(90), S), [1, 1]), [-1, 2]); // scale then rotate
  close(apply(mul(S, rot(90)), [1, 1]), [-2, 1]); // rotate then scale
  close(apply(compose(["scale", "rotate"], 90, 2, 1, 0), [1, 1]), [-1, 2]);
});

test("determinant = area factor; inverse undoes", () => {
  assert.ok(Math.abs(det(mul(rot(30), scale(2, 1))) - 2) < 1e-9);
  assert.ok(Math.abs(det(scale(-1, 1)) + 1) < 1e-12);
  const M = mul(rot(30), scale(2, 1));
  close(apply(inv(M), apply(M, [3, 4])), [3, 4]);
  assert.throws(() => inv(scale(0, 1)));
});
