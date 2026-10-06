import { test } from "node:test";
import assert from "node:assert/strict";
import { channelAt, demosaic, mosaic, type RGB } from "./bayer-ops.ts";

test("RGGB: top-left red, top-right and bottom-left green, bottom-right blue", () => {
  assert.deepEqual([channelAt("RGGB", 0, 0), channelAt("RGGB", 0, 1), channelAt("RGGB", 1, 0), channelAt("RGGB", 1, 1)], [0, 1, 1, 2]);
  assert.equal(channelAt("BGGR", 0, 0), 2);
});

test("Code example 1: flat (200, 50, 30) gives the 4 × 4 mosaic 200 50 / 50 30", () => {
  const img: RGB[][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => [200, 50, 30] as RGB));
  assert.deepEqual(mosaic(img, "RGGB")[0], [200, 50, 200, 50]);
  assert.deepEqual(mosaic(img, "RGGB")[1], [50, 30, 50, 30]);
});

test("a flat colour survives demosaicing exactly", () => {
  const img: RGB[][] = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [120, 80, 40] as RGB));
  for (const row of demosaic(mosaic(img, "RGGB"), "RGGB")) for (const px of row) assert.deepEqual(px, [120, 80, 40]);
});

test("1-pixel black/white stripes become false colour", () => {
  const img: RGB[][] = Array.from({ length: 6 }, () => Array.from({ length: 6 }, (_, c) => (c % 2 ? [0, 0, 0] : [255, 255, 255]) as RGB));
  const out = demosaic(mosaic(img, "RGGB"), "RGGB");
  const [r, g, b] = out[2][2];
  assert.ok(Math.max(r, g, b) - Math.min(r, g, b) > 100);
});
