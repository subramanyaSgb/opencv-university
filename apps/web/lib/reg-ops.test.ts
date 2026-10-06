import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { phaseCorrelate, eccEuclidean, moveImage, warpBack } from "./reg-ops.ts";

const R = JSON.parse(readFileSync(new URL("./reg-ref.json", import.meta.url), "utf8"));

test("phase correlation finds the integer shift that cv2.phaseCorrelate finds", () => {
  const r = phaseCorrelate(R.a, R.b, 64, 32);
  assert.ok(Math.abs(r.dx - R.pc[0]) < 0.05 && Math.abs(r.dy - R.pc[1]) < 0.05, `${r.dx}, ${r.dy}`);
});

test("ECC (Euclidean) recovers the warp found by cv2.findTransformECC", () => {
  const { warp } = eccEuclidean(R.tpl, R.inp, 128, 80, { theta: 0, tx: 0, ty: 0 }, 100);
  const [c, , tx, s, , ty] = R.ecc;
  assert.ok(Math.abs(warp.theta - Math.atan2(s, c)) < 1e-3, `theta ${warp.theta}`);
  assert.ok(Math.abs(warp.tx - tx) < 0.05 && Math.abs(warp.ty - ty) < 0.05, `${warp.tx}, ${warp.ty}`);
});

test("moveImage and warpBack are inverse to each other", () => {
  const w = 128, h = 80, p = { theta: 0.05, tx: 3, ty: -2 };
  const back = warpBack(moveImage(R.tpl, w, h, p), w, h, p);
  let err = 0, n = 0;
  for (let y = 10; y < h - 10; y++) for (let x = 10; x < w - 10; x++) { err += Math.abs(back[y * w + x] - R.tpl[y * w + x]); n++; }
  assert.ok(err / n < 4, `mean error ${err / n}`); // two bilinear resamplings smooth the noisy scene a little
  const q = { theta: 0, tx: 3, ty: -2 }, exact = warpBack(moveImage(R.tpl, w, h, q), w, h, q); // integer shift: exact
  for (let y = 10; y < h - 10; y++) for (let x = 10; x < w - 10; x++) assert.ok(Math.abs(exact[y * w + x] - R.tpl[y * w + x]) < 1e-9);
});
