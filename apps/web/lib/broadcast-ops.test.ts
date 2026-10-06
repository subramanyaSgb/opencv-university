import { test } from "node:test";
import assert from "node:assert/strict";
import { broadcast, parseShape } from "./broadcast-ops.ts";

// Expected results checked with np.broadcast_shapes in NumPy 2.5
test("compatible shapes", () => {
  assert.deepEqual(broadcast([200, 320, 3], [3]), { shape: [200, 320, 3] });
  assert.deepEqual(broadcast([200, 320], [320]), { shape: [200, 320] });
  assert.deepEqual(broadcast([200, 320], [200, 1]), { shape: [200, 320] });
  assert.deepEqual(broadcast([4, 1, 3], [5, 3]), { shape: [4, 5, 3] });
  assert.deepEqual(broadcast([], [2, 2]), { shape: [2, 2] });
});

test("incompatible shapes", () => {
  const r = broadcast([200, 320], [200]);
  assert.ok("error" in r && r.error.includes("320 vs 200"));
});

test("parse", () => {
  assert.deepEqual(parseShape("(200, 320, 3)"), [200, 320, 3]);
  assert.deepEqual(parseShape("5,"), [5]);
  assert.equal(parseShape("a, 3"), null);
});
