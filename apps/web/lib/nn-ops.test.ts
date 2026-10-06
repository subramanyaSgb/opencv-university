import { test } from "node:test";
import assert from "node:assert/strict";
import { layerForward, neuronForward, sigmoid, tanhAct } from "./nn-ops.ts";

test("neuronForward matches the chapter's own hand-worked example (z = -0.4)", () => {
  const { z, a } = neuronForward([0.5, -1.0, 2.0], [0.4, 0.3, -0.2], 0.1, "sigmoid");
  assert.equal(Math.round(z * 1e6) / 1e6, -0.4);
  assert.equal(Math.round(a * 1e4) / 1e4, 0.4013);
});

test("sigmoid and tanh agree with their closed forms at a few points", () => {
  assert.equal(sigmoid(0), 0.5);
  assert.equal(tanhAct(0), 0);
  assert.ok(Math.abs(sigmoid(-0.4) - 0.401312339887548) < 1e-9);
});

test("layerForward with identity activation is a plain matrix-vector product plus bias", () => {
  const out = layerForward([1, 2], [[1, 0], [0, 1]], [0.5, -0.5], "identity");
  assert.deepEqual(out, [1.5, 1.5]);
});
