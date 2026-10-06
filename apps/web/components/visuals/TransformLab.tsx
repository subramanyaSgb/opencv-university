"use client";

import { useState } from "react";
import { apply, compose, det, type Step, type V2 } from "@/lib/transform-ops";

const SHAPE: V2[] = [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2.5], [0, 2.5]];
const U = 28, C = 160, SIZE = 320;
const px = ([x, y]: V2) => `${C + x * U},${C + y * U}`;
const ORDERS: { name: string; steps: Step[] }[] = [
  { name: "scale → shear → rotate", steps: ["scale", "shear", "rotate"] },
  { name: "rotate → shear → scale", steps: ["rotate", "shear", "scale"] },
];

/** TransformLab: a 2 × 2 matrix built from rotation, scale and shear, applied to a part outline and the unit vectors. */
export function TransformLab({ caption }: { caption?: string }) {
  const [deg, setDeg] = useState(30);
  const [sx, setSx] = useState(1.5);
  const [sy, setSy] = useState(1);
  const [k, setK] = useState(0);
  const [oi, setOi] = useState(0);
  const M = compose(ORDERS[oi].steps, deg, sx, sy, k);
  const d = det(M);
  const e1 = apply(M, [1, 0]), e2 = apply(M, [0, 1]);
  const f = (v: number) => (Math.abs(v) < 5e-4 ? "0.000" : v.toFixed(3));
  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, unit = "") => (
    <label className="ctl ctl-wide">
      <span>{label} <output>{v}{unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} />
    </label>
  );
  return (
    <figure className="fig transformlab">
      <div className="sc-ctl">
        {slider("Rotate", deg, setDeg, -180, 180, 5, "°")}
        {slider("Scale x", sx, setSx, -2, 2, 0.1)}
        {slider("Scale y", sy, setSy, -2, 2, 0.1)}
        {slider("Shear", k, setK, -1, 1, 0.1)}
        <div className="ctl ctl-full">
          <span>Order</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Order of the steps">
            {ORDERS.map((o, i) => <button key={o.name} type="button" role="radio" aria-checked={oi === i} className={oi === i ? "is-on" : ""} onClick={() => setOi(i)}>{o.name}</button>)}
          </div>
        </div>
      </div>
      <div className="tl-row">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="tl-svg" role="img" aria-label={`Part outline before (dashed) and after the transform; determinant ${d.toFixed(2)}`}>
          {Array.from({ length: 11 }, (_, i) => (i - 5) * U + C).map((g) => (
            <g key={g}><line x1={g} y1={20} x2={g} y2={SIZE - 20} className="tl-grid" /><line x1={20} y1={g} x2={SIZE - 20} y2={g} className="tl-grid" /></g>
          ))}
          <line x1={20} y1={C} x2={SIZE - 20} y2={C} className="tl-axis" /><line x1={C} y1={20} x2={C} y2={SIZE - 20} className="tl-axis" />
          <text x={SIZE - 22} y={C - 6} className="tl-lab" textAnchor="end">x</text>
          <text x={C + 6} y={SIZE - 24} className="tl-lab">y (down)</text>
          <polygon points={SHAPE.map(px).join(" ")} className="tl-before" />
          <polygon points={SHAPE.map((p) => px(apply(M, p))).join(" ")} className={d < 0 ? "tl-after tl-mirror" : "tl-after"} />
          <line x1={C} y1={C} x2={C + e1[0] * U} y2={C + e1[1] * U} className="tl-e1" markerEnd="url(#tl-arrow1)" />
          <line x1={C} y1={C} x2={C + e2[0] * U} y2={C + e2[1] * U} className="tl-e2" markerEnd="url(#tl-arrow2)" />
          <defs>
            <marker id="tl-arrow1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#cf222e" /></marker>
            <marker id="tl-arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2da44e" /></marker>
          </defs>
        </svg>
        <div className="tl-info">
          <div className="vis-title">Matrix M</div>
          <div className="tl-mat" aria-label="Matrix M">
            <span>{f(M[0][0])}</span><span>{f(M[0][1])}</span><span>{f(M[1][0])}</span><span>{f(M[1][1])}</span>
          </div>
          <p className="tl-cols">Column 1 = where <b className="tl-c1">(1, 0)</b> goes; column 2 = where <b className="tl-c2">(0, 1)</b> goes.</p>
          <ul className="ap-stats">
            <li><span>det M (area factor)</span><strong>{d.toFixed(2)}</strong><em>{Math.abs(d) < 1e-6 ? "collapsed to a line: no inverse" : d < 0 ? "negative: the shape is mirrored" : d === 1 ? "area kept" : `area × ${Math.abs(d).toFixed(2)}`}</em></li>
          </ul>
        </div>
      </div>
      <div className="pg-readout"><span>Dashed: the part before; filled: after. Image coordinates: y points down, so a positive angle turns <b>clockwise</b> on screen. Swap the order to see that rotate-then-scale differs from scale-then-rotate when the scale is not equal in x and y.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
