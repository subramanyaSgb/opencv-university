"use client";

import { useEffect, useState } from "react";

type Box = [number, number, number, number];
type Data = { width: number; height: number; true_counts: number[]; true_boxes: Box[][]; frames: { detected: number; boxes: Box[] }[] };

const SCALE = 2;

/** BlobCountLab (Module 40.1): real cv2.absdiff + connectedComponentsWithStats blob counts
 *  (precomputed by scripts/gen_blobcount_data.py) on a synthetic two-object video -- each
 *  real uniform moving object shows up as TWO detected blobs (leading + trailing edge),
 *  exactly the effect 14.5 found at the pixel level, now shown at the blob/count level. */
export function BlobCountLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [t, setT] = useState(10);

  useEffect(() => {
    fetch("/data/blobcount-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const frame = data.frames[t];
  const trueBoxes = data.true_boxes[t];
  const W = data.width * SCALE, H = data.height * SCALE;

  return (
    <figure className="fig blobcountlab">
      <label className="ctl ctl-wide"><span>Frame <output>{t}</output></span>
        <input type="range" min={1} max={data.frames.length - 1} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Frame" />
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="True objects vs detected blobs">
        <rect x={0} y={0} width={W} height={H} fill="var(--bg-sunk)" />
        {trueBoxes.map((b, i) => (
          <rect key={`t${i}`} x={b[0] * SCALE} y={b[1] * SCALE} width={b[2] * SCALE} height={b[3] * SCALE} fill="none" stroke="#2da44e" strokeWidth={2} />
        ))}
        {frame.boxes.map((b, i) => (
          <rect key={`d${i}`} x={b[0] * SCALE} y={b[1] * SCALE} width={b[2] * SCALE} height={b[3] * SCALE} fill="none" stroke="#cf222e" strokeWidth={2} strokeDasharray="4 2" />
        ))}
      </svg>
      <div className="gl-legend"><span className="by-k" style={{ background: "#2da44e" }} /> true object (ground truth) <span className="by-k" style={{ background: "#cf222e" }} /> detected blob (two-frame diff + connected components)</div>
      <ul className="ap-stats">
        <li><span>True objects</span><strong>{data.true_counts[t]}</strong></li>
        <li><span>Detected blobs</span><strong style={{ color: frame.detected === data.true_counts[t] ? "#2da44e" : "#cf222e" }}>{frame.detected}</strong><em>{frame.detected === data.true_counts[t] ? "matches" : "each uniform moving object splits into 2 (leading + trailing edge)"}</em></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.absdiff + cv2.connectedComponentsWithStats, precomputed. Counting blobs instead of objects over-counts by roughly 2x here -- exactly 14.5's "ghost" effect, now at the blob level: a real reason background subtraction (40.2) exists.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
