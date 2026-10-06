"use client";

import { useState } from "react";
import { de2000, de76, labToRgb, type Lab } from "@/lib/lab-ops";

const REFS: { l: string; lab: Lab }[] = [
  { l: "signal red", lab: [45, 65, 45] },
  { l: "sky blue", lab: [60, -10, -40] },
  { l: "light grey", lab: [80, 0, 0] },
  { l: "olive", lab: [50, -10, 40] },
];
const css = (c: number[]) => `rgb(${c.join(",")})`;

/** DeltaELab: shift a sample from a reference colour in L*, a*, b*; compare ΔE76 and CIEDE2000 with a tolerance. */
export function DeltaELab({ caption }: { caption?: string }) {
  const [ri, setRi] = useState(2);
  const [dL, setDL] = useState(0);
  const [da, setDa] = useState(2);
  const [db, setDb] = useState(0);
  const [tol, setTol] = useState(2);
  const ref = REFS[ri].lab;
  const smp: Lab = [ref[0] + dL, ref[1] + da, ref[2] + db];
  const e76 = de76(ref, smp), e00 = de2000(ref, smp);
  const sl = (label: string, v: number, set: (n: number) => void) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v > 0 ? `+${v}` : v}</output></span><input type="range" min={-10} max={10} step={0.5} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  return (
    <figure className="fig deltaelab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Reference</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Reference colour">
            {REFS.map((r, i) => <button key={r.l} type="button" role="radio" aria-checked={ri === i} className={ri === i ? "is-on" : ""} onClick={() => setRi(i)}>{r.l}</button>)}
          </div>
        </div>
        {sl("ΔL* (lighter / darker)", dL, setDL)}
        {sl("Δa* (greener / redder)", da, setDa)}
        {sl("Δb* (bluer / yellower)", db, setDb)}
        <div className="ctl ctl-full"><span>Tolerance ΔE00</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Tolerance">
            {[1, 2, 3].map((t) => <button key={t} type="button" role="radio" aria-checked={tol === t} className={tol === t ? "is-on" : ""} onClick={() => setTol(t)}>≤ {t}</button>)}
          </div>
        </div>
      </div>
      <div className="de-sw" role="img" aria-label="Reference and sample colour side by side">
        <div style={{ background: css(labToRgb(ref)) }}><span>reference L*a*b* ({ref.join(", ")})</span></div>
        <div style={{ background: css(labToRgb(smp)) }}><span>sample ({smp.map((v) => v.toFixed(1)).join(", ")})</span></div>
      </div>
      <ul className="ap-stats">
        <li><span>ΔE76 (straight distance)</span><strong>{e76.toFixed(2)}</strong><em>√(ΔL*² + Δa*² + Δb*²)</em></li>
        <li><span>ΔE00 (CIEDE2000)</span><strong>{e00.toFixed(2)}</strong><em>weights lightness, chroma and hue like the eye</em></li>
        <li><span>Verdict</span><strong className={e00 <= tol ? "de-ok" : "de-bad"}>{e00 <= tol ? "pass" : "reject"}</strong><em>tolerance ΔE00 ≤ {tol}</em></li>
      </ul>
      <div className="pg-readout"><span>Same Δa* = +2 on light grey and on signal red: ΔE76 is 2 for both, but CIEDE2000 rates the shift on the saturated red much smaller, because the eye is less sensitive to chroma changes in strong colours.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
