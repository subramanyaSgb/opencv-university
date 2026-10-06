import { test } from "node:test";
import assert from "node:assert/strict";
import { overfitAccuracy, overfitForward, overfitLoss, overfitModelCreate, overfitStep, overlapDataset } from "./overfit-ops.ts";

test("without regularization, an oversized network memorizes noisy training labels (train acc -> 1) while validation accuracy degrades", () => {
  const train = overlapDataset(50, 40, 0.1);
  const val = overlapDataset(51, 300, 0);
  let model = overfitModelCreate(60, 7);
  const valAccAt: number[] = [];
  for (let i = 0; i < 3000; i++) {
    model = overfitStep(model, train, 0.3, 0);
    if (i === 0 || i === 2999) valAccAt.push(overfitAccuracy(model, val));
  }
  assert.ok(overfitAccuracy(model, train) > 0.95, "should memorize the noisy training set");
  assert.ok(valAccAt[1] < valAccAt[0], "validation accuracy should degrade from near the start to the end");
});

test("L2 regularization keeps train and validation loss close together instead of diverging", () => {
  const train = overlapDataset(50, 40, 0.1);
  const val = overlapDataset(51, 300, 0);
  let model = overfitModelCreate(60, 7);
  for (let i = 0; i < 2000; i++) model = overfitStep(model, train, 0.3, 0.01);
  const gap = Math.abs(overfitLoss(model, train) - overfitLoss(model, val));
  assert.ok(gap < 0.1, `train/val loss gap should stay small, got ${gap}`);
});

test("overfitStep's analytic L2 gradient matches a finite-difference numeric gradient", () => {
  const pts = overlapDataset(50, 20, 0);
  const model = overfitModelCreate(4, 3);
  const l2 = 0.05;
  const eps = 1e-5;
  const plus = { ...model, Wo: model.Wo.slice() };
  plus.Wo[0] += eps;
  const minus = { ...model, Wo: model.Wo.slice() };
  minus.Wo[0] -= eps;
  const lossAt = (m: typeof model) => overfitLoss(m, pts) + 0.5 * l2 * (m.Wo.reduce((a, b) => a + b * b, 0) + m.Wi.flat().reduce((a, b) => a + b * b, 0));
  const numeric = (lossAt(plus) - lossAt(minus)) / (2 * eps);
  const tinyLr = 1e-6;
  const stepped = overfitStep(model, pts, tinyLr, l2);
  const analytic = (model.Wo[0] - stepped.Wo[0]) / tinyLr;
  assert.ok(Math.abs(numeric - analytic) < 1e-3, `numeric=${numeric}, analytic=${analytic}`);
});
