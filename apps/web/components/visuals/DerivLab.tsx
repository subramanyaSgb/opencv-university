"use client";

import { useMemo, useState } from "react";
import { centralDiff, edgeProfile, secondDiff, smooth, subpixelPeak } from "@/lib/deriv-ops";
import { normals } from "@/lib/stats-ops";

const N = 40, W = 480, PH = 90;
const SHAPES = {
  edge: { name: "Sharp-ish edge", f: () => edgeProfile(N, 20.3, 1) },
  soft: { name: "Soft edge (defocus)", f: () => edgeProfile(N, 20.3, 3) },
  line: { name: "Thin dark line", f: () => Array.from({ length: N }, (_, x) => Math.round(180 - 110 * Math.exp(-0.5 * ((x - 20.3) / 1.2) ** 2))) },
};
type K = keyof typeof SHAPES;

function Plot({ title, v, color, zero, mark }: { title: string; v: number[]; color: string; zero?: boolean; mark?: number }) {
  const lo = Math.min(...v, zero ? 0 : Infinity), hi = Math.max(...v, zero ? 0 : -Infinity);
  const span = hi - lo || 1;
  const X = (i: number) => 10 + (i * (W - 20)) / (N - 1);
  const Y = (y: number) => 8 + (PH - 16) * (1 - (y - lo) / span);
  return (
    <div className="dv-plot">
      <div className="vis-title">{title}</div>
      <svg viewBox={`0 0 ${W} ${PH}`} role="img" aria-label={title}>
        {zero && <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} className="dv-zero" />}
        {mark !== undefined && <line x1={X(mark)} x2={X(mark)} y1={0} y2={PH} className="dv-mark" />}
        <polyline points={v.map((y, i) => `${X(i)},${Y(y)}`).join(" ")} fill="none" stroke={color} strokeWidth={2} />
        {v.map((y, i) => <circle key={i} cx={X(i)} cy={Y(y)} r={2.2} fill={color} />)}
      </svg>
    </div>
  );
}

/** DerivLab: a 1-D profile, its first and second differences, noise, smoothing and the sub-pixel edge position. */
export function DerivLab({ caption }: { caption?: string }) {
  const [shape, setShape] = useState<K>("edge");
  const [noise, setNoise] = useState(0);
  const [sigma, setSigma] = useState(0);
  const f = useMemo(() => {
    const base = SHAPES[shape].f();
    const n = normals(N, 0, noise, 5);
    return base.map((v, i) => Math.min(255, Math.max(0, Math.round(v + n[i]))));
  }, [shape, noise]);
  const s = useMemo(() => smooth(f, sigma), [f, sigma]);
  const d1 = centralDiff(s), d2 = secondDiff(s);
  const peak = subpixelPeak(d1);
  return (
    <figure className="fig derivlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Profile</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Profile">
            {(Object.keys(SHAPES) as K[]).map((k) => <button key={k} type="button" role="radio" aria-checked={shape === k} className={shape === k ? "is-on" : ""} onClick={() => setShape(k)}>{SHAPES[k].name}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Noise σ <output>{noise}</output></span><input type="range" min={0} max={20} value={noise} onChange={(e) => setNoise(Number(e.target.value))} aria-label="Noise sigma" /></label>
        <label className="ctl ctl-wide"><span>Smooth first (Gaussian σ) <output>{sigma}</output></span><input type="range" min={0} max={4} step={0.5} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} aria-label="Smoothing sigma" /></label>
      </div>
      <Plot title={sigma > 0 ? "f(x) after smoothing" : "f(x): pixel values along a row"} v={s} color="#1f6feb" mark={peak.position} />
      <Plot title="f′(x) ≈ (f(x+1) − f(x−1)) / 2" v={d1} color="#cf222e" zero mark={peak.position} />
      <Plot title="f″(x) ≈ f(x+1) − 2 f(x) + f(x−1)" v={d2} color="#2da44e" zero mark={peak.position} />
      <ul className="ap-stats">
        <li><span>Strongest |f′|</span><strong>x = {peak.index}</strong><em>|f′| = {Math.abs(d1[peak.index]).toFixed(1)}</em></li>
        <li><span>Sub-pixel position</span><strong>x = {peak.position.toFixed(2)}</strong><em>true centre 20.30</em></li>
      </ul>
      <div className="pg-readout"><span>An edge is a peak in f′ and a zero crossing in f″; a thin line is a zero crossing in f′ and a peak in f″. Add noise: the differences get much noisier than f. Then smooth first.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
