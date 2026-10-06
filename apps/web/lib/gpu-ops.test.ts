import { test } from "node:test";
import assert from "node:assert/strict";
import { offload, transferMs } from "./gpu-ops.ts";

test("transfer time: 5 MB at 10 GB/s is 0.5 ms", () => {
  assert.ok(Math.abs(transferMs(5e6, 10) - 0.5) < 1e-12);
});

test("one cheap operation is slower on the GPU, a chain of heavier ones is faster", () => {
  const one = offload({ mp: 5, channels: 3, bw: 6, cpuMs: 2, speedup: 10, ops: 1, smallResult: false });
  // up = down = 15e6 / 6e9 s = 2.5 ms; compute = 0.2 + 0.05
  assert.ok(Math.abs(one.up - 2.5) < 1e-9);
  assert.ok(Math.abs(one.gpu - 5.25) < 1e-9);
  assert.equal(one.cpu, 2);
  assert.ok(one.gpu > one.cpu);
  // gain per op = 2 - 0.25 = 1.75 ms; transfers 5 ms -> 3 ops needed
  assert.equal(one.breakEven, 3);
  const chain = offload({ mp: 5, channels: 3, bw: 6, cpuMs: 2, speedup: 10, ops: 6, smallResult: true });
  assert.ok(chain.gpu < chain.cpu);
});

test("no speed-up means the GPU never wins", () => {
  assert.equal(offload({ mp: 1, channels: 1, bw: 12, cpuMs: 0.05, speedup: 1, ops: 1, smallResult: true }).breakEven, Infinity);
});

test("integrated GPU with shared memory: no transfers", () => {
  const r = offload({ mp: 5, channels: 3, bw: Infinity, cpuMs: 2, speedup: 4, ops: 1, smallResult: false });
  assert.equal(r.up + r.down, 0);
  assert.ok(Math.abs(r.gpu - 0.55) < 1e-9);
  assert.equal(r.breakEven, 1);
});
