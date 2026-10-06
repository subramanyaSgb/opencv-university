import { test } from "node:test";
import assert from "node:assert/strict";
import { fitParams, toNet, toImage, fitStats } from "./letterbox-ops.ts";

test("letterbox of 320×200 into 224: scale 0.7, vertical padding 42 px each side (cv2 maps the full input back to (0, -60, 320, 320))", () => {
  const p = fitParams(320, 200, 224, "letterbox");
  assert.equal(p.sx, 0.7); assert.equal(p.ox, 0); assert.equal(p.oy, 42);
  const back = toImage({ x: 0, y: 0, w: 224, h: 224 }, p);
  assert.deepEqual([back.x, back.y, back.w, back.h].map((v) => Math.round(v * 1e6) / 1e6), [0, -60, 320, 320]);
});

test("boxes round-trip; stretch distorts the aspect, crop cuts, letterbox pads", () => {
  for (const f of ["stretch", "crop", "letterbox"] as const) {
    const p = fitParams(320, 200, 224, f), b = { x: 25, y: 50, w: 90, h: 90 }, r = toImage(toNet(b, p), p);
    assert.ok(Math.abs(r.x - 25) < 1e-9 && Math.abs(r.h - 90) < 1e-9);
  }
  assert.ok(Math.abs(fitStats(320, 200, 224, "stretch").aspect - 1.6) < 1e-9);
  assert.ok(Math.abs(fitStats(320, 200, 224, "crop").cut - 0.375) < 1e-9);
  assert.ok(Math.abs(fitStats(320, 200, 224, "letterbox").padding - 0.375) < 1e-9);
});
