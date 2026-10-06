"use client";

import { useState } from "react";
import { srgbToLinear, weber, JND, ramp } from "@/lib/weber-ops";

const AMB = [0, 0.01, 0.02, 0.05];
const g = (c: number) => `rgb(${c},${c},${c})`;

/** WeberLab: a spot on a background on your own screen; Weber contrast in light (with ambient reflection) vs the ~2 % threshold; two grey ramps. */
export function WeberLab({ caption }: { caption?: string }) {
  const [bg, setBg] = useState(20);
  const [d, setD] = useState(2);
  const [amb, setAmb] = useState(0.02);
  const spot = Math.max(0, bg - d);
  const w = weber(bg, spot, amb);
  const verdict = w >= 3 * JND ? "clearly visible" : w >= JND ? "near the threshold" : "below the threshold";
  return (
    <figure className="fig weberlab">
      <div className="wb-patch" style={{ background: g(bg) }} aria-label={`Spot of code ${spot} on background ${bg}`} role="img"><i style={{ background: g(spot) }} /></div>
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Background code <output>{bg}</output></span><input type="range" min={1} max={255} value={bg} onChange={(e) => setBg(Number(e.target.value))} aria-label="Background code" /></label>
        <label className="ctl ctl-wide"><span>Spot darker by <output>{d} codes</output></span><input type="range" min={1} max={30} value={d} onChange={(e) => setD(Number(e.target.value))} aria-label="Difference" /></label>
        <div className="ctl ctl-full"><span>Room light reflected by the screen</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Ambient reflection">
            {AMB.map((a) => <button key={a} type="button" role="radio" aria-checked={amb === a} className={amb === a ? "is-on" : ""} onClick={() => setAmb(a)}>{a === 0 ? "dark room" : `${a * 100} % of white`}</button>)}
          </div>
        </div>
      </div>
      <ul className="ap-stats">
        <li><span>Luminance (relative to white)</span><strong>{(srgbToLinear(bg) * 100).toFixed(2)} % vs {(srgbToLinear(spot) * 100).toFixed(2)} %</strong><em>sRGB decoding of codes {bg} and {spot}</em></li>
        <li><span>Weber contrast ΔL / L</span><strong>{(w * 100).toFixed(1)} %</strong><em>{amb ? `including ${amb * 100} % reflected room light` : "no reflections"}</em></li>
        <li><span>Verdict (threshold ≈ 2 %)</span><strong className={w >= 3 * JND ? "wb-ok" : w >= JND ? "wb-warn" : "wb-bad"}>{verdict}</strong><em>rule of thumb for good viewing conditions</em></li>
      </ul>
      <div className="vis-title">16 grey steps, equal in code value (sRGB): looks evenly spaced</div>
      <div className="wb-ramp">{ramp(16, true).map((c, i) => <i key={i} style={{ background: g(c) }} />)}</div>
      <div className="vis-title">16 grey steps, equal in luminance (light): crowded in the brights, big jumps in the darks</div>
      <div className="wb-ramp">{ramp(16, false).map((c, i) => <i key={i} style={{ background: g(c) }} />)}</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
