"use client";

import { useState } from "react";
import { observe, chroma, saturated, type RGB } from "@/lib/chroma-ops";

const SURFACES: { l: string; r: RGB }[] = [
  { l: "red part", r: [0.6, 0.15, 0.1] },
  { l: "blue part", r: [0.08, 0.2, 0.55] },
  { l: "cardboard", r: [0.45, 0.32, 0.2] },
  { l: "grey steel", r: [0.4, 0.4, 0.4] },
];
const LIGHTS: { l: string; t: RGB }[] = [
  { l: "neutral", t: [1, 1, 1] },
  { l: "warm (halogen)", t: [1.15, 1, 0.65] },
  { l: "cool (shade)", t: [0.85, 1, 1.2] },
];
const css = (c: RGB) => `rgb(${c.join(",")})`;
const pct = (v: number) => `${(v * 100).toFixed(1)} %`;

/** ChromaLab: the same surface under brighter, darker and tinted light: RGB values vs normalised chromaticity. */
export function ChromaLab({ caption }: { caption?: string }) {
  const [si, setSi] = useState(0);
  const [li, setLi] = useState(0);
  const [inten, setInten] = useState(1);
  const s = SURFACES[si];
  const rgb = observe(s.r, inten, LIGHTS[li].t);
  const ref = observe(s.r, 1, [1, 1, 1]);
  const c = chroma(rgb), c0 = chroma(ref)!;
  return (
    <figure className="fig chromalab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Surface</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Surface">
            {SURFACES.map((x, i) => <button key={x.l} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{x.l}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Light intensity <output>{Math.round(inten * 100)} %</output></span><input type="range" min={0.1} max={2.5} step={0.05} value={inten} onChange={(e) => setInten(Number(e.target.value))} aria-label="Light intensity" /></label>
        <div className="ctl ctl-full"><span>Light colour</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Light colour">
            {LIGHTS.map((x, i) => <button key={x.l} type="button" role="radio" aria-checked={li === i} className={li === i ? "is-on" : ""} onClick={() => setLi(i)}>{x.l}</button>)}
          </div>
        </div>
      </div>
      <div className="ch-row">
        <div className="ch-sw"><i style={{ background: css(ref) }} /><span>reference: 100 %, neutral</span></div>
        <div className="ch-sw"><i style={{ background: css(rgb) }} /><span>now</span></div>
      </div>
      <ul className="ap-stats">
        <li><span>Camera R, G, B (linear)</span><strong>{rgb.join(", ")}</strong><em>reference {ref.join(", ")}{saturated(rgb) ? " · a channel is saturated (255)!" : ""}</em></li>
        <li><span>Chromaticity r, g, b</span><strong>{c ? c.map((v) => v.toFixed(3)).join(", ") : "undefined (black)"}</strong><em>reference {c0.map((v) => v.toFixed(3)).join(", ")}</em></li>
        <li><span>Change in r</span><strong className={c && Math.abs(c[0] - c0[0]) < 0.01 ? "ch-ok" : "ch-bad"}>{c ? pct(c[0] - c0[0]) : "–"}</strong><em>{c && Math.abs(c[0] - c0[0]) < 0.01 ? "stable: brightness divided out" : "changed: tint or saturation"}</em></li>
      </ul>
      <div className="pg-readout"><span>Dividing each channel by R + G + B removes the overall brightness, so shadows and brighter lighting do not change r, g, b. A coloured light still does (white balance, 10.6), and a clipped channel breaks the ratio.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
