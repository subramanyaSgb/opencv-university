"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  accuracy, blobsDataset, logregForward, logregStep, mlpCreate, mlpForward, mlpStep, xorDataset,
  type LogReg, type MLP, type Point,
} from "@/lib/train-ops";

const RANGE = 3.2, W = 300, H = 300, GRID = 22, LR = 0.5;
const toPx = (v: number) => ((v + RANGE) / (2 * RANGE)) * W;

type Dataset = "blobs" | "xor";
type Arch = "logreg" | "mlp";

/** TrainLab (51.2): train, step by step, a logistic-regression neuron or a 2-layer (tanh ->
 *  sigmoid) network on a 2-D toy dataset, by the chapter's own hand-derived gradient descent.
 *  Shows the loss falling live and the decision regions forming -- including the real
 *  contrast the chapter verifies in NumPy: a single neuron cannot separate the XOR-like
 *  dataset no matter how long it trains, but the 2-layer network can. */
export function TrainLab({ caption }: { caption?: string }) {
  const [dataset, setDataset] = useState<Dataset>("xor");
  const [arch, setArch] = useState<Arch>("mlp");
  const [playing, setPlaying] = useState(false);
  const [iter, setIter] = useState(0);
  const [loss, setLoss] = useState(0.693);
  const pts = useMemo<Point[]>(() => (dataset === "blobs" ? blobsDataset(42) : xorDataset(5)), [dataset]);
  const modelRef = useRef<LogReg | MLP>(mlpCreate(6, 9));

  function reset() {
    modelRef.current = arch === "logreg" ? { w: [0, 0], b: 0 } : mlpCreate(6, 9);
    setIter(0);
    setLoss(0.693);
  }
  useEffect(reset, [dataset, arch]);

  function step(times = 1) {
    for (let i = 0; i < times; i++) {
      const r = arch === "logreg" ? logregStep(modelRef.current as LogReg, pts, LR) : mlpStep(modelRef.current as MLP, pts, LR);
      modelRef.current = r.model;
      setLoss(r.loss);
    }
    setIter((v) => v + times);
  }

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => step(5), 80);
    return () => clearInterval(id);
  }, [playing, arch, pts]);

  const forward = (p: Point[]) => (arch === "logreg" ? logregForward(modelRef.current as LogReg, p) : mlpForward(modelRef.current as MLP, p));
  const acc = useMemo(() => accuracy(forward(pts), pts), [pts, iter, loss]);

  const cells = useMemo(() => {
    const probePts: Point[] = [];
    for (let gy = 0; gy < GRID; gy++) for (let gx = 0; gx < GRID; gx++) {
      probePts.push({ x: -RANGE + (gx + 0.5) * (2 * RANGE) / GRID, y: -RANGE + (gy + 0.5) * (2 * RANGE) / GRID, label: 0 });
    }
    const p = forward(probePts);
    return probePts.map((pt, i) => ({ pt, p: p[i] }));
  }, [iter, loss, arch, dataset]);

  return (
    <figure className="fig trainlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Dataset</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Dataset">
            <button type="button" role="radio" aria-checked={dataset === "blobs"} className={dataset === "blobs" ? "is-on" : ""} onClick={() => setDataset("blobs")}>Linearly separable</button>
            <button type="button" role="radio" aria-checked={dataset === "xor"} className={dataset === "xor" ? "is-on" : ""} onClick={() => setDataset("xor")}>XOR-like</button>
          </div>
        </div>
        <div className="ctl ctl-full"><span>Network</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Architecture">
            <button type="button" role="radio" aria-checked={arch === "logreg"} className={arch === "logreg" ? "is-on" : ""} onClick={() => setArch("logreg")}>No hidden layer</button>
            <button type="button" role="radio" aria-checked={arch === "mlp"} className={arch === "mlp" ? "is-on" : ""} onClick={() => setArch("mlp")}>6-unit hidden layer</button>
          </div>
        </div>
        <div role="group" aria-label="Training controls" style={{ display: "flex", gap: "0.4rem" }}>
          <button type="button" onClick={() => setPlaying((v) => !v)} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>{playing ? "Pause" : "Train"}</button>
          <button type="button" onClick={() => step(1)} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>Step ×1</button>
          <button type="button" onClick={reset} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>Reset</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Decision regions and training data">
        {cells.map(({ pt, p }, i) => {
          const cw = W / GRID;
          return <rect key={i} x={toPx(pt.x) - cw / 2} y={toPx(pt.y) - cw / 2} width={cw} height={cw} fill={p > 0.5 ? "#cf222e" : "#1f6feb"} opacity={0.12 + 0.18 * Math.abs(p - 0.5) * 2} />;
        })}
        {pts.map((pt, i) => <circle key={i} cx={toPx(pt.x)} cy={toPx(pt.y)} r={4} fill={pt.label ? "#cf222e" : "#1f6feb"} stroke="var(--bg)" strokeWidth={1} />)}
      </svg>
      <ul className="ap-stats">
        <li><span>Iteration</span><strong>{iter}</strong></li>
        <li><span>Loss (binary cross-entropy)</span><strong>{loss.toFixed(4)}</strong></li>
        <li><span>Accuracy</span><strong>{(acc * 100).toFixed(0)}%</strong></li>
      </ul>
      <div className="pg-readout"><span>On the XOR-like dataset, train "No hidden layer" for as long as you like -- it settles near 50% (chance), exactly as the chapter's own NumPy result shows. Switch to the 6-unit hidden layer and train again: it reaches 100%.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
