"use client";

import { useEffect, useMemo, useState } from "react";

type Data = { frames: number; cases: Record<string, { shifts: [number, number][] }> };

const W = 480, H = 160;

function movingAverage(x: number[], k: number): number[] {
  const pad = Math.floor(k / 2);
  const padded = [...Array(pad).fill(x[0]), ...x, ...Array(pad).fill(x[x.length - 1])];
  return x.map((_, i) => {
    let s = 0;
    for (let j = 0; j < k; j++) s += padded[i + j];
    return s / k;
  });
}

/** StabilizeLab (Module 39.7): real cv2.phaseCorrelate frame-to-frame shifts (precomputed by
 *  scripts/gen_stabilize_data.py) for a synthetic shaky sequence, with and without a large
 *  independently-moving object. Smoothing window is adjusted live; the "after" residual
 *  motion is the frame-to-frame difference of the smoothed cumulative path -- exact, since
 *  warping each frame by (smoothed - raw) makes the smoothed path the new effective motion. */
export function StabilizeLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [caseKey, setCaseKey] = useState("clean");
  const [k, setK] = useState(9);

  useEffect(() => {
    fetch("/data/stabilize-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const result = useMemo(() => {
    if (!data) return null;
    const shifts = data.cases[caseKey].shifts;
    const pathX: number[] = [], pathY: number[] = [];
    let cx = 0, cy = 0;
    for (const [dx, dy] of shifts) { cx += dx; cy += dy; pathX.push(cx); pathY.push(cy); }
    const smX = movingAverage(pathX, k), smY = movingAverage(pathY, k);
    const before = pathX.map((_, i) => (i === 0 ? 0 : Math.hypot(pathX[i] - pathX[i - 1], pathY[i] - pathY[i - 1])));
    const after = smX.map((_, i) => (i === 0 ? 0 : Math.hypot(smX[i] - smX[i - 1], smY[i] - smY[i - 1])));
    return { before, after };
  }, [data, caseKey, k]);

  if (!data || !result) return <p>Loading…</p>;

  const maxV = Math.max(1, ...result.before, ...result.after);
  const line = (v: number[]) => v.map((y, i) => `${(i / Math.max(1, v.length - 1)) * W},${H - (y / maxV) * (H - 10)}`).join(" ");
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;

  return (
    <figure className="fig stabilizelab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Scene</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Scene">
            {([["clean", "Background only"], ["object", "+ a large moving object"]] as const).map(([k2, l]) => (
              <button key={k2} type="button" role="radio" aria-checked={caseKey === k2} className={caseKey === k2 ? "is-on" : ""} onClick={() => setCaseKey(k2)}>{l}</button>
            ))}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Smoothing window <output>{k} frames</output></span>
          <input type="range" min={1} max={25} step={2} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Smoothing window" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Frame-to-frame motion before and after stabilization">
        <polyline points={line(result.before)} className="cl-buf" />
        <polyline points={line(result.after)} className="cl-new" />
        <text x={2} y={12} className="ov-t">{maxV.toFixed(1)} px</text>
        <text x={W / 2} y={H - 4} textAnchor="middle" className="ov-t">frame &rarr;</text>
      </svg>
      <div className="gl-legend"><span className="by-k" style={{ background: "#cf222e" }} /> before (raw shake) <span className="by-k" style={{ background: "#2da44e" }} /> after (stabilized)</div>
      <ul className="ap-stats">
        <li><span>Mean frame-to-frame motion</span><strong>{mean(result.before).toFixed(2)} &rarr; {mean(result.after).toFixed(2)} px</strong><em>{(mean(result.before) / Math.max(0.01, mean(result.after))).toFixed(1)}x reduction</em></li>
      </ul>
      <div className="pg-readout"><span>Frame-to-frame shifts are real cv2.phaseCorrelate measurements on a synthetic shaky sequence (precomputed). The smoothing window is live -- widen it for a steadier (but more cropped/laggy) result.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
