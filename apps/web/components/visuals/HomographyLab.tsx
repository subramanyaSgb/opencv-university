"use client";

import { useRef, useState } from "react";
import { affine, applyH, homography, type P } from "@/lib/homography-ops";

const VW = 320, VH = 220;
const RECT: P[] = [[0, 0], [240, 0], [240, 120], [0, 120]];
const START: P[] = [[70, 40], [270, 62], [255, 170], [52, 140]];
const NAMES = ["top-left", "top-right", "bottom-right", "bottom-left"];

/** HomographyLab: drag the corners of a label seen in perspective; the label's grid follows the homography (or affine map). */
export function HomographyLab({ caption }: { caption?: string }) {
  const [pts, setPts] = useState<P[]>(START);
  const [mode, setMode] = useState<"projective" | "affine">("projective");
  const drag = useRef<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  // in affine mode the 4th corner (bottom-right) follows: parallelogram
  const shown: P[] = mode === "affine" ? [pts[0], pts[1], [pts[1][0] + pts[3][0] - pts[0][0], pts[1][1] + pts[3][1] - pts[0][1]], pts[3]] : pts;
  let H: number[][] | null = null;
  try {
    H = mode === "affine" ? affine([RECT[0], RECT[1], RECT[3]], [shown[0], shown[1], shown[3]]) : homography(RECT, shown);
  } catch { H = null; }

  const move = (e: React.PointerEvent) => {
    if (drag.current === null || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = Math.min(VW, Math.max(0, ((e.clientX - r.left) / r.width) * VW));
    const y = Math.min(VH, Math.max(0, ((e.clientY - r.top) / r.height) * VH));
    const i = drag.current;
    setPts((old) => old.map((p, k) => (k === i ? [Math.round(x), Math.round(y)] : p)) as P[]);
  };
  const map = (p: P) => (H ? applyH(H, p).p : p);
  const line = (a: P, b: P, k: string, cls: string) => {
    const pts2 = Array.from({ length: 21 }, (_, t) => map([a[0] + ((b[0] - a[0]) * t) / 20, a[1] + ((b[1] - a[1]) * t) / 20]));
    return <polyline key={k} points={pts2.map((p) => p.join(",")).join(" ")} className={cls} />;
  };
  const ws = H ? RECT.map((p) => applyH(H as number[][], p).w) : [];
  const f = (v: number) => (Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(2) : Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(4));

  return (
    <figure className="fig homographylab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Model</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Transform model">
            {([["projective", "Projective (homography, 4 free corners)"], ["affine", "Affine (3 corners, 4th follows)"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={mode === k} className={mode === k ? "is-on" : ""} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
        </div>
        <button type="button" className="hl-reset" onClick={() => setPts(START)}>Reset corners</button>
      </div>
      <svg ref={svg} viewBox={`0 0 ${VW} ${VH}`} className="hl-svg" onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}
        role="img" aria-label="A 240 by 120 label grid mapped into the quadrilateral given by the four corner handles">
        <rect x={0} y={0} width={VW} height={VH} className="hl-bg" />
        {H && [0, 40, 80, 120, 160, 200, 240].map((x) => line([x, 0], [x, 120], `v${x}`, x === 0 || x === 240 ? "hl-edge" : "hl-gridline"))}
        {H && [0, 30, 60, 90, 120].map((y) => line([0, y], [240, y], `h${y}`, y === 0 || y === 120 ? "hl-edge" : "hl-gridline"))}
        {shown.map((p, i) => {
          const fixed = mode === "affine" && i === 2;
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={fixed ? 5 : 9} className={fixed ? "hl-handle hl-fixed" : "hl-handle"}
                onPointerDown={(e) => { if (fixed) return; drag.current = i; (e.target as Element).setPointerCapture?.(e.pointerId); }}
                aria-label={`${NAMES[i]} corner at ${p[0]}, ${p[1]}${fixed ? " (follows the others)" : ", drag to move"}`} />
              <text x={i === 1 || i === 2 ? p[0] - 11 : p[0] + 11} y={i >= 2 ? p[1] + 20 : p[1] - 10} textAnchor={i === 1 || i === 2 ? "end" : "start"} className="hl-lab">{NAMES[i]}</text>
            </g>
          );
        })}
      </svg>
      <div className="hl-info">
        <div>
          <div className="vis-title">{mode === "affine" ? "Affine matrix (label → image)" : "Homography H (label → image)"}</div>
          {H ? <div className="hl-mat">{H.flat().map((v, i) => <span key={i} className={i >= 6 ? "hl-last" : ""}>{f(v)}</span>)}</div> : <p>Degenerate corners: no transform.</p>}
        </div>
        {H && (
          <ul className="ap-stats">
            <li><span>w at the 4 corners</span><strong>{ws.map((w) => w.toFixed(3)).join("  ")}</strong><em>{mode === "affine" ? "always 1: no perspective" : "≠ 1: x and y are divided by w"}</em></li>
          </ul>
        )}
      </div>
      <div className="pg-readout"><span>Drag the corner handles. Affine: opposite edges stay parallel and the grid stays evenly spaced. Projective: edges may converge and the grid cells shrink towards the far side, like a real tilted camera.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
