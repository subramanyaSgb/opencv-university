/** Histogram operations for Module 12, following OpenCV's 8-bit implementations. Images are row-major Uint8 arrays. */
export function hist(img: ArrayLike<number>) {
  const h = new Array(256).fill(0);
  for (let i = 0; i < img.length; i++) h[img[i]]++;
  return h;
}

export function cdf(h: number[]) {
  const c: number[] = [];
  h.reduce((s, v, i) => (c[i] = s + v), 0);
  return c;
}

/** cv2.equalizeHist: lut[v] = round((cdf[v] − cdf_min) · 255 / (N − cdf_min)). */
export function equalizeLut(img: ArrayLike<number>) {
  const h = hist(img), c = cdf(h), n = img.length;
  const first = h.find((v) => v > 0) ?? 0;
  return c.map((v) => Math.min(255, Math.max(0, Math.round(((v - first) * 255) / Math.max(1, n - first)))));
}

/** cv2.createCLAHE(clipLimit, (tx, ty)).apply for images whose size is divisible by the tile grid. */
export function clahe(img: ArrayLike<number>, w: number, h: number, clipLimit = 2, tx = 8, ty = 8) {
  const tw = Math.floor(w / tx), th = Math.floor(h / ty), area = tw * th;
  const limit = clipLimit > 0 ? Math.max(1, Math.floor((clipLimit * area) / 256)) : 0;
  const luts: number[][] = [];
  for (let j = 0; j < ty; j++) for (let i = 0; i < tx; i++) {
    const hh = new Array(256).fill(0);
    for (let y = j * th; y < (j + 1) * th; y++) for (let x = i * tw; x < (i + 1) * tw; x++) hh[img[y * w + x]]++;
    if (limit > 0) {
      let clipped = 0;
      for (let k = 0; k < 256; k++) if (hh[k] > limit) { clipped += hh[k] - limit; hh[k] = limit; }
      const batch = Math.floor(clipped / 256);
      let residual = clipped - batch * 256;
      for (let k = 0; k < 256; k++) hh[k] += batch;
      if (residual > 0) {
        const step = Math.max(Math.floor(256 / residual), 1);
        for (let k = 0; k < 256 && residual > 0; k += step, residual--) hh[k]++;
      }
    }
    const scale = 255 / area;
    let s = 0;
    luts.push(hh.map((v) => { s += v; return Math.min(255, Math.max(0, Math.round(s * scale))); }));
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const tyf = y / th - 0.5;
    let ty1 = Math.floor(tyf), ty2 = ty1 + 1;
    const ya = tyf - ty1;
    ty1 = Math.max(ty1, 0); ty2 = Math.min(ty2, ty - 1);
    for (let x = 0; x < w; x++) {
      const txf = x / tw - 0.5;
      let tx1 = Math.floor(txf), tx2 = tx1 + 1;
      const xa = txf - tx1;
      tx1 = Math.max(tx1, 0); tx2 = Math.min(tx2, tx - 1);
      const v = img[y * w + x];
      const r = (luts[ty1 * tx + tx1][v] * (1 - xa) + luts[ty1 * tx + tx2][v] * xa) * (1 - ya)
        + (luts[ty2 * tx + tx1][v] * (1 - xa) + luts[ty2 * tx + tx2][v] * xa) * ya;
      out[y * w + x] = Math.min(255, Math.max(0, Math.round(r)));
    }
  }
  return out;
}

/** Histogram matching: map each value so that the CDF follows the reference CDF (monotone lookup). */
export function matchLut(src: ArrayLike<number>, ref: ArrayLike<number>) {
  const cs = cdf(hist(src)).map((v) => v / src.length), cr = cdf(hist(ref)).map((v) => v / ref.length);
  return cs.map((p) => { let k = 0; while (k < 255 && cr[k] < p) k++; return k; });
}
