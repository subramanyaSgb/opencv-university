/** Module 13: global and local thresholds as OpenCV computes them, plus entropy, Niblack/Sauvola, hysteresis and quality metrics. */

export function histogram(img: ArrayLike<number>) {
  const h = new Array<number>(256).fill(0);
  for (let i = 0; i < img.length; i++) h[img[i]]++;
  return h;
}

/** cv2.threshold(..., THRESH_OTSU): the t maximising the between-class variance (OpenCV's loop, first maximum). */
export function otsu(h: number[]) {
  const N = h.reduce((a, b) => a + b, 0);
  let mu = 0; for (let i = 0; i < 256; i++) mu += i * h[i];
  mu /= N;
  let q1 = 0, mu1 = 0, best = 0, t = 0;
  const EPS = 1.1920929e-7;
  for (let i = 0; i < 256; i++) {
    const p = h[i] / N;
    mu1 *= q1; q1 += p;
    const q2 = 1 - q1;
    if (Math.min(q1, q2) < EPS || Math.max(q1, q2) > 1 - EPS) continue;
    mu1 = (mu1 + i * p) / q1;
    const mu2 = (mu - q1 * mu1) / q2, s = q1 * q2 * (mu1 - mu2) ** 2;
    if (s > best) { best = s; t = i; }
  }
  return t;
}

/** cv2.threshold(..., THRESH_TRIANGLE) (Zack et al. 1977), following OpenCV's implementation. */
export function triangle(hIn: number[]) {
  let h = hIn.slice(), left = 0, right = 0, maxInd = 0, max = 0;
  for (let i = 0; i < 256; i++) if (h[i] > 0) { left = i; break; }
  if (left > 0) left--;
  for (let i = 255; i > 0; i--) if (h[i] > 0) { right = i; break; }
  if (right < 255) right++;
  for (let i = 0; i < 256; i++) if (h[i] > max) { max = h[i]; maxInd = i; }
  let flipped = false;
  if (maxInd - left < right - maxInd) { flipped = true; h = h.reverse(); left = 255 - right; maxInd = 255 - maxInd; }
  let t = left, dist = 0;
  const a = max, b = left - maxInd;
  for (let i = left + 1; i <= maxInd; i++) { const d = a * i + b * h[i]; if (d > dist) { dist = d; t = i; } }
  t--;
  return flipped ? 255 - t : t;
}

/** Kapur, Sahoo & Wong (1985) maximum-entropy threshold: t maximising H(0..t) + H(t+1..255). */
export function kapur(h: number[]) {
  const N = h.reduce((a, b) => a + b, 0), p = h.map((v) => v / N);
  let best = -Infinity, t = 0, P = 0;
  for (let k = 0; k < 255; k++) {
    P += p[k];
    if (P <= 0 || P >= 1) continue;
    let hb = 0, hf = 0;
    for (let i = 0; i <= k; i++) if (p[i] > 0) hb -= (p[i] / P) * Math.log(p[i] / P);
    for (let i = k + 1; i < 256; i++) if (p[i] > 0) hf -= (p[i] / (1 - P)) * Math.log(p[i] / (1 - P));
    if (hb + hf > best) { best = hb + hf; t = k; }
  }
  return t;
}

/** Local mean and standard deviation over a (2r+1)² window, border replicated as in cv2.boxFilter(..., BORDER_REPLICATE). */
export function localStats(img: ArrayLike<number>, w: number, hgt: number, r: number) {
  const PW = w + 2 * r, PH = hgt + 2 * r, W1 = PW + 1;
  const S = new Float64Array(W1 * (PH + 1)), S2 = new Float64Array(W1 * (PH + 1));
  for (let y = 0; y < PH; y++) {
    const sy = Math.min(hgt - 1, Math.max(0, y - r));
    let row = 0, row2 = 0;
    for (let x = 0; x < PW; x++) {
      const v = img[sy * w + Math.min(w - 1, Math.max(0, x - r))]; row += v; row2 += v * v;
      S[(y + 1) * W1 + x + 1] = S[y * W1 + x + 1] + row; S2[(y + 1) * W1 + x + 1] = S2[y * W1 + x + 1] + row2;
    }
  }
  const mean = new Float64Array(w * hgt), std = new Float64Array(w * hgt), n = (2 * r + 1) ** 2;
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
    const y1 = y + 2 * r + 1, x1 = x + 2 * r + 1; // window rows y..y+2r, cols x..x+2r in padded coordinates
    const s = S[y1 * W1 + x1] - S[y * W1 + x1] - S[y1 * W1 + x] + S[y * W1 + x];
    const s2 = S2[y1 * W1 + x1] - S2[y * W1 + x1] - S2[y1 * W1 + x] + S2[y * W1 + x];
    const m = s / n;
    mean[y * w + x] = m; std[y * w + x] = Math.sqrt(Math.max(0, s2 / n - m * m));
  }
  return { mean, std };
}

