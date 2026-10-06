import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chainCode, chainDiff, minRotation, polygonMoments, huMoments, matchShapes, contourDFT, reconstruct, resampleClosed, fourierDescriptor, transform, type P } from "./shape-ops.ts";

const D = JSON.parse(readFileSync(new URL("./shape-data.json", import.meta.url), "utf8"));
const close = (a: number, b: number, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));

test("chain code, first difference and minimum rotation of a 2 × 2 square", () => {
  const sq: P[] = [[0, 0], [0, 1], [1, 1], [1, 0]];
  const c = chainCode(sq); assert.deepEqual(c, [6, 0, 2, 4]); assert.deepEqual(chainDiff(c), [2, 2, 2, 2]);
  assert.deepEqual(minRotation([3, 1, 2, 1, 0]), [0, 3, 1, 2, 1]);
});

test("polygon moments and Hu moments equal cv2.moments / cv2.HuMoments on all 12 contours", () => {
  for (const s of D.shapes) {
    const m = polygonMoments(s.pts);
    for (const k of Object.keys(s.m)) assert.ok(close((m as Record<string, number>)[k], s.m[k], 1e-9), `${s.name} ${k}`);
    huMoments(m).forEach((h, i) => assert.ok(close(h, s.hu[i], 1e-7) || Math.abs(h - s.hu[i]) < 1e-15, `${s.name} hu${i}`));
  }
});

test("matchShapes I1, I2, I3 equal cv2.matchShapes", () => {
  for (const k of [1, 2, 3] as const) for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++)
    assert.ok(close(matchShapes(D.shapes[6 + i].pts, D.shapes[j].pts, k), D.match[k][i][j], 1e-7), `I${k} ${i} ${j}`);
});

test("Fourier: full reconstruction is exact; descriptor is invariant to rotation, scale and position", () => {
  const z = resampleClosed(D.shapes[0].pts, 64), F = contourDFT(z), r = reconstruct(F, 32);
  r.forEach((p, i) => { assert.ok(Math.abs(p[0] - z[i][0]) < 1e-9 && Math.abs(p[1] - z[i][1]) < 1e-9); });
  const a = fourierDescriptor(D.shapes[1].pts), b = fourierDescriptor(transform(D.shapes[1].pts, 37, 1.7, false, 300, 200));
  a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 0.02));
});
