import { test } from "node:test";
import assert from "node:assert/strict";
import { toggleId } from "./nav-state.ts";

test("toggleId adds an id that isn't present", () => {
  assert.deepEqual(toggleId(["a"], "b"), ["a", "b"]);
});

test("toggleId removes an id that is present", () => {
  assert.deepEqual(toggleId(["a", "b"], "a"), ["b"]);
});
