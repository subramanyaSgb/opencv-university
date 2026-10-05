import { test } from "node:test";
import assert from "node:assert/strict";
import { fmt, lengthMm, mmPerPixel } from "./scale-ops.ts";

test("1200 px at 1 mm/px is 1200 mm; at 10 px/mm it is 120 mm (Chapter 1.6, section 5)", () => {
  assert.equal(lengthMm(1200, 1920, 1920), 1200);
  assert.equal(lengthMm(1200, 192, 1920), 120);
});

test("exercise 1: 600 mm across 1200 px", () => {
  assert.equal(mmPerPixel(600, 1200), 0.5);
  assert.equal(lengthMm(900, 600, 1200), 450);
});

test("fmt rounds for display", () => {
  assert.equal(fmt(0.333333), "0.33");
  assert.equal(fmt(2, 2), "2");
});
