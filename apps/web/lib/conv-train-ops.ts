/** Module 51.3: training a single 3x3 convolution kernel from scratch by gradient descent, to
 *  classify vertical- vs horizontal-edge patches -- mirrors the chapter's own NumPy code
 *  exactly (conv as correlation, |.|, global average pool, one output neuron). Unit-tested,
 *  including a finite-difference gradient check matching the chapter's own. */
import { gauss, rng } from "./sensor-ops.ts";

export type Patch = { grid: number[][]; label: number };

/** A size x size patch: label 1 = vertical edge (left dark/right bright), label 0 = horizontal edge (top dark/bottom bright). */
export function makePatch(vertical: boolean, r: () => number, size = 10, noise = 0.15): Patch {
  const half = size / 2;
  const grid = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => {
    const base = vertical ? (j >= half ? 1 : 0) : (i >= half ? 1 : 0);
    return base + noise * gauss(r);
  }));
  return { grid, label: vertical ? 1 : 0 };
}
export function makeDataset(seed: number, n = 40, size = 10, noise = 0.15): Patch[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => makePatch(i % 2 === 0, r, size, noise));
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Valid-mode 2-D correlation (deep learning's "Conv", no kernel flip): output is (H-kh+1) x (W-kw+1). */
export function conv2dValid(img: number[][], k: number[][]): number[][] {
  const H = img.length, W = img[0].length, kh = k.length, kw = k[0].length;
  const oh = H - kh + 1, ow = W - kw + 1;
  const out: number[][] = [];
  for (let i = 0; i < oh; i++) {
    const row: number[] = [];
    for (let j = 0; j < ow; j++) {
      let s = 0;
      for (let a = 0; a < kh; a++) for (let b = 0; b < kw; b++) s += img[i + a][j + b] * k[a][b];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

export type ConvModel = { k: number[][]; bConv: number; wOut: number; bOut: number };
export function convModelCreate(seed: number): ConvModel {
  const r = rng(seed);
  return { k: Array.from({ length: 3 }, () => [0.3 * gauss(r), 0.3 * gauss(r), 0.3 * gauss(r)]), bConv: 0, wOut: 0.3 * gauss(r), bOut: 0 };
}

function forwardOne(m: ConvModel, grid: number[][]) {
  const convOut = conv2dValid(grid, m.k).map((row) => row.map((v) => v + m.bConv));
  const mag = convOut.map((row) => row.map(Math.abs));
  let pooled = 0, count = 0;
  for (const row of mag) for (const v of row) { pooled += v; count++; }
  pooled /= count;
  const z = m.wOut * pooled + m.bOut;
  return { convOut, mag, pooled, p: sigmoid(z) };
}

export function convForward(m: ConvModel, patches: Patch[]): number[] {
  return patches.map((pt) => forwardOne(m, pt.grid).p);
}
export function convAccuracy(p: number[], patches: Patch[]): number {
  let c = 0;
  for (let i = 0; i < p.length; i++) if ((p[i] > 0.5 ? 1 : 0) === patches[i].label) c++;
  return c / p.length;
}
export function bceLoss(p: number[], patches: Patch[]): number {
  const eps = 1e-9;
  let s = 0;
  for (let i = 0; i < p.length; i++) { const y = patches[i].label; s += y * Math.log(p[i] + eps) + (1 - y) * Math.log(1 - p[i] + eps); }
  return -s / p.length;
}

/** One gradient-descent step, by the chapter's own hand-derived conv backward pass (dL/dkernel is the correlation of the input with the output gradient). */
export function convStep(m: ConvModel, patches: Patch[], lr: number): { model: ConvModel; loss: number } {
  const kh = m.k.length, kw = m.k[0].length;
  const gradK = Array.from({ length: kh }, () => new Array(kw).fill(0));
  let gradBConv = 0, gradWOut = 0, gradBOut = 0;
  const n = patches.length;
  const ps: number[] = [];
  for (const pt of patches) {
    const { convOut, mag, pooled, p } = forwardOne(m, pt.grid);
    ps.push(p);
    const dz = p - pt.label;
    gradWOut += dz * pooled;
    gradBOut += dz;
    const dPooled = dz * m.wOut;
    const count = mag.length * mag[0].length;
    for (let i = 0; i < convOut.length; i++) for (let j = 0; j < convOut[0].length; j++) {
      const dMag = dPooled / count;
      const dConv = dMag * Math.sign(convOut[i][j]);
      gradBConv += dConv;
      for (let a = 0; a < kh; a++) for (let b = 0; b < kw; b++) gradK[a][b] += pt.grid[i + a][j + b] * dConv;
    }
  }
  const k = m.k.map((row, a) => row.map((v, b) => v - (lr * gradK[a][b]) / n));
  return { model: { k, bConv: m.bConv - (lr * gradBConv) / n, wOut: m.wOut - (lr * gradWOut) / n, bOut: m.bOut - (lr * gradBOut) / n }, loss: bceLoss(ps, patches) };
}
