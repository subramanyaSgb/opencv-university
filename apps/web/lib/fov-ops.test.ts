import { test } from "node:test";
import assert from "node:assert/strict";
import { angleOfView, focalForFov, heightError, planLenses, sensorWidth } from "./fov-ops.ts";
import { fovWidth } from "./lens-ops.ts";

const close = (a: number, b: number, tol = 0.05) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("2448 px at 3.45 µm is an 8.45 mm wide sensor; 16 mm lens at 1 m sees 519.4 mm, 29.6°", () => {
  const w = sensorWidth(2448, 0.00345);
  close(w, 8.4456, 1e-4);
  close(fovWidth(1000, w, 16), 519.4);
  close(angleOfView(w, 16), 29.6);
});

test("planning example: 22.7 mm gives 550 mm at 1.5 m; only the 16 mm lens passes", () => {
  const w = sensorWidth(2448, 0.00345);
  close(focalForFov(w, 1500, 550), 22.7);
  const ok = planLenses(2448, 0.00345, 1500, 550, 1, 3).filter((o) => o.ok).map((o) => o.f);
  assert.deepEqual(ok, [16]);
});

test("height error: 150 mm above the plane at 3 m reads 1263.2 mm for a 1200 mm billet", () => {
  close(heightError(1200, 3000, 150), 1263.2);
});
