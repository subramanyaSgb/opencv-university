import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { warp, cubicWeights, rotationMatrix, inv3, mul3, resizeGray, unwrapPolar } from "./warp-ops.ts";

const REF = JSON.parse(readFileSync(new URL("./warp-ref.json", import.meta.url), "utf8"));

test("cubic weights sum to 1 and interpolate (t = 0 gives 0, 1, 0, 0)", () => {
  assert.deepEqual(cubicWeights(0).map((v) => Math.round(v * 1e9) / 1e9), [0, 1, 0, 0]);
  assert.ok(Math.abs(cubicWeights(0.3).reduce((a, b) => a + b, 0) - 1) < 1e-12);
});

test("warp matches cv2.warpAffine (recorded) to within 1 level on almost all pixels", () => {
  const M = [...REF.M, [0, 0, 1]];
  for (const k of ["nearest", "linear", "cubic"] as const) {
    const o = warp(REF.img, 16, 12, 1, M, 16, 12, k, 0), r: number[] = REF.out[k];
    let bad = 0; o.forEach((v, i) => { if (Math.abs(v - r[i]) > 1) bad++; });
    assert.ok(bad <= 4, `${k}: ${bad} pixels differ by more than 1`); // OpenCV uses fixed-point weights and rounds coordinates to 1/32 px
  }
});

test("rotation matrix and inverse", () => {
  const R = rotationMatrix(160, 100, 30, 1), I = mul3(R, inv3(R));
  I.forEach((r, i) => r.forEach((v, j) => assert.ok(Math.abs(v - (i === j ? 1 : 0)) < 1e-9)));
});

test("resizeGray matches cv2.resize (recorded) within 1 level", () => {
  const R = JSON.parse(readFileSync(new URL("./resize-ref.json", import.meta.url), "utf8"));
  const cases: [string, number, number, "nearest" | "linear" | "cubic" | "area"][] = [["up_nearest", 36, 30, "nearest"], ["up_linear", 36, 30, "linear"], ["up_cubic", 36, 30, "cubic"], ["down_area", 4, 5, "area"], ["down_area3", 5, 4, "area"]];
  for (const [k, ow, oh, m] of cases) {
    const o = resizeGray(R.img, 12, 10, ow, oh, m);
    let bad = 0; o.forEach((v, i) => { if (Math.abs(v - R[k][i]) > 1) bad++; });
    assert.ok(bad === 0, `${k}: ${bad} pixels differ by more than 1`);
  }
});

test("unwrapPolar matches cv2.warpPolar + rotate (recorded), mostly within 2 levels", () => {
  const R = JSON.parse(readFileSync(new URL("./polar-ref.json", import.meta.url), "utf8"));
  for (const [k, log] of [["lin", false], ["log", true]] as const) {
    const o = unwrapPolar(R.img, 60, 60, 30, 30, 27, 90, 20, log);
    let bad = 0; o.forEach((v, i) => { if (Math.abs(v - R[k][i]) > 2) bad++; });
    assert.ok(bad / o.length < 0.03, `${k}: ${bad} of ${o.length} differ by more than 2`);
  }
});
