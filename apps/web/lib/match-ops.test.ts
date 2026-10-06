import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchTemplate, peaks, warpTemplate, METHODS } from "./match-ops.ts";

const R = JSON.parse(readFileSync(new URL("./match-ref.json", import.meta.url), "utf8"));

test("matchTemplate equals cv2.matchTemplate for all six methods (float32 tolerance)", () => {
  for (const m of METHODS) {
    const { R: r, rw, rh } = matchTemplate(R.crop, R.cw, R.ch, R.tpl, R.tw, R.th, m), ref = R[m];
    assert.equal(rw * rh, ref.length);
    const scale = Math.max(...ref.map(Math.abs)) || 1;
    let worst = 0; r.forEach((v, i) => { worst = Math.max(worst, Math.abs(v - ref[i]) / scale); });
    assert.ok(worst < 1e-4, `${m}: relative error ${worst}`);
  }
});

test("peaks finds the template's own position; warpTemplate identity", () => {
  const { R: r, rw, rh } = matchTemplate(R.crop, R.cw, R.ch, R.tpl, R.tw, R.th, "CCOEFF_NORMED");
  const p = peaks(r, rw, rh, 0.9, false);
  assert.deepEqual([p[0].x, p[0].y], [15, 12]);
  const id = warpTemplate(R.tpl, R.tw, R.th, 0, 1, 0);
  assert.equal(id.w, R.tw); id.t.forEach((v, i) => assert.ok(Math.abs(v - R.tpl[i]) < 1e-9));
});
