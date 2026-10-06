import { test } from "node:test";
import assert from "node:assert/strict";
import { capture, gains, apply, cast, type Patch } from "./wb-ops.ts";

const grey: Patch = { name: "grey card", refl: [0.4, 0.4, 0.4], area: 1 };
const white: Patch = { name: "white card", refl: [0.8, 0.8, 0.8], area: 1 };
const red: Patch = { name: "red", refl: [0.1, 0.1, 0.6], area: 1 };
const blue: Patch = { name: "blue", refl: [0.6, 0.2, 0.1], area: 1 };
const leaves: Patch = { name: "leaves", refl: [0.08, 0.45, 0.12], area: 12 };
const warm: [number, number, number] = [0.6, 0.9, 1.2];

test("reference patch removes the cast exactly", () => {
  const g = gains([grey, white, red, blue], warm, "reference");
  const out = apply(capture(grey, warm), g);
  assert.ok(cast(out) < 1e-9);
  assert.ok(cast(capture(grey, warm)) > 0.9);   // uncorrected: R/B = 2
});

test("grey world works on a balanced scene and fails on a mostly green one", () => {
  const balanced = [grey, white, red, blue];
  assert.ok(cast(apply(capture(grey, warm), gains(balanced, warm, "greyworld"))) < 0.35);
  const green = [grey, white, red, blue, leaves];
  assert.ok(cast(apply(capture(grey, warm), gains(green, warm, "greyworld"))) > 0.6);
});

test("no correction keeps gains at 1", () => {
  assert.deepEqual(gains([grey], warm, "none"), [1, 1, 1]);
});
