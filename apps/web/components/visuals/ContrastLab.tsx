"use client";

import { useState } from "react";
import { perceived, staircase } from "@/lib/contrast-ops";

const g = (c: number) => `rgb(${c},${c},${c})`;
const LEVELS = [50, 90, 130, 170, 210];
const W = 24;

/** ContrastLab: simultaneous contrast (same grey, different surrounds) and Mach bands on a staircase. */
export function ContrastLab({ caption }: { caption?: string }) {
  const [centre, setCentre] = useState(128);
  const [dark, setDark] = useState(30);
  const [light, setLight] = useState(225);
  const [bridge, setBridge] = useState(false);
  const [a, setA] = useState(0.6);
  const prof = staircase(LEVELS, W);
  const per = perceived(prof, 4, a, 15);
  const n = prof.length;
  const sx = (i: number) => (i / (n - 1)) * 300;
  const sy = (v: number) => 110 - (v / 255) * 100;
  const line = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  return (
    <figure className="fig contrastlab">
      <div className="vis-title">1. Simultaneous contrast: both squares are code {centre}</div>
      <div className="cl-sim" role="img" aria-label={`Two squares of grey ${centre}, on dark ${dark} and light ${light} surrounds`}>
        <div style={{ background: g(dark) }}><i style={{ background: g(centre) }} /></div>
        <div style={{ background: g(light) }}><i style={{ background: g(centre) }} /></div>
        {bridge && <b style={{ background: g(centre) }} />}
      </div>
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Squares <output>{centre}</output></span><input type="range" min={0} max={255} value={centre} onChange={(e) => setCentre(Number(e.target.value))} aria-label="Square grey" /></label>
        <label className="ctl ctl-wide"><span>Left surround <output>{dark}</output></span><input type="range" min={0} max={255} value={dark} onChange={(e) => setDark(Number(e.target.value))} aria-label="Left surround" /></label>
        <label className="ctl ctl-wide"><span>Right surround <output>{light}</output></span><input type="range" min={0} max={255} value={light} onChange={(e) => setLight(Number(e.target.value))} aria-label="Right surround" /></label>
        <div className="ctl"><button type="button" className="hl-reset" onClick={() => setBridge(!bridge)}>{bridge ? "Hide the bridge" : "Connect the squares"}</button></div>
      </div>
      <div className="vis-title">2. Mach bands: a staircase of flat steps</div>
      <div className="cl-stair" aria-hidden="true">{LEVELS.map((v) => <i key={v} style={{ background: g(v) }} />)}</div>
      <svg viewBox="0 0 300 115" className="cl-plot" role="img" aria-label="Physical staircase profile and perceived profile with overshoots at each edge">
        <path d={line(prof)} className="cl-phys" />
        <path d={line(per)} className="cl-perc" />
      </svg>
      <div className="gl-legend cl-legend"><span><i className="cl-k1" /> physical intensity</span><span><i className="cl-k2" /> perceived (centre − {a.toFixed(1)} × surround model)</span></div>
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Inhibition strength <output>{a.toFixed(1)}</output></span><input type="range" min={0} max={1.5} step={0.1} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="Inhibition strength" /></label>
      </div>
      <div className="pg-readout"><span>Each step is perfectly flat, yet most people see a lighter band on the bright side of every edge and a darker band on the dark side. The model reproduces that: perceived = I + a·(I − blurred I).</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
