"use client";

import { useState } from "react";

/** PtcLab (Module 50.2): live, exact full SNR curve (shot + read noise) vs 48.4's own
 *  shot-noise-only model -- drag the real read noise and watch where the two models
 *  diverge. */
export function PtcLab({ caption }: { caption?: string }) {
  const [readNoiseE, setReadNoiseE] = useState(1.5);

  const W = 480, H = 160;
  const meanEs = Array.from({ length: 200 }, (_, i) => Math.pow(10, (i / 199) * 4)); // 1 to 10000, log scale
  const fullSnr = meanEs.map((m) => m / Math.sqrt(m + readNoiseE ** 2));
  const shotSnr = meanEs.map((m) => Math.sqrt(m));
  const maxSnr = Math.max(...shotSnr);

  const xPos = (i: number) => (i / (meanEs.length - 1)) * W;
  const yPos = (v: number) => H - 10 - (v / maxSnr) * (H - 20);
  const pathFull = fullSnr.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" ");
  const pathShot = shotSnr.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" ");

  const sample = [1, 20, 1000];
  return (
    <figure className="fig ptclab">
      <label className="ctl ctl-wide"><span>Read noise (electrons) <output>{readNoiseE.toFixed(1)}e-</output></span>
        <input type="range" min={0} max={5} step={0.1} value={readNoiseE} onChange={(e) => setReadNoiseE(Number(e.target.value))} aria-label="Read noise" /></label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Full SNR vs shot-noise-only SNR, log mean signal axis">
        <polyline points={pathShot} fill="none" stroke="#cf222e" strokeWidth={1.5} strokeDasharray="4 2" />
        <polyline points={pathFull} fill="none" stroke="#1f6feb" strokeWidth={2} />
        <text x={4} y={14} className="ov-t">mean signal: 1 to 10,000 electrons (log scale)</text>
      </svg>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#1f6feb" }} /> full SNR (shot + read noise)
        <span className="by-k" style={{ background: "#cf222e" }} /> 48.4's shot-noise-only SNR
      </div>
      <ul className="ap-stats">
        {sample.map((m) => {
          const full = m / Math.sqrt(m + readNoiseE ** 2);
          const shot = Math.sqrt(m);
          return <li key={m}><span>mean={m}e-</span><strong>{full.toFixed(2)}</strong><em>vs shot-only {shot.toFixed(2)} (ratio {(full / shot).toFixed(3)})</em></li>;
        })}
      </ul>
      <div className="pg-readout"><span>Live, exact SNR = mean/sqrt(mean + read_noise&sup2;). Drag read noise to zero and the two curves become identical; raise it and watch the real gap open up specifically at low signal.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
