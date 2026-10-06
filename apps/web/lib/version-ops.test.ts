import { test } from "node:test";
import assert from "node:assert/strict";
import { FEATURES, status, summary } from "./version-ops.ts";

// facts recorded by probing opencv-python-headless and opencv-contrib-python-headless 5.0.0.93
test("ml, gapi and cascades need contrib in 5.0", () => {
  for (const k of ["ml", "gapi", "cascade"]) {
    const f = FEATURES.find((x) => x.key === k)!;
    assert.equal(status(f, "4.13", false), "ok");
    assert.equal(status(f, "5.0", false), "contrib");
    assert.equal(status(f, "5.0", true), "ok");
  }
});

test("summary counts", () => {
  assert.deepEqual(summary(["core", "ml", "dnn"], "5.0", false), { ok: 1, contrib: 1, check: 1, missing: 0 });
  assert.deepEqual(summary(["core", "ml", "dnn"], "4.13", false), { ok: 3, contrib: 0, check: 0, missing: 0 });
});
