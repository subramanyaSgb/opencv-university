import { test } from "node:test";
import assert from "node:assert/strict";
import { budget, pipelined, sequential } from "./budget-ops.ts";

const st = [{ name: "capture", ms: 5 }, { name: "detect", ms: 30 }, { name: "save", ms: 15 }];

test("budget, sequential and pipelined", () => {
  assert.equal(budget(40), 25);
  assert.deepEqual(sequential(st), { latency: 50, fps: 20 });
  const p = pipelined(st);
  assert.equal(p.latency, 50);
  assert.ok(Math.abs(p.fps - 1000 / 30) < 1e-9);
  assert.equal(p.bottleneck, "detect");
});
