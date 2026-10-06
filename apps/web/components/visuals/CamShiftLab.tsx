"use client";

import { useEffect, useState } from "react";

type Box = [number, number, number, number];
type Frame = { true: Box; meanshift: Box; camshift: Box };
type Data = { width: number; height: number; frames: Frame[] };

const SCALE = 2;

/** CamShiftLab (Module 40.4): real cv2.meanShift vs cv2.CamShift tracking boxes (precomputed
 *  by scripts/gen_camshift_data.py) on a synthetic growing, moving coloured object --
 *  meanShift's fixed-size window lags as the object grows; CamShift's adaptive window
 *  tracks it accurately throughout. */
export function CamShiftLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    fetch("/data/camshift-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const frame = data.frames[t];
  const W = data.width * SCALE, H = data.height * SCALE;
  const box = (b: Box) => ({ x: b[0] * SCALE, y: b[1] * SCALE, w: b[2] * SCALE, h: b[3] * SCALE });
  const tb = box(frame.true), mb = box(frame.meanshift), cb = box(frame.camshift);
  const err = (b: Box) => Math.abs((b[0] + b[2] / 2) - (frame.true[0] + frame.true[2] / 2));

  return (
    <figure className="fig camshiftlab">
      <label className="ctl ctl-wide"><span>Frame <output>{t}</output></span>
        <input type="range" min={0} max={data.frames.length - 1} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Frame" />
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="True object vs meanShift and CamShift tracking windows">
        <rect x={0} y={0} width={W} height={H} fill="var(--bg-sunk)" />
        <rect x={tb.x} y={tb.y} width={tb.w} height={tb.h} fill="none" stroke="#2da44e" strokeWidth={2} />
        <rect x={mb.x} y={mb.y} width={mb.w} height={mb.h} fill="none" stroke="#bf8700" strokeWidth={2} strokeDasharray="4 2" />
        <rect x={cb.x} y={cb.y} width={cb.w} height={cb.h} fill="none" stroke="#cf222e" strokeWidth={2} strokeDasharray="2 2" />
      </svg>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#2da44e" }} /> true object
        <span className="by-k" style={{ background: "#bf8700" }} /> meanShift (fixed window)
        <span className="by-k" style={{ background: "#cf222e" }} /> CamShift (adaptive window)
      </div>
      <ul className="ap-stats">
        <li><span>meanShift centroid error</span><strong style={{ color: err(frame.meanshift) > 3 ? "#cf222e" : "#2da44e" }}>{err(frame.meanshift).toFixed(1)} px</strong></li>
        <li><span>CamShift centroid error</span><strong style={{ color: err(frame.camshift) > 3 ? "#cf222e" : "#2da44e" }}>{err(frame.camshift).toFixed(1)} px</strong></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.meanShift/CamShift on a real back-projection, precomputed. The object grows over time; drag to a later frame and watch meanShift's fixed window fall behind while CamShift's window grows with it.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