/** Separable Gaussian blur (float), OpenCV's sigma rule for sigma = 0, border replicated. */
export function gaussBlur(img: ArrayLike<number>, w: number, hgt: number, ksize: number) {
  const sigma = 0.3 * ((ksize - 1) * 0.5 - 1) + 0.8, r = (ksize - 1) / 2;
  const k = Array.from({ length: ksize }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const ks = k.reduce((a, b) => a + b, 0); for (let i = 0; i < ksize; i++) k[i] /= ks;
  const tmp = new Float64Array(w * hgt), out = new Float64Array(w * hgt);
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = 0; i < ksize; i++) s += k[i] * img[y * w + Math.min(w - 1, Math.max(0, x + i - r))]; tmp[y * w + x] = s; }
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = 0; i < ksize; i++) s += k[i] * tmp[Math.min(hgt - 1, Math.max(0, y + i - r)) * w + x]; out[y * w + x] = s; }
  return out;
}

export type Method = "manual" | "otsu" | "triangle" | "kapur" | "mean" | "gauss" | "niblack" | "sauvola" | "hysteresis";

/** Object mask (1 = object). dark = objects darker than the background (THRESH_BINARY_INV logic). */
export function segment(img: ArrayLike<number>, w: number, hgt: number, m: Method, o: { t?: number; dark?: boolean; block?: number; C?: number; k?: number; R?: number; tw?: number; ts?: number }) {
  const n = img.length, out = new Uint8Array(n), dark = o.dark ?? true;
  const glob = (t: number) => { for (let i = 0; i < n; i++) out[i] = (dark ? img[i] <= t : img[i] > t) ? 1 : 0; return { mask: out, t }; };
  if (m === "manual") return glob(o.t ?? 128);
  if (m === "otsu") return glob(otsu(histogram(img)));
  if (m === "triangle") return glob(triangle(histogram(img)));
  if (m === "kapur") return glob(kapur(histogram(img)));
  const block = o.block ?? 25, r = (block - 1) / 2;
  if (m === "mean" || m === "gauss") {
    const C = o.C ?? 10;
    const mean = m === "mean" ? localStats(img, w, hgt, r).mean : gaussBlur(img, w, hgt, block);
    // OpenCV: object (INV) where src - round(mean) <= -C  ⇔  src <= mean - C
    for (let i = 0; i < n; i++) { const d = img[i] - Math.round(mean[i]); out[i] = (dark ? d <= -C : d > C) ? 1 : 0; }
    return { mask: out, t: NaN };
  }
  if (m === "niblack" || m === "sauvola") {
    const { mean, std } = localStats(img, w, hgt, r), k = o.k ?? (m === "niblack" ? -0.2 : 0.2), R = o.R ?? 128;
    for (let i = 0; i < n; i++) {
      const T = m === "niblack" ? mean[i] + k * std[i] : mean[i] * (1 + k * (std[i] / R - 1));
      out[i] = (dark ? img[i] <= T : img[i] > T) ? 1 : 0;
    }
    return { mask: out, t: NaN };
  }
  // hysteresis: strong = beyond ts, weak = beyond tw; keep weak pixels 8-connected to a strong one
  const tw = o.tw ?? 100, ts = o.ts ?? 60;
  const strong = (v: number) => (dark ? v <= ts : v > ts), weak = (v: number) => (dark ? v <= tw : v > tw);
  const stack: number[] = [];
  for (let i = 0; i < n; i++) if (strong(img[i])) { out[i] = 1; stack.push(i); }
  while (stack.length) {
    const i = stack.pop()!, x = i % w, y = (i - x) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= hgt) continue;
      const j = yy * w + xx;
      if (!out[j] && weak(img[j])) { out[j] = 1; stack.push(j); }
    }
  }
  return { mask: out, t: NaN };
}

/** Pixel-level quality against a ground-truth mask (both 0/1 or 0/255). */
export function metrics(mask: ArrayLike<number>, gt: ArrayLike<number>) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < mask.length; i++) { const m = mask[i] > 0, g = gt[i] > 0; if (m && g) tp++; else if (m) fp++; else if (g) fn++; else tn++; }
  const precision = tp / Math.max(tp + fp, 1), recall = tp / Math.max(tp + fn, 1);
  return { tp, fp, fn, tn, precision, recall, f1: (2 * tp) / Math.max(2 * tp + fp + fn, 1), iou: tp / Math.max(tp + fp + fn, 1) };
}
