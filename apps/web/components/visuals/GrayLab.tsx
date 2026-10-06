"use client";

import { useState } from "react";
import { METHODS, gray, type Method, type Trip } from "@/lib/gray-ops";

const PAIRS: { l: string; fg: Trip; bg: Trip; text: string }[] = [
  { l: "red label on green", fg: [40, 40, 200], bg: [40, 112, 60], text: "LOT 4711" },
  { l: "blue print on black", fg: [200, 90, 30], bg: [30, 25, 25], text: "OK 07" },
  { l: "yellow mark on white", fg: [40, 210, 240], bg: [235, 235, 235], text: "A12" },
  { l: "orange part on grey belt", fg: [40, 150, 255], bg: [120, 120, 120], text: "PART" },
];
const css = (c: Trip) => `rgb(${c[2]},${c[1]},${c[0]})`;
const g3 = (v: number) => `rgb(${v},${v},${v})`;

/** GrayLab: one label in colour and in grey with different conversion weights; contrast between label and background. */
export function GrayLab({ caption }: { caption?: string }) {
  const [pi, setPi] = useState(0);
  const [m, setM] = useState<Method>("bt601");
  const p = PAIRS[pi];
  const gf = gray(p.fg, m), gb = gray(p.bg, m);
  const all = METHODS.map((x) => ({ ...x, c: Math.abs(gray(p.fg, x.key) - gray(p.bg, x.key)) }));
  const best = all.reduce((a, b) => (b.c > a.c ? b : a));
  return (
    <figure className="fig graylab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Scene</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Scene">
            {PAIRS.map((x, i) => <button key={x.l} type="button" role="radio" aria-checked={pi === i} className={pi === i ? "is-on" : ""} onClick={() => setPi(i)}>{x.l}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Grey conversion</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Method">
            {METHODS.map((x) => <button key={x.key} type="button" role="radio" aria-checked={m === x.key} className={m === x.key ? "is-on" : ""} onClick={() => setM(x.key)}>{x.label}</button>)}
          </div>
        </div>
      </div>
      <div className="gy-row">
        <div className="gy-tile" style={{ background: css(p.bg), color: css(p.fg) }}>{p.text}</div>
        <div className="gy-tile" style={{ background: g3(gb), color: g3(gf) }}>{p.text}</div>
      </div>
      <ul className="ap-stats">
        <li><span>Grey: label vs background</span><strong>{gf} vs {gb}</strong><em>{METHODS.find((x) => x.key === m)!.note}</em></li>
        <li><span>Contrast |difference|</span><strong className={Math.abs(gf - gb) < 15 ? "gy-bad" : "gy-ok"}>{Math.abs(gf - gb)}</strong><em>{Math.abs(gf - gb) < 15 ? "the label almost disappears" : "readable"}</em></li>
        <li><span>Best for this scene</span><strong>{best.label}</strong><em>contrast {best.c}</em></li>
      </ul>
      <div className="pg-readout"><span>"Grey" is a choice of weights. For people, BT.601 or L* look natural; for an algorithm, the channel or combination that maximises the contrast you need is better.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
