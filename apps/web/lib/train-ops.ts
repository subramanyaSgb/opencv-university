/** Module 51.2: training by gradient descent, pure logic, unit-tested. Mirrors the chapter's
 *  own NumPy code: logistic regression (no hidden layer) and a small 2-layer (tanh -> sigmoid)
 *  network, trained by hand-derived backprop, with a finite-difference gradient check. */
import { gauss, rng } from "./sensor-ops.ts";

export type Point = { x: number; y: number; label: number };

/** Two Gaussian blobs, linearly separable. */
export function blobsDataset(seed: number, n = 60): Point[] {
  const r = rng(seed);
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const label = i < n / 2 ? 0 : 1;
    const [cx, cy] = label === 0 ? [-1.5, -1.0] : [1.5, 1.0];
    pts.push({ x: cx + 0.8 * gauss(r), y: cy + 0.8 * gauss(r), label });
  }
  return pts;
}

/** Four Gaussian blobs in an XOR arrangement: diagonal corners share a label, so no single straight line separates the two classes. */
export function xorDataset(seed: number, n = 80): Point[] {
  const r = rng(seed);
  const centers: [number, number, number][] = [[-1.5, -1.5, 0], [1.5, 1.5, 0], [-1.5, 1.5, 1], [1.5, -1.5, 1]];
  const pts: Point[] = [];
  const per = Math.floor(n / 4);
  for (const [cx, cy, label] of centers) for (let i = 0; i < per; i++) pts.push({ x: cx + 0.5 * gauss(r), y: cy + 0.5 * gauss(r), label });
  return pts;
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Binary cross-entropy loss, averaged over samples. */
export function bceLoss(p: number[], y: number[]): number {
  const eps = 1e-9;
  let s = 0;
  for (let i = 0; i < p.length; i++) s += y[i] * Math.log(p[i] + eps) + (1 - y[i]) * Math.log(1 - p[i] + eps);
  return -s / p.length;
}

export type LogReg = { w: [number, number]; b: number };
export function logregForward(m: LogReg, pts: Point[]) {
  return pts.map((pt) => sigmoid(m.w[0] * pt.x + m.w[1] * pt.y + m.b));
}
/** One gradient-descent step on a logistic-regression neuron (no hidden layer). Mutates nothing; returns the updated model and loss before the step. */
export function logregStep(m: LogReg, pts: Point[], lr: number): { model: LogReg; loss: number } {
  const p = logregForward(m, pts);
  const y = pts.map((pt) => pt.label);
  const loss = bceLoss(p, y);
  const n = pts.length;
  let gw0 = 0, gw1 = 0, gb = 0;
  for (let i = 0; i < n; i++) {
    const gz = (p[i] - y[i]) / n;
    gw0 += gz * pts[i].x; gw1 += gz * pts[i].y; gb += gz;
  }
  return { model: { w: [m.w[0] - lr * gw0, m.w[1] - lr * gw1], b: m.b - lr * gb }, loss };
}

export type MLP = { Wi: number[][]; bi: number[]; Wo: number[]; bo: number };
export function mlpCreate(hidden: number, seed: number): MLP {
  const r = rng(seed);
  const Wi = Array.from({ length: 2 }, () => Array.from({ length: hidden }, () => 0.5 * gauss(r)));
  const Wo = Array.from({ length: hidden }, () => 0.5 * gauss(r));
  return { Wi, bi: new Array(hidden).fill(0), Wo, bo: 0 };
}
function mlpForwardFull(m: MLP, pt: { x: number; y: number }) {
  const h = m.Wi[0].length;
  const z1 = new Array(h), a1 = new Array(h);
  for (let j = 0; j < h; j++) { z1[j] = pt.x * m.Wi[0][j] + pt.y * m.Wi[1][j] + m.bi[j]; a1[j] = Math.tanh(z1[j]); }
  let z2 = m.bo;
  for (let j = 0; j < h; j++) z2 += a1[j] * m.Wo[j];
  return { a1, p: sigmoid(z2) };
}
export function mlpForward(m: MLP, pts: Point[]): number[] {
  return pts.map((pt) => mlpForwardFull(m, pt).p);
}
/** One gradient-descent step on a 2-layer (tanh hidden -> sigmoid output) network, by hand-derived backprop. */
export function mlpStep(m: MLP, pts: Point[], lr: number): { model: MLP; loss: number } {
  const n = pts.length, h = m.Wi[0].length;
  const y = pts.map((pt) => pt.label);
  const a1s: number[][] = [], ps: number[] = [];
  for (const pt of pts) { const { a1, p } = mlpForwardFull(m, pt); a1s.push(a1); ps.push(p); }
  const loss = bceLoss(ps, y);
  const gWo = new Array(h).fill(0);
  let gbo = 0;
  const gWi = Array.from({ length: 2 }, () => new Array(h).fill(0));
  const gbi = new Array(h).fill(0);
  for (let i = 0; i < n; i++) {
    const gz2 = (ps[i] - y[i]) / n;
    gbo += gz2;
    for (let j = 0; j < h; j++) {
      gWo[j] += gz2 * a1s[i][j];
      const ga1 = gz2 * m.Wo[j];
      const gz1 = ga1 * (1 - a1s[i][j] * a1s[i][j]);
      gWi[0][j] += gz1 * pts[i].x;
      gWi[1][j] += gz1 * pts[i].y;
      gbi[j] += gz1;
    }
  }
  const Wi = m.Wi.map((row, k) => row.map((v, j) => v - lr * gWi[k][j]));
  const bi = m.bi.map((v, j) => v - lr * gbi[j]);
  const Wo = m.Wo.map((v, j) => v - lr * gWo[j]);
  const bo = m.bo - lr * gbo;
  return { model: { Wi, bi, Wo, bo }, loss };
}

export function accuracy(p: number[], pts: Point[]): number {
  let c = 0;
  for (let i = 0; i < p.length; i++) if ((p[i] > 0.5 ? 1 : 0) === pts[i].label) c++;
  return c / p.length;
}
