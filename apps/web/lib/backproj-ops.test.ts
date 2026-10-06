import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scene, W } from "./inrange-ops.ts";
import { toHsv, hsHist, normalizeMinMax, backProject, patch, hBin, sBin } from "./backproj-ops.ts";

const REF = JSON.parse(readFileSync(new URL("./backproj-ref.json", import.meta.url), "utf8")).ref;
const PATCH: Record<string, [number, number, number]> = { orange: [34, 40, 6], green: [40, 75, 6] };

test("bin index follows OpenCV's uniform ranges", () => {
  assert.equal(hBin(0, 30), 0); assert.equal(hBin(179, 30), 29); assert.equal(hBin(6, 30), 1);
  assert.equal(sBin(255, 32), 31); assert.equal(sBin(8, 32), 1);
});

test("hist and back-projection agree with cv2.calcHist / calcBackProject (recorded)", () => {
  const { bgr, id } = scene();
  const hsv = toHsv(bgr);
  for (const [key, ref] of Object.entries<{ hist: number[]; bpsum: number; hits: Record<string, number> }>(REF)) {
    const [name, hb, sb] = key.split("-");
    const spec = { hBins: Number(hb), sBins: Number(sb) };
    const [cx, cy, r] = PATCH[name];
    const raw = hsHist(hsv, spec, patch(W, cx, cy, r));
    const h = normalizeMinMax(raw), tol = (4 * 255) / Math.max(...raw); // a few pixels moving bin (HSV differs by 1 on <1 % of pixels)
    h.forEach((v, i) => assert.ok(Math.abs(v - ref.hist[i]) < tol, `${key} bin ${i}`));
    const bp = backProject(hsv, h, spec);
    const sum = bp.reduce((a, v) => a + v, 0);
    assert.ok(Math.abs(sum - ref.bpsum) / ref.bpsum < 0.05, `${key} sum ${sum} vs ${ref.bpsum}`);
    for (const [o, frac] of Object.entries(ref.hits)) {
      let hit = 0, tot = 0;
      id.forEach((v, i) => { if (v === Number(o)) { tot++; if (bp[i] > 50) hit++; } });
      assert.ok(Math.abs(hit / tot - frac) < 0.08, `${key} object ${o}: ${hit / tot} vs ${frac}`);
    }
  }
});
