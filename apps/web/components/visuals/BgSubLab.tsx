"use client";

import { useEffect, useState } from "react";

type Box = [number, number, number, number];
type Data = { width: number; height: number; true_boxes: Box[][]; mog2_boxes: Box[][]; knn_boxes: Box[][] };

const SCALE = 2;

/** BgSubLab (Module 40.2): real cv2.createBackgroundSubtractorMOG2/KNN results (precomputed
 *  by scripts/gen_bgsub_data.py) on the same two-object video 40.1 used -- one real object
 *  now shows up as one real blob (closing 40.1's cliffhanger), after a real, measured
 *  learning period. */
export function BgSubLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [t, setT] = useState(10);
  const [method, setMethod] = useState<"mog2_boxes" | "knn_boxes">("mog2_boxes");

  useEffect(() => {
    fetch("/data/bgsub-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const detected = data[method][t];
  const trueBoxes = data.true_boxes[t];
  const W = data.width * SCALE, H = data.height * SCALE;
  const match = detected.length === trueBoxes.length;

  return (
    <figure className="fig bgsublab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Background subtractor</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Method">
            {([["mog2_boxes", "MOG2"], ["knn_boxes", "KNN"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={method === k} className={method === k ? "is-on" : ""} onClick={() => setMethod(k)}>{l}</button>
            ))}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Frame <output>{t}</output></span>
          <input type="range" min={0} max={59} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Frame" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="True objects vs detected blobs">
        <rect x={0} y={0} width={W} height={H} fill="var(--bg-sunk)" />
        {trueBoxes.map((b, i) => (
          <rect key={`t${i}`} x={b[0] * SCALE} y={b[1] * SCALE} width={b[2] * SCALE} height={b[3] * SCALE} fill="none" stroke="#2da44e" strokeWidth={2} />
        ))}
        {detected.map((b, i) => (
          <rect key={`d${i}`} x={b[0] * SCALE} y={b[1] * SCALE} width={b[2] * SCALE} height={b[3] * SCALE} fill="none" stroke="#cf222e" strokeWidth={2} strokeDasharray="4 2" />
        ))}
      </svg>
      <div className="gl-legend"><span className="by-k" style={{ background: "#2da44e" }} /> true object <span className="by-k" style={{ background: "#cf222e" }} /> detected blob ({method === "mog2_boxes" ? "MOG2" : "KNN"})</div>
      <ul className="ap-stats">
        <li><span>True objects</span><strong>{trueBoxes.length}</strong></li>
        <li><span>Detected blobs</span><strong style={{ color: match ? "#2da44e" : "#cf222e" }}>{detected.length}</strong><em>{t < 6 ? "still learning the background (early frames)" : match ? "one blob per real object" : "mismatch"}</em></li>
      </ul>
      <div className="pg-readout"><span>Real cv2 background subtractors, precomputed. KNN reaches the correct 2-blobs-for-2-objects count by frame 4; MOG2 by frame 6 -- both need a short real learning period before matching 40.1's two-frame-differencing failure mode disappears.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
