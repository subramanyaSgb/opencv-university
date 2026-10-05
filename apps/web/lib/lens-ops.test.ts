import { test } from "node:test";
import assert from "node:assert/strict";
import { blurCircle, fovWidth, imageDistance } from "./lens-ops.ts";

const close = (a: number, b: number, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("25 mm lens focused at 2 m: sensor 25.316 mm behind the lens (Code example 1)", () => {
  close(imageDistance(25, 2000), 25.316);
});

test("objects at 1 m and 5 m give 113.0 µm and 67.8 µm blur at f/2.8", () => {
  const D = 25 / 2.8;
  const sensor = imageDistance(25, 2000);
  close(blurCircle(D, sensor, imageDistance(25, 1000)) * 1000, 113.0, 0.1);
  close(blurCircle(D, sensor, imageDistance(25, 5000)) * 1000, 67.8, 0.1);
  assert.equal(blurCircle(D, sensor, sensor), 0);
});

test("a very distant object focuses at the focal length", () => {
  close(imageDistance(25, 1e12), 25);
});

test("slab example: 8.8 mm sensor at 4.5 m, 12 mm lens sees 3291 mm, 25 mm sees 1575 mm", () => {
  close(fovWidth(4500, 8.8, 12), 3291.2);
  close(fovWidth(4500, 8.8, 25), 1575.2);
});
