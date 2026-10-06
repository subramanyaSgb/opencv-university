"use client";

import { useState } from "react";
import { compute, OPS, type Op } from "@/lib/overflow-ops";

const PW = 300, PH = 120;

function Swatch({ title, v, exact, bad }: { title: string; v: number; exact: number; bad: boolean }) {
  const g = Math.max(0, Math.min(255, Math.round(v)));
  return (
    <div className={bad ? "ov-card ov-bad" : "ov-card"}>
      <div className="vis-title">{title}</div>
      <div className="ov-sw" style={{ background: `rgb(${g},${g},${g})`, color: g > 140 ? "#16202b" : "#fff" }}>{Number.isInteger(v) ? v : v.toFixed(2)}</div>
      <em>{bad ? `wrong (exact ${Number.isInteger(exact) ? exact : exact.toFixed(2)})` : "as expected"}</em>
    </div>
  );
}

/** OverflowLab: two 8-bit values, one operation, three arithmetic rules (NumPy uint8, OpenCV, exact), and the result curve. */
export function OverflowLab({ caption }: { caption?: string }) {
  const [a, setA] = useState(200);
  const [b, setB] = useState(100);
  const [op, setOp] = useState<Op>("add");
  const r = compute(op, a, b);
  const inRange = (x: number) => Math.round(Math.min(255, Math.max(0, x)));
  const curve = (f: (x: number) => number) => Array.from({ length: 256 }, (_, x) => `${(x / 255) * PW},${PH - (Math.max(-60, Math.min(320, f(x))) + 60) * (PH / 380)}`).join(" ");
  const y = (v: number) => PH - (v + 60) * (PH / 380);
  return (
    <figure className="fig overflowlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Operation</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Operation">
            {OPS.map((o) => <button key={o.k} type="button" role="radio" aria-checked={op === o.k} className={op === o.k ? "is-on" : ""} onClick={() => setOp(o.k)}>{o.label}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>a <output>{a}</output></span><input type="range" min={0} max={255} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="a" /></label>
        <label className="ctl ctl-wide"><span>b <output>{b}</output></span><input type="range" min={0} max={255} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="b" /></label>
      </div>
      <div className="ov-cards">
        <Swatch title="NumPy uint8" v={r.numpy} exact={r.exact} bad={r.numpy !== inRange(r.exact) && Math.abs(r.numpy - r.exact) > 0.5} />
        <Swatch title="OpenCV (saturate)" v={r.opencv} exact={r.exact} bad={Math.abs(r.opencv - r.exact) > 0.5} />
        <Swatch title="Exact (int16 / float)" v={r.exact} exact={r.exact} bad={false} />
      </div>
      <div className="vis-title">Result for every a (b fixed at {b})</div>
      <svg viewBox={`-30 -6 ${PW + 40} ${PH + 22}`} className="ov-svg" role="img" aria-label="Result curves: NumPy wraps around, OpenCV clips, exact continues">
        <line x1={0} x2={PW} y1={y(0)} y2={y(0)} className="ov-lim" /><line x1={0} x2={PW} y1={y(255)} y2={y(255)} className="ov-lim" />
        <text x={-4} y={y(0) + 3} textAnchor="end" className="ov-t">0</text><text x={-4} y={y(255) + 3} textAnchor="end" className="ov-t">255</text>
        <polyline points={curve((x) => compute(op, x, b).exact)} className="ov-exact" />
        <polyline points={curve((x) => compute(op, x, b).opencv)} className="ov-cv" />
        <polyline points={curve((x) => compute(op, x, b).numpy)} className="ov-np" />
        <line x1={(a / 255) * PW} x2={(a / 255) * PW} y1={0} y2={PH} className="ov-a" />
        <text x={PW / 2} y={PH + 14} textAnchor="middle" className="ov-t">a = 0 … 255</text>
      </svg>
      <div className="gl-legend"><span className="by-k" style={{ background: "#cf222e" }} /> NumPy uint8 <span className="by-k" style={{ background: "#1f6feb" }} /> OpenCV <span className="by-k" style={{ background: "#9aa4ae" }} /> exact</div>
      <div className="pg-readout"><span>{r.note}. NumPy keeps uint8 and wraps around modulo 256; OpenCV rounds and clips to 0…255; converting to int16 or float32 first keeps the exact value.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
