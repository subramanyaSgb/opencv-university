"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ConvModel, type Patch, bceLoss, convAccuracy, convForward, convModelCreate, convStep, makeDataset } from "@/lib/conv-train-ops";

const CELL = 18;

function PatchView({ p }: { p: Patch }) {
  const n = p.grid.length;
  return (
    <svg viewBox={`0 0 ${n * CELL} ${n * CELL}`} width={n * CELL} height={n * CELL} role="img" aria-label={p.label ? "vertical edge patch" : "horizontal edge patch"}>
      {p.grid.map((row, i) => row.map((v, j) => {
        const g = Math.max(0, Math.min(255, Math.round(v * 255)));
        return <rect key={`${i}-${j}`} x={j * CELL} y={i * CELL} width={CELL} height={CELL} fill={`rgb(${g},${g},${g})`} />;
      }))}
    </svg>
  );
}

function KernelView({ k }: { k: number[][] }) {
  const flat = k.flat();
  const maxAbs = Math.max(0.1, ...flat.map(Math.abs));
  return (
    <svg viewBox="0 0 90 90" width={90} height={90} role="img" aria-label="Learned 3x3 kernel">
      {k.map((row, i) => row.map((v, j) => {
        const t = v / maxAbs;
        const fill = t >= 0 ? `rgba(31,111,235,${Math.min(1, Math.abs(t))})` : `rgba(207,34,46,${Math.min(1, Math.abs(t))})`;
        return (
          <g key={`${i}-${j}`}>
            <rect x={j * 30} y={i * 30} width={30} height={30} fill={fill} stroke="var(--line)" />
            <text x={j * 30 + 15} y={i * 30 + 18} textAnchor="middle" fontSize={9} fill="var(--fg)">{v.toFixed(2)}</text>
          </g>
        );
      }))}
    </svg>
  );
}

/** ConvTrainLab (51.3): train a single 3x3 convolution kernel, from a random start, by real
 *  gradient descent, to classify vertical- vs horizontal-edge patches -- live, matching the
 *  chapter's own NumPy training run. Shows the kernel's values changing from random noise into
 *  a structure sensitive to one direction and not the other. */
export function ConvTrainLab({ caption }: { caption?: string }) {
  const [playing, setPlaying] = useState(false);
  const [iter, setIter] = useState(0);
  const [loss, setLoss] = useState(0.69);
  const patches = useMemo(() => makeDataset(11, 40), []);
  const sample = useMemo(() => [patches[0], patches[1]], [patches]);
  const modelRef = useRef<ConvModel>(convModelCreate(3));
  const [kernel, setKernel] = useState<number[][]>(modelRef.current.k);

  function reset() {
    modelRef.current = convModelCreate(3);
    setKernel(modelRef.current.k);
    setIter(0);
    setLoss(bceLoss(convForward(modelRef.current, patches), patches));
  }
  useEffect(reset, []);

  function step(times: number) {
    for (let i = 0; i < times; i++) {
      const r = convStep(modelRef.current, patches, 0.3);
      modelRef.current = r.model;
      setLoss(r.loss);
    }
    setKernel(modelRef.current.k.map((row) => row.slice()));
    setIter((v) => v + times);
  }

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => step(3), 100);
    return () => clearInterval(id);
  }, [playing]);

  const acc = useMemo(() => convAccuracy(convForward(modelRef.current, patches), patches), [iter, loss]);

  return (
    <figure className="fig convtrainlab">
      <div role="group" aria-label="Training controls" style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" onClick={() => setPlaying((v) => !v)} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>{playing ? "Pause" : "Train"}</button>
        <button type="button" onClick={() => step(1)} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>Step ×1</button>
        <button type="button" onClick={reset} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>Reset (new random kernel)</button>
      </div>
      <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div className="vis-title">Learned kernel</div>
          <KernelView k={kernel} />
        </div>
        <div>
          <div className="vis-title">vertical-edge patch</div>
          <PatchView p={sample[0]} />
        </div>
        <div>
          <div className="vis-title">horizontal-edge patch</div>
          <PatchView p={sample[1]} />
        </div>
      </div>
      <ul className="ap-stats">
        <li><span>Iteration</span><strong>{iter}</strong></li>
        <li><span>Loss</span><strong>{loss.toFixed(4)}</strong></li>
        <li><span>Accuracy</span><strong>{(acc * 100).toFixed(0)}%</strong></li>
      </ul>
      <div className="pg-readout"><span>No one ever told this kernel what an edge looks like. Train it, and watch its 9 numbers move from random noise toward a structure that responds strongly to one direction and weakly to the other.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
