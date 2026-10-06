import { test } from "node:test";
import assert from "node:assert/strict";
import { bceLoss, convAccuracy, convForward, convModelCreate, convStep, makeDataset } from "./conv-train-ops.ts";

test("a trained conv kernel reaches high accuracy distinguishing vertical from horizontal edges", () => {
  const patches = makeDataset(11, 40);
  let model = convModelCreate(3);
  for (let i = 0; i < 300; i++) ({ model } = convStep(model, patches, 0.3));
  assert.ok(convAccuracy(convForward(model, patches), patches) >= 0.9);
});

test("the analytic gradient (via convStep) matches a finite-difference numeric gradient on k[0][0]", () => {
  const patches = makeDataset(11, 40);
  const model = convModelCreate(3);
  const eps = 1e-5;
  const plus = { ...model, k: model.k.map((r) => r.slice()) };
  plus.k[0][0] += eps;
  const minus = { ...model, k: model.k.map((r) => r.slice()) };
  minus.k[0][0] -= eps;
  const numeric = (bceLoss(convForward(plus, patches), patches) - bceLoss(convForward(minus, patches), patches)) / (2 * eps);
  // recover the analytic slope from one tiny gradient-descent step (lr small enough to stay linear).
  const tinyLr = 1e-6;
  const { model: stepped } = convStep(model, patches, tinyLr);
  const analytic = (model.k[0][0] - stepped.k[0][0]) / tinyLr;
  assert.ok(Math.abs(numeric - analytic) < 1e-3, `numeric=${numeric}, analytic=${analytic}`);
});
