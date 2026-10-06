import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pyrDown, pyrUp, toF, gaussianPyramid, laplacianPyramid, collapse, pyramidBlend } from "./pyr-ops.ts";

const R = JSON.parse(readFileSync(new URL("./pyr-ref.json", import.meta.url), "utf8"));
const W = 13, H = 10;
const close = (a: ArrayLike<number>, b: number[], tol: number) => { assert.equal(a.length, b.length); for (let i = 0; i < b.length; i++) assert.ok(Math.abs(a[i] - b[i]) <= tol, `index ${i}: ${a[i]} vs ${b[i]}`); };

test("pyrDown and pyrUp equal OpenCV on 8-bit (odd size 13 × 10)", () => {
  const d = pyrDown(R.a, W, H); assert.equal(d.w, 7); assert.equal(d.h, 5); close(d.d, R.down, 0);
  close(pyrUp(R.a, W, H).d, R.up, 0);
});

test("float pyramids and pyramid blending equal OpenCV float results", () => {
  const f = toF(R.a, W, H);
  close(gaussianPyramid(f, 3)[1].d, R.downF1, 1e-9);
  close(laplacianPyramid(f, 3)[0].d, R.lap0, 1e-9);
  const m = toF(Array.from({ length: W * H }, (_, i) => (i % W < 6 ? 1 : 0)), W, H);
  close(pyramidBlend(f, toF(R.b, W, H), m, 3).d, R.blend, 1e-9);
});

test("a Laplacian pyramid collapses back to the image exactly", () => {
  const f = toF(R.a, W, H); close(collapse(laplacianPyramid(f, 3)).d, R.a, 1e-9);
});
