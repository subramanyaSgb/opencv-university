"use client";

import { useMemo, useState } from "react";
import data from "@/lib/contour-data.json";
import { approxClosed, type P } from "@/lib/contour-ops";

type C = {
  pts: P[]; simple: number; hier: number[]; area: number; perimeter: number; centroid: [number, number] | null;
  rect: number[]; minRect: [[number, number], [number, number], number]; circle: number[]; hull: P[]; hullArea: number;
  hu: number[]; ellipse?: number[]; defects: number[][];
};
type Mode = "external" | "list" | "ccomp" | "tree";
type Layer = "rect" | "minRect" | "circle" | "ellipse" | "hull" | "defects" | "approx" | "centroid";
const D = data as unknown as { w: number; h: number; modes: Record<Mode, C[]> };
const COLORS = ["#e4572e", "#29a3a3", "#f3a712", "#669bbc", "#a23b72", "#5aa469", "#d1495b", "#8d6cab", "#edae49", "#00798c"];

function boxPoints([[cx, cy], [w, h], a]: [[number, number], [number, number], number]): P[] {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}
const path = (pts: P[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ") + " Z";

/** ContourLab (Module 24): contours of sample-parts.png precomputed with OpenCV 4.13 (all retrieval modes) with hierarchy, area, perimeter, centroid, bounding shapes, hull, defects, Hu moments, and a live approxPolyDP. */
export function ContourLab({ initialMode = "tree", layers: initialLayers = ["centroid"], initialSelected = 0, caption }: { initialMode?: Mode; layers?: Layer[]; initialSelected?: number; caption?: string }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [sel, setSel] = useState(initialSelected);
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [eps, setEps] = useState(2);
  const cs = D.modes[mode], c = cs[Math.min(sel, cs.length - 1)];
  const approx = useMemo(() => (c ? approxClosed(c.pts, eps) : []), [c, eps]);
  const depth = (i: number) => { let d = 0, p = cs[i].hier[3]; while (p >= 0) { d++; p = cs[p].hier[3]; } return d; };
  const on = (l: Layer) => layers.includes(l);
  const toggle = (l: Layer) => setLayers((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]));
  const L: [Layer, string][] = [["centroid", "centroid"], ["rect", "bounding rect"], ["minRect", "min-area rect"], ["circle", "enclosing circle"], ["ellipse", "fitted ellipse"], ["hull", "convex hull"], ["defects", "convexity defects"], ["approx", "approxPolyDP"]];

  return (
    <figure className="fig contourlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Retrieval mode</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Retrieval mode">
            {(["external", "list", "ccomp", "tree"] as Mode[]).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-on" : ""} onClick={() => { setMode(m); setSel(0); }}>RETR_{m.toUpperCase()}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Show</span>
          <div className="ct-checks">{L.map(([k, l]) => <label key={k}><input type="checkbox" checked={on(k)} onChange={() => toggle(k)} /> {l}</label>)}</div>
        </div>
        {on("approx") && <label className="ctl ctl-wide"><span>approxPolyDP ε (px) <output>{eps}</output></span><input type="range" min={0.5} max={15} step={0.5} value={eps} onChange={(e) => setEps(Number(e.target.value))} aria-label="epsilon" /></label>}
      </div>
      <div className="ct-main">
        <svg viewBox={`0 0 ${D.w} ${D.h}`} className="ct-svg" role="img" aria-label="Contours of the parts image">
          <image href="/images/sample-parts.png" width={D.w} height={D.h} opacity={0.35} />
          {cs.map((k, i) => <path key={i} d={path(k.pts)} className={i === sel ? "ct-sel" : "ct-c"} stroke={COLORS[i % COLORS.length]} onClick={() => setSel(i)} />)}
          {c && on("rect") && <rect x={c.rect[0]} y={c.rect[1]} width={c.rect[2]} height={c.rect[3]} className="ct-ov" />}
          {c && on("minRect") && <path d={path(boxPoints(c.minRect))} className="ct-ov ct-ov2" />}
          {c && on("circle") && <circle cx={c.circle[0]} cy={c.circle[1]} r={c.circle[2]} className="ct-ov ct-ov3" />}
          {c && on("ellipse") && c.ellipse && <ellipse cx={c.ellipse[0]} cy={c.ellipse[1]} rx={c.ellipse[2] / 2} ry={c.ellipse[3] / 2} transform={`rotate(${c.ellipse[4]} ${c.ellipse[0]} ${c.ellipse[1]})`} className="ct-ov ct-ov4" />}
          {c && on("hull") && <path d={path(c.hull)} className="ct-ov ct-ov5" />}
          {c && on("defects") && c.defects.map(([s, e, f], i) => <g key={i}><line x1={c.pts[s][0]} y1={c.pts[s][1]} x2={c.pts[e][0]} y2={c.pts[e][1]} className="ct-ov ct-ov5" /><circle cx={c.pts[f][0]} cy={c.pts[f][1]} r={2.5} className="ct-def" /></g>)}
          {c && on("approx") && <path d={path(approx)} className="ct-ov ct-ov6" />}
          {c && on("approx") && approx.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.8} className="ct-vtx" />)}
          {c && on("centroid") && c.centroid && <circle cx={c.centroid[0]} cy={c.centroid[1]} r={2.5} className="ct-cen" />}
        </svg>
        <div className="ct-side">
          <p className="ct-head">Contours ({cs.length}) · [next, prev, child, parent]</p>
          <ol className="ct-list" start={0}>
            {cs.map((k, i) => (
              <li key={i}><button type="button" className={i === sel ? "is-on" : ""} onClick={() => setSel(i)} style={{ paddingLeft: `${0.4 + 0.9 * depth(i)}rem`, borderLeftColor: COLORS[i % COLORS.length] }}>
                #{i} {k.hier[3] >= 0 ? "hole/inner" : "outer"} · [{k.hier.join(", ")}]
              </button></li>
            ))}
          </ol>
        </div>
      </div>
      {c && (
        <table className="ct-table"><tbody>
          <tr><th>points (NONE / SIMPLE)</th><td>{c.pts.length} / {c.simple}</td><th>area</th><td>{c.area}</td></tr>
          <tr><th>perimeter</th><td>{c.perimeter}</td><th>centroid</th><td>{c.centroid ? `(${c.centroid[0]}, ${c.centroid[1]})` : "—"}</td></tr>
          <tr><th>bounding rect x, y, w, h</th><td>{c.rect.join(", ")}</td><th>min-area rect (w × h, angle)</th><td>{c.minRect[1][0]} × {c.minRect[1][1]}, {c.minRect[2]}°</td></tr>
          <tr><th>enclosing circle r</th><td>{c.circle[2]}</td><th>solidity (area / hull area)</th><td>{(c.area / c.hullArea).toFixed(3)}</td></tr>
          <tr><th>circularity 4πA / P²</th><td>{((4 * Math.PI * c.area) / c.perimeter ** 2).toFixed(3)}</td><th>defects deeper than 1 px</th><td>{c.defects.length}{c.defects.length ? ` (max ${Math.max(...c.defects.map((d) => d[3])).toFixed(1)} px)` : ""}</td></tr>
          <tr><th>approxPolyDP vertices</th><td>{approx.length} (ε = {eps})</td><th>Hu h1, h2</th><td>{c.hu[0]}, {c.hu[1]}</td></tr>
        </tbody></table>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
