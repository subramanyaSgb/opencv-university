"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type OverfitModel, overfitAccuracy, overfitLoss, overfitModelCreate, overfitStep, overlapDataset } from "@/lib/overfit-ops";

const W = 420, H = 160;

/** OverfitLab (51.5): train an oversized hidden-layer network on a small, noisy training set,
 *  tracking train loss against a clean held-out validation set, live -- with an L2
 *  regularization toggle. Shows the classic overfitting curve (train loss keeps falling,
 *  validation loss stops falling and rises) and how regularization keeps the two together. */
export function OverfitLab({ caption }: { caption?: string }) {
  const [l2On, setL2On] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [iter, setIter] = useState(0);
  const train = useMemo(() => overlapDataset(50, 40, 0.1), []);
  const val = useMemo(() => overlapDataset(51, 300, 0), []);
  const modelRef = useRef<OverfitModel>(overfitModelCreate(60, 7));
  const [history, setHistory] = useState<{ trainLoss: number; valLoss: number }[]>([]);

  function reset() {
    modelRef.current = overfitModelCreate(60, 7);
    setIter(0);
    setHistory([{ trainLoss: overfitLoss(modelRef.current, train), valLoss: overfitLoss(modelRef.current, val) }]);
  }
  useEffect(reset, [l2On]);

  function step(times: number) {
    for (let i = 0; i < times; i++) modelRef.current = overfitStep(modelRef.current, train, 0.3, l2On ? 0.01 : 0);
    setIter((v) => v + times);
    setHistory((h) => [...h, { trainLoss: overfitLoss(modelRef.current, train), valLoss: overfitLoss(modelRef.current, val) }].slice(-200));
  }

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => step(20), 60);
    return () => clearInterval(id);
  }, [playing, l2On]);

  const trainAcc = useMemo(() => overfitAccuracy(modelRef.current, train), [iter]);
  const valAcc = useMemo(() => overfitAccuracy(modelRef.current, val), [iter]);
  const maxLoss = Math.max(1, ...history.map((h) => Math.max(h.trainLoss, h.valLoss)));
  const X = (i: number) => (i / Math.max(1, history.length - 1)) * W;
  const Y = (v: number) => H - 10 - (Math.min(v, maxLoss) / maxLoss) * (H - 20);

  return (
    <figure className="fig overfitlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>L2 regularization (weight decay)</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Regularization">
            <button type="button" role="radio" aria-checked={!l2On} className={!l2On ? "is-on" : ""} onClick={() => setL2On(false)}>Off</button>
            <button type="button" role="radio" aria-checked={l2On} className={l2On ? "is-on" : ""} onClick={() => setL2On(true)}>On</button>
          </div>
        </div>
        <div role="group" aria-label="Training controls" style={{ display: "flex", gap: "0.4rem" }}>
          <button type="button" onClick={() => setPlaying((v) => !v)} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>{playing ? "Pause" : "Train"}</button>
          <button type="button" onClick={() => step(20)} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>Step ×20</button>
          <button type="button" onClick={reset} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>Reset</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Train and validation loss over training">
        <polyline fill="none" stroke="#1f6feb" strokeWidth={2} points={history.map((h, i) => `${X(i)},${Y(h.trainLoss)}`).join(" ")} />
        <polyline fill="none" stroke="#cf222e" strokeWidth={2} points={history.map((h, i) => `${X(i)},${Y(h.valLoss)}`).join(" ")} />
        <text x={4} y={14} className="ov-t">loss over training (last 200 recorded steps)</text>
      </svg>
      <div className="gl-legend">
        <span><span className="by-k" style={{ background: "#1f6feb" }} /> train loss</span>
        <span><span className="by-k" style={{ background: "#cf222e" }} /> validation loss</span>
      </div>
      <ul className="ap-stats">
        <li><span>Iteration</span><strong>{iter}</strong></li>
        <li><span>Train accuracy</span><strong>{(trainAcc * 100).toFixed(0)}%</strong></li>
        <li><span>Validation accuracy</span><strong>{(valAcc * 100).toFixed(0)}%</strong></li>
      </ul>
      <div className="pg-readout"><span>With regularization off, keep training: train loss keeps falling while validation loss turns around and climbs -- the network is memorizing this particular noisy training set. Switch regularization on and reset: the two losses stay close together instead.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
