"use client";

import { useState } from "react";
import { bgrToYcrcb, ycrcbToBgr, type Trip } from "@/lib/ycc-ops";

const css = (b: Trip) => `rgb(${b[2]},${b[1]},${b[0]})`;
const S = 200; // plot size
const px = (v: number) => (v / 255) * S;

/** YccLab: B, G, R → Y, Cr, Cb; a shadow moves the colour along a ray towards the neutral point (128, 128) in the Cr–Cb plane. */
export function YccLab({ caption }: { caption?: string }) {
  const [bgr, setBgr] = useState<Trip>([60, 110, 190]);
  const [shade, setShade] = useState(0.5);
  const y1 = bgrToYcrcb(bgr);
  const dark = bgr.map((v) => Math.round(v * shade)) as Trip;
  const y2 = bgrToYcrcb(dark);
  const set = (i: number, v: number) => setBgr(bgr.map((x, j) => (j === i ? v : x)) as Trip);
  const lumaOnly = ycrcbToBgr([y1[0], 128, 128]);
  const chromaOnly = ycrcbToBgr([128, y1[1], y1[2]]);
  return (
    <figure className="fig ycclab">
      <div className="yc-top">
        <div className="sc-ctl">
          {["B", "G", "R"].map((n, i) => (
            <label key={n} className="ctl ctl-wide"><span>{n} <output>{bgr[i]}</output></span><input type="range" min={0} max={255} value={bgr[i]} onChange={(e) => set(i, Number(e.target.value))} aria-label={n} /></label>
          ))}
          <label className="ctl ctl-wide"><span>Shadow: light × <output>{shade.toFixed(2)}</output></span><input type="range" min={0.1} max={1} step={0.05} value={shade} onChange={(e) => setShade(Number(e.target.value))} aria-label="Shadow" /></label>
        </div>
        <svg viewBox={`-24 -8 ${S + 32} ${S + 32}`} className="yc-plot" role="img" aria-label="Cr–Cb plane with the colour and its shadow">
          <rect x="0" y="0" width={S} height={S} className="yc-frame" />
          <line x1={px(128)} y1="0" x2={px(128)} y2={S} className="yc-axis" />
          <line x1="0" y1={S - px(128)} x2={S} y2={S - px(128)} className="yc-axis" />
          <line x1={px(128)} y1={S - px(128)} x2={px(y1[2])} y2={S - px(y1[1])} className="yc-ray" />
          <circle cx={px(y1[2])} cy={S - px(y1[1])} r="7" style={{ fill: css(bgr) }} className="yc-pt" />
          <circle cx={px(y2[2])} cy={S - px(y2[1])} r="6" style={{ fill: css(dark) }} className="yc-pt" />
          <text x={S / 2} y={S + 18} className="yc-lab" textAnchor="middle">Cb →</text>
          <text x="-10" y={S / 2} className="yc-lab" textAnchor="middle" transform={`rotate(-90 -10 ${S / 2})`}>Cr →</text>
        </svg>
      </div>
      <div className="yc-tiles">
        <div><i style={{ background: css(bgr) }} /><span>colour</span></div>
        <div><i style={{ background: css(lumaOnly) }} /><span>Y only (Cr = Cb = 128)</span></div>
        <div><i style={{ background: css(chromaOnly) }} /><span>Cr, Cb only (Y = 128)</span></div>
        <div><i style={{ background: css(dark) }} /><span>in shadow</span></div>
      </div>
      <ul className="ap-stats">
        <li><span>Y, Cr, Cb</span><strong>{y1.join(", ")}</strong><em>in shadow: {y2.join(", ")}</em></li>
        <li><span>Chroma offset (Cr − 128, Cb − 128)</span><strong>({y1[1] - 128}, {y1[2] - 128})</strong><em>in shadow: ({y2[1] - 128}, {y2[2] - 128}) · shrinks with the light</em></li>
      </ul>
      <div className="pg-readout"><span>Y carries brightness; Cr and Cb are colour differences (R − Y, B − Y) centred on 128. A shadow lowers Y and pulls Cr, Cb proportionally towards 128: the direction (the hue) stays, the distance shrinks.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
