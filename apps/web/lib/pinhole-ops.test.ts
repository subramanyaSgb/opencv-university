import { test } from "node:test";
import assert from "node:assert/strict";
import { blurSpot, project, relativeLight } from "./pinhole-ops.ts";

test("section 23: f = 10, X = 2 gives x = 4 at Z = 5 and x = 2 at Z = 10", () => {
  assert.equal(project(10, 2, 5), 4);
  assert.equal(project(10, 2, 10), 2);
});

test("doubling the distance halves the image size", () => {
  assert.equal(project(1400, 1.2, 6) * 2, project(1400, 1.2, 3));
});

test("blur spot: far object gives about the hole size; a near one gives more", () => {
  assert.equal(blurSpot(1, 10, 10), 2);
  assert.ok(Math.abs(blurSpot(1, 10, 1e6) - 1) < 1e-4);
});

test("doubling the hole diameter gives four times the light", () => {
  assert.equal(relativeLight(2, 1), 4);
});
