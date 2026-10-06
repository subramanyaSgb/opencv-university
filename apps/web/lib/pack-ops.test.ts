import { test } from "node:test";
import assert from "node:assert/strict";
import { asStored16, hex, pack } from "./pack-ops.ts";

const vals = (l: Parameters<typeof pack>[0]) => pack(l, 0xabc, 0x405).map((b) => b.value);

test("Mono12p packs 0xABC, 0x405 into BC 5A 40 (matches the chapter's NumPy code)", () => {
  assert.deepEqual(vals("mono12p"), [0xbc, 0x5a, 0x40]);
});

test("Mono12Packed (GigE Vision) packs into AB 5C 40", () => {
  assert.deepEqual(vals("mono12packed"), [0xab, 0x5c, 0x40]);
});

test("16-bit containers, little-endian", () => {
  assert.deepEqual(vals("lsb16"), [0xbc, 0x0a, 0x05, 0x04]);
  assert.deepEqual(vals("msb16"), [0xc0, 0xab, 0x50, 0x40]);
});

test("every pixel bit appears exactly once", () => {
  for (const l of ["lsb16", "msb16", "mono12p", "mono12packed"] as const) {
    const bits = pack(l, 1, 2).flatMap((b) => b.bits).filter((b) => b.pixel);
    assert.equal(bits.length, 24);
    assert.equal(new Set(bits.map((b) => `${b.pixel}${b.bit}`)).size, 24);
  }
});

test("an 8-bit load of 12-bit data", () => {
  assert.deepEqual(asStored16("lsb16", 4095), { word: 4095, eightBit: 15 });
  assert.deepEqual(asStored16("msb16", 4095), { word: 65520, eightBit: 255 });
  assert.equal(hex(0xbc), "0xBC");
  assert.equal(hex(0xabc, 3), "0xABC");
});
