import { test } from "node:test";
import assert from "node:assert/strict";
import { airyDiameter, defocusOverRange, dofLimits, fNumber, lightRelative, totalBlur } from "./aperture-ops.ts";
import { blurCircle, imageDistance } from "./lens-ops.ts";

const close = (a: number, b: number, tol = 0.5) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
const PX = 0.00345;

test("section 4: 50 mm with a 25 mm opening is f/2; with 6.25 mm it is f/8", () => {
  assert.equal(fNumber(50, 25), 2);
  assert.equal(fNumber(50, 6.25), 8);
});

test("f/8 collects 1/16 of the light of f/2", () => {
  assert.equal(lightRelative(8, 2), 1 / 16);
});

test("Code example 2: 25 mm at 2 m, 2-pixel blur: f/4 sharp from 1840 to 2191 mm", () => {
  const { near, far } = dofLimits(25, 4, 2000, 2 * PX);
  close(near, 1840);
  close(far, 2191);
});

test("at the DOF limits the blur circle equals the accepted blur", () => {
  const c = 2 * PX;
  const { near, far } = dofLimits(25, 8, 2000, c);
  const sensor = imageDistance(25, 2000);
  close(blurCircle(25 / 8, sensor, imageDistance(25, near)), c, 1e-9);
  close(blurCircle(25 / 8, sensor, imageDistance(25, far)), c, 1e-9);
});

test("diffraction spot: f/8 is 10.7 µm (3.1 px), f/22 is 29.5 µm (8.6 px)", () => {
  close(airyDiameter(8) / PX, 3.1, 0.05);
  close(airyDiameter(22) / PX, 8.6, 0.05);
});

test("Code example 3: part 1.8–2.2 m, f/5.6 gives 1.8 px defocus and 2.8 px total", () => {
  const d = defocusOverRange(25, 5.6, 2000, 1800, 2200);
  close(d / PX, 1.8, 0.05);
  close(totalBlur(d, airyDiameter(5.6)) / PX, 2.8, 0.05);
});
