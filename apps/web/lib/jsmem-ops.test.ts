import { test } from "node:test";
import assert from "node:assert/strict";
import { heapAfter, frameBytes } from "./jsmem-ops.ts";

const base = { w: 640, h: 480, channels: 4, matsPerFrame: 3, deleted: false, fps: 30, heapLimitMB: 2048 };

test("leaking three RGBA VGA Mats per frame", () => {
  assert.equal(frameBytes(base), 640 * 480 * 4 * 3);         // 3.6864 MB per frame
  const r = heapAfter(base, 100);
  assert.ok(Math.abs(r.usedMB - 351.5625) < 1e-9);           // 100 * 3686400 / 2^20
  assert.equal(r.framesToLimit, 582);                        // floor(2^31 / 3686400)
  assert.ok(Math.abs(r.secondsToLimit - 19.4) < 1e-9);
});

test("deleting Mats keeps memory flat", () => {
  const r = heapAfter({ ...base, deleted: true }, 100000);
  assert.ok(Math.abs(r.usedMB - 3.515625) < 1e-9);
  assert.equal(r.framesToLimit, Infinity);
  assert.equal(r.over, false);
});
