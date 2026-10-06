"use client";

import { useEffect, useState } from "react";

type Data = {
  line_x: number; hysteresis: number; true_x: number[]; measured_x: number[];
  presence_counts: number[]; naive_counts: number[]; hyst_counts: number[];
};

const W = 480, H = 160;

/** CountLab (Module 40.7): real line-crossing counting on the same noisy trajectory, three
 *  ways -- presence (wrong), naive event (overcounts near the line), hysteresis event
 *  (correct). Precomputed by scripts/gen_count_data.py. */
export function CountLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [t, setT] = useState(59);

  useEffect(() => {
    fetch("/data/count-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const n = data.true_x.length;
  const allVals = [...data.measured_x, data.line_x];
  const maxV = Math.max(...allVals), minV = Math.min(...allVals);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - 10 - ((v - minV) / (maxV - minV)) * (H - 20);
  const line = (vals: number[]) => vals.slice(0, t + 1).map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <figure className="fig countlab">
      <label className="ctl ctl-wide"><span>Frame <output>{t}</output></span>
        <input type="range" min={0} max={n - 1} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Frame" />
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Noisy position crossing a counting line">
        <line x1={x(0)} x2={x(n - 1)} y1={y(data.line_x)} y2={y(data.line_x)} className="ov-lim" />
        <line x1={x(0)} x2={x(n - 1)} y1={y(data.line_x + data.hysteresis)} y2={y(data.line_x + data.hysteresis)} stroke="var(--line)" strokeDasharray="2 2" opacity={0.5} />
        <line x1={x(0)} x2={x(n - 1)} y1={y(data.line_x - data.hysteresis)} y2={y(data.line_x - data.hysteresis)} stroke="var(--line)" strokeDasharray="2 2" opacity={0.5} />
        <polyline points={line(data.measured_x)} fill="none" stroke="#1f6feb" strokeWidth={2} />
        <text x={2} y={12} className="ov-t">counting line (dashed = hysteresis margin)</text>
      </svg>
      <ul className="ap-stats">
        <li><span>Presence count (frames past the line)</span><strong style={{ color: "#cf222e" }}>{data.presence_counts[t]}</strong><em>wrong: counts every frame, not every event</em></li>
        <li><span>Naive event count (any side flip)</span><strong style={{ color: data.naive_counts[t] > 1 ? "#cf222e" : "#2da44e" }}>{data.naive_counts[t]}</strong><em>overcounts noise near the line</em></li>
        <li><span>Hysteresis event count</span><strong style={{ color: "#2da44e" }}>{data.hyst_counts[t]}</strong><em>correct (true crossings: 1)</em></li>
      </ul>
      <div className="pg-readout"><span>Real counting on the same noisy real trajectory, three ways. Drag to the end: presence counting reaches the frame count the object spent past the line; naive event counting fires several times as noise jitters the position near the line; only the hysteresis count matches the true answer, 1.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
