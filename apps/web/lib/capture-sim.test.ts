import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate } from "./capture-sim.ts";

test("fast processing: every frame, latency = processing time", () => {
  const r = simulate(25, 10, 4, "buffer", 2);
  assert.equal(r.processed, 50);
  assert.equal(r.dropped, 0);
  assert.equal(Math.round(r.maxLatency), 10);
});

test("slow processing with a buffer: latency grows to about buffer x processing time", () => {
  const r = simulate(25, 80, 4, "buffer", 5);
  assert.ok(r.dropped > 0);
  assert.ok(r.maxLatency > 3 * 80); // several frames old
  const s = simulate(25, 80, 4, "latest", 5);
  assert.ok(s.maxLatency <= 80 + 40 + 1e-9); // at most one frame period old + processing
  assert.ok(s.meanLatency < r.meanLatency);
});
