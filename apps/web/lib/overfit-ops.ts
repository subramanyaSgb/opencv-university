/** Module 51.5: overfitting, early stopping and L2 regularization for a small MLP. Mirrors
 *  the chapter's own NumPy experiment: an oversized hidden layer trained on a small, noisy
 *  training set, tracked against a clean, held-out validation set. Unit-tested. */
import { gauss, rng } from "./sensor-ops.ts";
import { type Point, bceLoss as bce, sigmoid } from "./train-ops.ts";

/** Two overlapping Gaussian blobs (real Bayes error > 0); optionally flips a fraction of labels (label noise). */
export function overlapDataset(seed: number, n: number, labelNoise = 0): Point[] {
  const r = rng(seed);
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const label = i < n / 2 ? 0 : 1;
    const [cx, cy] = label === 0 ? [-0.8, -0.8] : [0.8, 0.8];
    let finalLabel = label;
    if (r() < labelNoise) finalLabel = 1 - label;
    pts.push({ x: cx + 1.2 * gauss(r), y: cy + 1.2 * gauss(r), label: finalLabel });
  }
  return pts;
}

export type OverfitModel = { Wi: number[][]; bi: number[]; Wo: number[]; bo: number };
export function overfitModelCreate(hidden: number, seed: number): OverfitModel {
  const r = rng(seed);
  const Wi = Array.from({ length: 2 }, () => Array.from({ length: hidden }, () => 0.5 * gauss(r)));
  const Wo = Array.from({ length: hidden }, () => 0.5 * gauss(r));
  return { Wi, bi: new Array(hidden).fill(0), Wo, bo: 0 };
}

function forwardOne(m: OverfitModel, pt: { x: number; y: number }) {
  const h = m.Wi[0].length;
  const a1 = new Array(h);
  for (let j = 0; j < h; j++) a1[j] = Math.tanh(pt.x * m.Wi[0][j] + pt.y * m.Wi[1][j] + m.bi[j]);
  let z2 = m.bo;
  for (let j = 0; j < h; j++) z2 += a1[j] * m.Wo[j];
  return { a1, p: sigmoid(z2) };
}
export function overfitForward(m: OverfitModel, pts: Point[]): number[] {
  return pts.map((pt) => forwardOne(m, pt).p);
}
export function overfitLoss(m: OverfitModel, pts: Point[]): number {
  return bce(overfitForward(m, pts), pts.map((p) => p.label));
}
export function overfitAccuracy(m: OverfitModel, pts: Point[]): number {
  const p = overfitForward(m, pts);
  let c = 0;
  for (let i = 0; i < p.length; i++) if ((p[i] > 0.5 ? 1 : 0) === pts[i].label) c++;
  return c / p.length;
}

/** One gradient-descent step with L2 weight decay (0 = no regularization), by hand-derived backprop. */
export function overfitStep(m: OverfitModel, pts: Point[], lr: number, l2: number): OverfitModel {
  const n = pts.length, h = m.Wi[0].length;
  const y = pts.map((pt) => pt.label);
  const a1s: number[][] = [], ps: number[] = [];
  for (const pt of pts) { const { a1, p } = forwardOne(m, pt); a1s.push(a1); ps.push(p); }
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
  const Wi = m.Wi.map((row, k) => row.map((v, j) => v - lr * (gWi[k][j] + l2 * v)));
  const bi = m.bi.map((v, j) => v - lr * gbi[j]);
  const Wo = m.Wo.map((v, j) => v - lr * (gWo[j] + l2 * v));
  const bo = m.bo - lr * gbo;
  return { Wi, bi, Wo, bo };
}
