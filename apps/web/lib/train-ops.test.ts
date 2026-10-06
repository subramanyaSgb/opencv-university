import { test } from "node:test";
import assert from "node:assert/strict";
import { accuracy, bceLoss, blobsDataset, logregForward, logregStep, mlpCreate, mlpForward, mlpStep, xorDataset } from "./train-ops.ts";

test("logistic regression trains to high accuracy on a linearly-separable dataset", () => {
  const pts = blobsDataset(42);
  let model = { w: [0, 0] as [number, number], b: 0 };
  let loss = Infinity;
  for (let i = 0; i < 300; i++) ({ model, loss } = logregStep(model, pts, 0.5));
  assert.ok(loss < 0.1);
  assert.equal(accuracy(logregForward(model, pts), pts), 1);
});

test("a single logistic-regression neuron (no hidden layer) cannot learn an XOR-like dataset", () => {
  const pts = xorDataset(5);
  let model = { w: [0, 0] as [number, number], b: 0 };
  for (let i = 0; i < 300; i++) ({ model } = logregStep(model, pts, 0.5));
  const acc = accuracy(logregForward(model, pts), pts);
  assert.ok(acc < 0.7, `expected near-chance accuracy, got ${acc}`);
});

test("a 2-layer (tanh -> sigmoid) network solves the same XOR-like dataset", () => {
  const pts = xorDataset(5);
  let model = mlpCreate(6, 9);
  for (let i = 0; i < 400; i++) ({ model } = mlpStep(model, pts, 0.5));
  assert.equal(accuracy(mlpForward(model, pts), pts), 1);
});

test("mlpStep's analytic gradient matches a finite-difference numeric gradient", () => {
  const pts = blobsDataset(42).slice(0, 10);
  const model = mlpCreate(3, 1);
  const { loss: loss0 } = mlpStep(model, pts, 0);
  const eps = 1e-5;
  const probe = { ...model, Wo: model.Wo.slice() };
  probe.Wo[0] += eps;
  const lossPlus = bceLoss(mlpForward(probe, pts), pts.map((p) => p.label));
  probe.Wo[0] -= 2 * eps;
  const lossMinus = bceLoss(mlpForward(probe, pts), pts.map((p) => p.label));
  const numericSlope = (lossPlus - lossMinus) / (2 * eps);
  // one gradient-descent step with lr=1 moves Wo[0] by exactly its gradient, so recover it from a tiny step.
  const { model: stepped } = mlpStep(model, pts, 1e-6);
  const analyticSlope = (model.Wo[0] - stepped.Wo[0]) / 1e-6;
  assert.ok(Math.abs(numericSlope - analyticSlope) < 1e-3, `numeric=${numericSlope}, analytic=${analyticSlope}`);
  assert.ok(loss0 > 0);
});
