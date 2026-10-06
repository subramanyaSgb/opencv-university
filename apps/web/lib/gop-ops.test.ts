import { test } from "node:test";
import assert from "node:assert/strict";
import { bitrate, damaged, needed, pattern, references } from "./gop-ops.ts";

test("patterns", () => {
  assert.equal(pattern(13, 12, 0).join(""), "IPPPPPPPPPPPI");
  assert.equal(pattern(13, 12, 2).join(""), "IBBPBBPBBPBBI");
  assert.equal(pattern(5, 1, 0).join(""), "IIIII");
  assert.equal(pattern(6, 12, 2).join(""), "IBBPPP"); // trailing B without a next anchor become P
});

test("references", () => {
  const t = pattern(7, 12, 2); // I B B P B B P
  const r = references(t);
  assert.deepEqual(r[0], []);
  assert.deepEqual(r[1], [0, 3]);
  assert.deepEqual(r[3], [0]);
  assert.deepEqual(r[4], [3, 6]);
});

test("a lost P damages the rest of its GOP, a lost B only itself, a lost I its GOP", () => {
  const t = pattern(25, 12, 0);
  assert.deepEqual([...damaged(t, 5)].sort((a, b) => a - b), [5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual([...damaged(t, 0)].length, 12);
  const tb = pattern(25, 12, 2);
  assert.deepEqual([...damaged(tb, 4)], [4]);
  assert.deepEqual([...damaged(tb, 3)].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test("seeking needs the chain back to the I-frame", () => {
  const t = pattern(25, 12, 0);
  assert.equal(needed(t, 11).size, 12);
  assert.equal(needed(t, 12).size, 1);
});

test("bitrate", () => {
  // all-intra, 100 kB per frame, 25 fps = 20 Mbit/s
  assert.ok(Math.abs(bitrate(pattern(25, 1, 0), 100, 25) - 20) < 1e-9);
  // GOP 12 without B: (1 + 11 * 0.2) / 12 of that
  assert.ok(Math.abs(bitrate(pattern(12, 12, 0), 100, 25) - 20 * 3.2 / 12) < 1e-9);
});
