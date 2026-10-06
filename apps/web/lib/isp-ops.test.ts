import { test } from "node:test";
import assert from "node:assert/strict";
import { grayWorldGains, shading, srgbDecode, srgbEncode } from "./isp-ops.ts";

const close = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("sRGB: 18 % gray (linear 0.18) encodes to 118 of 255; 0.5 to 188", () => {
  assert.equal(Math.round(srgbEncode(0.18) * 255), 118);
  assert.equal(Math.round(srgbEncode(0.5) * 255), 188);
});

test("decode undoes encode", () => {
  for (const x of [0, 0.002, 0.05, 0.3, 1]) close(srgbDecode(srgbEncode(x)), x, 1e-9);
});

test("Code example 1: gray-world gains for means 180, 400, 250 are 2.222, 1, 1.6", () => {
  const g = grayWorldGains([180, 400, 250]);
  close(g[0], 2.222, 1e-3);
  close(g[2], 1.6, 1e-9);
});

test("shading: corner gets 55 % of the centre", () => {
  close(shading(1), 0.55, 1e-9);
  close(shading(0), 1, 1e-9);
});
