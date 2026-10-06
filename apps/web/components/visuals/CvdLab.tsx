"use client";

import { useState } from "react";
import { simulate, deltaE, type Cvd, type RGB } from "@/lib/cvd-ops";

const VIEWS: { k: Cvd; l: string }[] = [
  { k: "normal", l: "normal vision" },
  { k: "protanopia", l: "protanopia" },
  { k: "deuteranopia", l: "deuteranopia" },
  { k: "tritanopia", l: "tritanopia" },
];
const PALETTES: { k: string; l: string; ok: RGB; nok: RGB; warn: RGB }[] = [
  { k: "rg", l: "green / red / amber", ok: [40, 180, 60], nok: [220, 40, 40], warn: [240, 170, 0] },
  { k: "oi", l: "blue / orange / yellow (Okabe-Ito)", ok: [0, 114, 178], nok: [230, 159, 0], warn: [240, 228, 66] },
];
const PARTS = [1, 1, 0, 1, 2, 1, 1, 0, 1, 1, 1, 2, 1, 0, 1, 1];
const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** CvdLab: an inspection overview with OK / NOK / warning colours, as seen with normal vision and three colour vision deficiencies. */
export function CvdLab({ caption }: { caption?: string }) {
  const [view, setView] = useState<Cvd>("deuteranopia");
  const [pi, setPi] = useState(0);
  const [shapes, setShapes] = useState(false);
  const p = PALETTES[pi];
  const cols = [p.nok, p.ok, p.warn].map((c) => simulate(c, view));
  const de = deltaE(cols[0], cols[1]);
  return (
    <figure className="fig cvdlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Seen with</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Vision">
            {VIEWS.map((v) => <button key={v.k} type="button" role="radio" aria-checked={view === v.k} className={view === v.k ? "is-on" : ""} onClick={() => setView(v.k)}>{v.l}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Status colours</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Palette">
            {PALETTES.map((x, i) => <button key={x.k} type="button" role="radio" aria-checked={pi === i} className={pi === i ? "is-on" : ""} onClick={() => setPi(i)}>{x.l}</button>)}
          </div>
        </div>
        <div className="ctl"><button type="button" className="hl-reset" onClick={() => setShapes(!shapes)}>{shapes ? "Colour only" : "Add shapes and labels"}</button></div>
      </div>
      <div className="cv-grid" role="img" aria-label="Sixteen parts coloured by inspection result">
        {PARTS.map((s, i) => (
          <span key={i} className={`cv-part${shapes ? ` cv-s${s}` : ""}`} style={{ background: css(cols[s]) }}>
            {shapes ? (s === 0 ? "✕" : s === 1 ? "✓" : "!") : ""}
          </span>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>OK vs NOK colour difference</span><strong className={de < 20 ? "cv-bad" : de < 40 ? "cv-warn" : "cv-ok"}>ΔE ≈ {de.toFixed(0)}</strong><em>{de < 20 ? "easily confused" : de < 40 ? "distinguishable with care" : "clearly different"} (CIE76; ≈ 2.3 is just noticeable)</em></li>
        <li><span>NOK colour as seen</span><strong><i className="cv-sw" style={{ background: css(cols[0]) }} /> rgb({cols[0].join(", ")})</strong><em>simulated with the Machado et al. (2009) model</em></li>
      </ul>
      <div className="pg-readout"><span>About 1 in 12 men (red-green deficiency) would see the green/red palette roughly like the deuteranopia or protanopia view. Never let colour be the only signal: add shape, position or text.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
