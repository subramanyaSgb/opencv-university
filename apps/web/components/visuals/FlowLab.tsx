"use client";

import { useEffect, useState } from "react";

type Vec = [number, number, number, number];
type PanCase = { width: number; height: number; true_dx: number; true_dy: number; sparse: Vec[]; dense: Vec[]; lk_mean: [number, number]; farneback_mean_central: [number, number] };
type BallCase = { width: number; height: number; dense: Vec[] };
type Data = { cases: { pan: PanCase; ball: BallCase } };

const ARROW_SCALE = 6;

function Arrows({ vecs, color, scale = ARROW_SCALE }: { vecs: Vec[]; color: string; scale?: number }) {
  return (
    <>
      {vecs.map(([x, y, dx, dy], i) => {
        const ex = x + dx * scale, ey = y + dy * scale;
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth={1.5} />
            <circle cx={ex} cy={ey} r={1.5} fill={color} />
          </g>
        );
      })}
    </>
  );
}

/** FlowLab (Module 40.3): real cv2.calcOpticalFlowPyrLK (sparse) and calcOpticalFlowFarneback
 *  (dense) results, precomputed by scripts/gen_flow_data.py -- a clean whole-scene pan with
 *  known ground truth, and the real sample-ball-25fps.mp4 clip's frame 10->11. */
export function FlowLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [scene, setScene] = useState<"pan" | "ball">("pan");

  useEffect(() => {
    fetch("/data/flow-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const pan = data.cases.pan, ball = data.cases.ball;
  const current = scene === "pan" ? pan : ball;

  return (
    <figure className="fig flowlab">
      <div className="ctl ctl-full">
        <span>Scene</span>
        <div className="seg seg-small" role="radiogroup" aria-label="Scene">
          {([["pan", "Clean whole-scene pan (known truth)"], ["ball", "Real sample-ball clip"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={scene === k} className={scene === k ? "is-on" : ""} onClick={() => setScene(k)}>{l}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${current.width} ${current.height}`} className="cl-svg" role="img" aria-label="Optical flow arrows" style={{ maxWidth: 480 }}>
        <rect x={0} y={0} width={current.width} height={current.height} fill="var(--bg-sunk)" />
        <Arrows vecs={current.dense} color="#1f6feb" />
        {scene === "pan" && <Arrows vecs={pan.sparse} color="#cf222e" scale={ARROW_SCALE} />}
      </svg>
      <div className="gl-legend"><span className="by-k" style={{ background: "#1f6feb" }} /> dense (Farneback, sampled grid) {scene === "pan" && <><span className="by-k" style={{ background: "#cf222e" }} /> sparse (Lucas-Kanade, tracked corners)</>}</div>
      {scene === "pan" ? (
        <ul className="ap-stats">
          <li><span>True shift</span><strong>({pan.true_dx}, {pan.true_dy}) px</strong></li>
          <li><span>LK mean (sparse)</span><strong>({pan.lk_mean[0].toFixed(2)}, {pan.lk_mean[1].toFixed(2)})</strong><em>near-exact</em></li>
          <li><span>Farneback mean (dense, central)</span><strong>({pan.farneback_mean_central[0].toFixed(2)}, {pan.farneback_mean_central[1].toFixed(2)})</strong><em>real, measurable error</em></li>
        </ul>
      ) : (
        <div className="pg-readout"><span>Real Farneback flow between two real consecutive frames of the sample-ball clip: arrows near the ball point right, following its real motion; background arrows stay near zero.</span></div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
