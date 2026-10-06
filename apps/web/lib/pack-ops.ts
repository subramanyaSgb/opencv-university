// How 12-bit pixels are laid out in bytes, for PackLab (Chapter 4.4). Unit-tested.
// Layouts: 16-bit containers (little-endian) and the two common 3-bytes-per-2-pixels packings.

export type Layout = "lsb16" | "msb16" | "mono12p" | "mono12packed";
/** One bit of a byte: which pixel ("A", "B") and which bit of that pixel it holds, or padding (null). */
export type Bit = { pixel: "A" | "B" | null; bit: number; value: 0 | 1 };
export type Byte = { value: number; bits: Bit[] }; // bits[0] = most significant bit (bit 7)

type Src = { pixel: "A" | "B" | null; bit: number };

/** For each output byte, the source of bits 7..0. */
function plan(layout: Layout): Src[][] {
  const A = (b: number): Src => ({ pixel: "A", bit: b });
  const B = (b: number): Src => ({ pixel: "B", bit: b });
  const pad: Src = { pixel: null, bit: 0 };
  const range = (f: (b: number) => Src, hi: number, lo: number) => Array.from({ length: hi - lo + 1 }, (_, k) => f(hi - k));
  switch (layout) {
    case "lsb16": // value in bits 11..0 of a little-endian 16-bit word
      return [range(A, 7, 0), [pad, pad, pad, pad, ...range(A, 11, 8)], range(B, 7, 0), [pad, pad, pad, pad, ...range(B, 11, 8)]];
    case "msb16": // value << 4
      return [[...range(A, 3, 0), pad, pad, pad, pad], range(A, 11, 4), [...range(B, 3, 0), pad, pad, pad, pad], range(B, 11, 4)];
    case "mono12p": // PFNC Mono12p: LSB-first bit stream
      return [range(A, 7, 0), [...range(B, 3, 0), ...range(A, 11, 8)], range(B, 11, 4)];
    case "mono12packed": // GigE Vision Mono12Packed
      return [range(A, 11, 4), [...range(B, 3, 0), ...range(A, 3, 0)], range(B, 11, 4)];
  }
}

export function pack(layout: Layout, a: number, b: number): Byte[] {
  return plan(layout).map((srcs) => {
    const bits: Bit[] = srcs.map((s) => ({ ...s, value: s.pixel ? ((((s.pixel === "A" ? a : b) >> s.bit) & 1) as 0 | 1) : 0 }));
    return { bits, value: bits.reduce((v, x) => v * 2 + x.value, 0) };
  });
}

/** Value of pixel A as a 16-bit little-endian word (16-bit layouts only), and what an 8-bit load (>> 8) shows. */
export function asStored16(layout: "lsb16" | "msb16", a: number): { word: number; eightBit: number } {
  const word = layout === "lsb16" ? a : a << 4;
  return { word, eightBit: word >> 8 };
}

export const hex = (v: number, digits = 2) => "0x" + v.toString(16).toUpperCase().padStart(digits, "0");
