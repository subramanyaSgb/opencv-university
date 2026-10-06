import { test } from "node:test";
import assert from "node:assert/strict";
import { advise } from "./install-ops.ts";

test("package names", () => {
  assert.equal(advise({ gui: true, contrib: false, cuda: false, version: "" }).pkg, "opencv-python");
  assert.equal(advise({ gui: false, contrib: false, cuda: false, version: "" }).pkg, "opencv-python-headless");
  assert.equal(advise({ gui: true, contrib: true, cuda: false, version: "" }).pkg, "opencv-contrib-python");
  assert.equal(advise({ gui: false, contrib: true, cuda: false, version: "" }).pkg, "opencv-contrib-python-headless");
});

test("pinned command and CUDA note", () => {
  const a = advise({ gui: true, contrib: false, cuda: true, version: "4.13.0.92" });
  assert.equal(a.command, 'pip install "opencv-python==4.13.0.92"');
  assert.ok(a.notes.some((n) => n.includes("without CUDA")));
});
