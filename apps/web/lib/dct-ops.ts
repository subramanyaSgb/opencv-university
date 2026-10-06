// 8×8 DCT, JPEG quantization tables and zigzag order for DctLab and DctBasis (Chapter 4.3). Unit-tested.

export type Block = number[][];

/** Standard luminance quantization table, ITU-T T.81 Annex K, Table K.1. */
export const LUMA_Q: Block = [
  [16, 11, 10, 16, 24, 40, 51, 61], [12, 12, 14, 19, 26, 58, 60, 55], [14, 13, 16, 24, 40, 57, 69, 56], [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77], [24, 35, 55, 64, 81, 104, 113, 92], [49, 64, 78, 87, 103, 121, 120, 101], [72, 92, 95, 98, 112, 100, 103, 99],
];

const C = (u: number) => (u === 0 ? Math.SQRT1_2 : 1);

/** Orthonormal 2-D DCT-II of an 8×8 block (same as JPEG's FDCT and cv2.dct). */
export function dct8(b: Block): Block {
  const out: Block = [];
  for (let u = 0; u < 8; u++) {
    out.push([]);
    for (let v = 0; v < 8; v++) {
      let s = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++)
        s += b[y][x] * Math.cos(((2 * y + 1) * u * Math.PI) / 16) * Math.cos(((2 * x + 1) * v * Math.PI) / 16);
      out[u].push(0.25 * C(u) * C(v) * s);
    }
  }
  return out;
}

/** Inverse of dct8. */
export function idct8(F: Block): Block {
  const out: Block = [];
  for (let y = 0; y < 8; y++) {
    out.push([]);
    for (let x = 0; x < 8; x++) {
      let s = 0;
      for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++)
        s += C(u) * C(v) * F[u][v] * Math.cos(((2 * y + 1) * u * Math.PI) / 16) * Math.cos(((2 * x + 1) * v * Math.PI) / 16);
      out[y].push(0.25 * s);
    }
  }
  return out;
}

/** libjpeg (IJG) quality scaling of a base table: quality 1–100. */
export function qtable(quality: number, base: Block = LUMA_Q): Block {
  const q = Math.min(100, Math.max(1, Math.round(quality)));
  const s = q < 50 ? Math.floor(5000 / q) : 200 - 2 * q;
  return base.map((row) => row.map((t) => Math.min(255, Math.max(1, Math.floor((t * s + 50) / 100)))));
}

/** JavaScript Math.round rounds .5 up; NumPy rounds half to even. Use half-to-even to match the course code. */
export function roundHalfEven(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

/** Full JPEG round trip of one block: level shift, DCT, quantize, dequantize, IDCT, round, clip. */
export function jpegBlock(block: Block, quality: number) {
  const Q = qtable(quality);
  const coef = dct8(block.map((r) => r.map((v) => v - 128)));
  const q = coef.map((r, u) => r.map((c, v) => roundHalfEven(c / Q[u][v]) + 0));
  const rec = idct8(q.map((r, u) => r.map((c, v) => c * Q[u][v]))).map((r) => r.map((v) => Math.min(255, Math.max(0, roundHalfEven(v + 128)))));
  const nonzero = q.flat().filter((v) => v !== 0).length;
  const maxErr = Math.max(...rec.flat().map((v, i) => Math.abs(v - block[Math.floor(i / 8)][i % 8])));
  return { Q, coef, q, rec, nonzero, maxErr };
}

/** JPEG zigzag order as [row, col] pairs. */
export const ZIGZAG: [number, number][] = (() => {
  const p: [number, number][] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) p.push([r, c]);
  return p.sort((a, b) => {
    const sa = a[0] + a[1], sb = b[0] + b[1];
    if (sa !== sb) return sa - sb;
    return sa % 2 ? a[0] - b[0] : a[1] - b[1];
  });
})();

/** Quantized coefficients in zigzag order up to the last non-zero one (the rest is "end of block"). */
export function zigzagRun(q: Block): number[] {
  const seq = ZIGZAG.map(([r, c]) => q[r][c]);
  let last = -1;
  seq.forEach((v, i) => { if (v !== 0) last = i; });
  return seq.slice(0, last + 1);
}

/** Basis image (u, v): what a coefficient of 1 at (u, v) adds to the block. */
export function basis(u: number, v: number): Block {
  const F: Block = Array.from({ length: 8 }, () => Array<number>(8).fill(0));
  F[u][v] = 1;
  return idct8(F);
}
