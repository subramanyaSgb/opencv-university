import { test } from "node:test";
import assert from "node:assert/strict";
import { background, frame, motionMask, objX, W, H, OBJ } from "./diff-ops.ts";

const bg = background();
const frames = Array.from({ length: 30 }, (_, t) => frame(bg, t).f);
const truth = (t: number) => frame(bg, t).truth;
const hits = (m: Uint8Array, tr: Uint8Array) => { let a = 0, b = 0; for (let i = 0; i < m.length; i++) if (tr[i]) { b++; if (m[i]) a++; } return a / b; };
const falseOutside = (m: Uint8Array, tr: Uint8Array) => { let a = 0; for (let i = 0; i < m.length; i++) if (m[i] && !tr[i]) a++; return a; };

test("object path: moves, stops for frames 12–19, moves again", () => {
  assert.equal(objX(0), 10); assert.equal(objX(12), 70); assert.equal(objX(19), 70); assert.equal(objX(20), 75);
});

test("reference subtraction finds the whole object with few false pixels", () => {
  const empty = Uint8Array.from(bg, (v) => Math.round(v)); // an image of the empty scene
  const m = motionMask(frames, 8, "reference", 20, 0.05, empty);
  assert.ok(hits(m, truth(8)) > 0.95);
  assert.ok(falseOutside(m, truth(8)) < 20);
});

test("two-frame difference: ghost at the old position, nothing while the object stands still", () => {
  const m = motionMask(frames, 8, "two", 20);
  assert.ok(falseOutside(m, truth(8)) > 50); // the vacated strip at frame 7's position
  const still = motionMask(frames, 15, "two", 20);
  assert.ok(hits(still, truth(15)) < 0.02);
});

test("sizes", () => { assert.equal(frames[0].length, W * H); assert.ok(OBJ < H); });
