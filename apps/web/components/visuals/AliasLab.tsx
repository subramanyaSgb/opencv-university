"use client";

import { useState } from "react";
import { aliasFrequency, nyquist } from "@/lib/alias-ops";
import { fmt } from "@/lib/scale-ops";

/** AliasLab: a stripe pattern sampled by pixels. Above the Nyquist limit the samples trace a false, slower pattern. */
export function AliasLab({ caption }: { caption?: string }) {
  const [f, setF] = useState(0.3); // cycles per pixel
  const fs = 1;
  const fa = aliasFrequency(f, fs);
  const N = 16, W = 620, H = 170, x0 = 20, y0 = 85, A = 60;
  const px = (t: number) => x0 + ((t + 0.5) / N) * (W - 2 * x0); // pixel k is centred at t = k
  const wave = (freq: number) => Array.from({ length: 400 }, (_, i) => { const t = (i / 399) * N - 0.5; return `${i ? "L" : "M"}${px(t)} ${y0 - A * Math.cos(2 * Math.PI * freq * t)}`; }).join(" ");
  const aliased = f > nyquist(fs) + 1e-9;

  return (
    <figure className="fig aliaslab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide">
          <span>Pattern <output>{fmt(f, 2)} cycles/pixel</output></span>
          <input type="range" min={0.05} max={1.25} step={0.05} value={f} onChange={(e) => setF(Number(e.target.value))} aria-label="Pattern frequency in cycles per pixel" />
        </label>
      </div>
      <div className="sk">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A ${f} cycles per pixel wave sampled once per pixel; it appears as ${fa.toFixed(2)} cycles per pixel`}>
          {Array.from({ length: N }, (_, k) => <rect key={k} x={px(k - 0.5) + 1} y="12" width={px(1) - px(0) - 2} height={H - 24} className="al-px" />)}
          <path d={wave(f)} className="al-true" />
          {aliased && <path d={wave(fa)} className="al-alias" />}
          {Array.from({ length: N }, (_, k) => {
            const t = k;
            return <circle key={k} cx={px(t)} cy={y0 - A * Math.cos(2 * Math.PI * f * t)} r="5" className="ax-dot" />;
          })}
        </svg>
        <div className="ap-legend"><span className="lg lg-tot" /> real pattern <span className="lg al-lg-alias" /> what the samples show (alias) <span className="lg lg-best al-lg-dot" /> pixel samples</div>
      </div>
      <ul className="ap-stats">
        <li><span>Nyquist limit</span><strong>{fmt(nyquist(fs), 2)} c/px</strong><em>period ≥ 2 px</em></li>
        <li><span>Real period</span><strong>{fmt(1 / f, 2)} px</strong><em>{fmt(f, 2)} c/px</em></li>
        <li><span>Seen as</span><strong>{fa < 1e-6 ? "flat" : `${fmt(1 / fa, 2)} px`}</strong><em>{fmt(fa, 2)} c/px</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite"><span>{aliased ? <><strong>Aliased:</strong> the samples are identical to a slower pattern (dashed). Nothing in the pixel values can tell them apart.</> : "Below the Nyquist limit: the samples follow the real pattern."}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
