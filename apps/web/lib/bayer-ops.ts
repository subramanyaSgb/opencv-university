// Bayer mosaic and simple bilinear demosaicing for BayerLab (Chapter 2.7). Unit-tested.
// Channels: 0 = R, 1 = G, 2 = B. Images are row-major arrays of [R, G, B].

export type Pattern = "RGGB" | "BGGR" | "GRBG" | "GBRG";
export type RGB = [number, number, number];

const CH: Record<string, number> = { R: 0, G: 1, B: 2 };

/** Which colour filter sits over pixel (r, c). The pattern names the top-left 2 × 2 block, row by row. */
export function channelAt(p: Pattern, r: number, c: number): number {
  return CH[p[(r % 2) * 2 + (c % 2)]];
}

/** What the sensor records: one value per pixel, the channel under its filter. */
export function mosaic(img: RGB[][], p: Pattern): number[][] {
  return img.map((row, r) => row.map((px, c) => px[channelAt(p, r, c)]));
}

/**
 * Bilinear demosaicing: each missing channel is the average of the same channel among the
 * 3 × 3 neighbours (edges reflected). The measured channel is kept as is.
 */
export function demosaic(m: number[][], p: Pattern): RGB[][] {
  const h = m.length, w = m[0].length;
  const ref = (i: number, n: number) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i);
  return m.map((row, r) =>
    row.map((v, c) => {
      const out: RGB = [0, 0, 0];
      const own = channelAt(p, r, c);
      for (let ch = 0; ch < 3; ch++) {
        if (ch === own) { out[ch] = v; continue; }
        let s = 0, n = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const rr = ref(r + dr, h), cc = ref(c + dc, w);
          if (channelAt(p, rr, cc) === ch) { s += m[rr][cc]; n++; }
        }
        out[ch] = Math.round(s / n);
      }
      return out;
    }),
  );
}
