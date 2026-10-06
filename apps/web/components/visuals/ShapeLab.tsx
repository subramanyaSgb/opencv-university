"use client";

import { useMemo, useState } from "react";
import DATA from "@/lib/shape-data.json";
import { chainCode, chainDiff, minRotation, polygonMoments, huMoments, logHu, matchShapes, resampleClosed, contourDFT, reconstruct, fourierDescriptor, dist, transform, type P } from "@/lib/shape-ops";

type Mode = "chain" | "hu" | "fourier" | "match";
type Shape = { name: string; row: number; pts: P[] };
const SH = (DATA as unknown as { shapes: Shape[] }).shapes;
const NAMES = ["star", "gear", "bracket", "cross", "oval", "arrow"];

const seg = <T extends string>(lab: string, opts: [T, string][], v: T, set: (x: T) => void) => (
  <div className="ctl ctl-full"><span>{lab}</span>
    <div className="seg seg-small" role="radiogroup" aria-label={lab}>
      {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
    </div>
  </div>
);
const sl = (lab: string, v: number, set: (n: number) => void, min: number, max: number, st: number, unit = "") => (
  <label className="ctl ctl-wide"><span>{lab} <output>{v}{unit}</output></span><input type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={lab} /></label>
);
const bbox = (p: P[]) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
const path = (p: P[]) => p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("") + "Z";
/** An SVG panel framing one or more polygons. */
function Panel({ polys, label, children, pad = 4 }: { polys: { p: P[]; cls: string }[]; label: string; children?: React.ReactNode; pad?: number }) {
  const b = bbox(polys.flatMap((q) => q.p)), w = b[2] - b[0] + 2 * pad, h = b[3] - b[1] + 2 * pad;
  return (
    <figure className="sh-view">
      <svg viewBox={`${b[0] - pad} ${b[1] - pad} ${w} ${h}`} className="sh-svg" role="img" aria-label={label}>
        {polys.map((q, i) => <path key={i} d={path(q.p)} className={q.cls} />)}
        {children}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/** ShapeLab (Module 29) on the 12 contours of sample-shapes.png (precomputed by scripts/gen_shape_data.py). mode
 *  "chain": Freeman chain code, first difference, shape number. "hu": Hu moments of a shape and a rotated / scaled /
 *  mirrored copy, with matchShapes. "fourier": reconstruction from K harmonics and the descriptor. "match": rank the six
 *  reference shapes for a query by matchShapes I1–I3 and Fourier descriptors. */
export function ShapeLab({ mode = "hu", caption }: { mode?: Mode; caption?: string }) {
  return (
    <figure className="fig shapelab">
      {mode === "chain" ? <Chain /> : mode === "hu" ? <Hu /> : mode === "fourier" ? <Fourier /> : <Match />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const pick = (set: (n: number) => void, v: number, rows: number[] = [0, 1]) => (
  <div className="ctl ctl-full"><span>Shape</span>
    <div className="seg seg-small" role="radiogroup" aria-label="shape">
      {SH.map((s, i) => (rows.includes(s.row) ? <button key={i} type="button" role="radio" aria-checked={v === i} className={v === i ? "is-on" : ""} onClick={() => set(i)}>{s.name}{s.row ? " (2)" : ""}</button> : null))}
    </div>
  </div>
);

function Chain() {
  const [i, setI] = useState(2), s = SH[i], c = useMemo(() => chainCode(s.pts), [s]), d = useMemo(() => chainDiff(c), [c]), num = useMemo(() => minRotation(d), [d]);
  const hist = Array.from({ length: 8 }, (_, k) => c.filter((v) => v === k).length);
  const ARROW = ["→", "↗", "↑", "↖", "←", "↙", "↓", "↘"];
  const start = s.pts[0];
  return (
    <>
      <div className="sc-ctl">{pick(setI, i)}</div>
      <div className="sh-grid">
        <Panel polys={[{ p: s.pts, cls: "sh-a" }]} label={`${s.pts.length} contour pixels; red dot = start`}>
          {s.pts.map(([x, y], k) => <rect key={k} x={x - 0.5} y={y - 0.5} width={1} height={1} className="sh-px" />)}
          <circle cx={start[0]} cy={start[1]} r={1.6} className="sh-start" />
        </Panel>
        <div className="sh-hist" aria-label="direction histogram">
          {hist.map((n, k) => <div key={k} className="sh-bar"><i style={{ height: `${(100 * n) / Math.max(...hist)}%` }} /><span>{ARROW[k]} {k}</span><b>{n}</b></div>)}
        </div>
      </div>
      <p className="sh-read"><b>Chain code</b> (first 48 of {c.length}): {c.slice(0, 48).join("")}…</p>
      <p className="sh-read"><b>First difference</b> (rotation invariant): {d.slice(0, 48).join("")}…</p>
      <p className="sh-read"><b>Shape number</b> (smallest rotation, start invariant): {num.slice(0, 48).join("")}…</p>
    </>
  );
}

function Hu() {
  const [i, setI] = useState(2), [angle, setAngle] = useState(90), [scale, setScale] = useState(0.8), [mirror, setMirror] = useState(true);
  const s = SH[i], t = useMemo(() => transform(s.pts, angle, scale, mirror, 0, 0), [s, angle, scale, mirror]);
  const ha = useMemo(() => logHu(huMoments(polygonMoments(s.pts))), [s]), hb = useMemo(() => logHu(huMoments(polygonMoments(t))), [t]);
  const cA = transform(s.pts, 0, 1, false, 0, 0);
  return (
    <>
      <div className="sc-ctl">
        {pick(setI, i, [0])}
        {sl("rotation", angle, setAngle, 0, 360, 5, "°")}
        {sl("scale", scale, setScale, 0.3, 2, 0.05, "×")}
        <label className="ctl"><input type="checkbox" checked={mirror} onChange={() => setMirror(!mirror)} /> mirror</label>
      </div>
      <div className="sh-grid">
        <Panel polys={[{ p: cA, cls: "sh-a" }]} label="original contour" />
        <Panel polys={[{ p: t, cls: "sh-b" }]} label="transformed copy (exact polygon, not re-rasterised)" />
      </div>
      <table className="sh-table"><thead><tr><th>Hu</th>{ha.map((_, k) => <th key={k}>h{k + 1}</th>)}</tr></thead>
        <tbody>
          <tr><td>original</td>{ha.map((v, k) => <td key={k}>{v.toFixed(2)}</td>)}</tr>
          <tr><td>copy</td>{hb.map((v, k) => <td key={k} className={Math.abs(v - ha[k]) > 0.01 ? "sh-diff" : ""}>{v.toFixed(2)}</td>)}</tr>
        </tbody></table>
      <p className="sh-read">Values are −sign(h)·log₁₀|h|. matchShapes: I1 {matchShapes(s.pts, t, 1).toFixed(4)} · I2 {matchShapes(s.pts, t, 2).toFixed(4)} · I3 {matchShapes(s.pts, t, 3).toFixed(4)}. Mirroring flips the sign of h7 only.</p>
    </>
  );
}

function Fourier() {
  const [i, setI] = useState(0), [K, setK] = useState(4), n = 128;
  const s = SH[i], z = useMemo(() => resampleClosed(s.pts, n), [s]), F = useMemo(() => contourDFT(z), [z]), r = useMemo(() => reconstruct(F, K), [F, K]);
  const fd = useMemo(() => fourierDescriptor(s.pts, 64, 10), [s]);
  return (
    <>
      <div className="sc-ctl">{pick(setI, i, [0])}{sl("harmonics K (keep |k| ≤ K)", K, setK, 1, 40, 1)}</div>
      <div className="sh-grid">
        <Panel polys={[{ p: z, cls: "sh-a" }, { p: r, cls: "sh-b" }]} label={`grey: contour (${n} samples) · blue: reconstruction from ${2 * K + 1} coefficients`} />
        <div className="sh-hist" aria-label="Fourier descriptor">
          {fd.map((v, k) => <div key={k} className="sh-bar sh-bar-thin"><i style={{ height: `${Math.min(100, v * 400)}%` }} /><span>{k < 9 ? k + 2 : k - 19}</span></div>)}
        </div>
      </div>
      <p className="sh-read">Descriptor |F(k)| / |F(±1)| for k = 2 … 10 and −10 … −2: {fd.map((v) => v.toFixed(3)).join(" ")}</p>
    </>
  );
}

function Match() {
  const [q, setQ] = useState(8);
  const rows = useMemo(() => {
    const fq = fourierDescriptor(SH[q].pts);
    return SH.slice(0, 6).map((s, j) => ({ j, i1: matchShapes(SH[q].pts, s.pts, 1), i2: matchShapes(SH[q].pts, s.pts, 2), i3: matchShapes(SH[q].pts, s.pts, 3), fd: dist(fq, fourierDescriptor(s.pts)) }));
  }, [q]);
  const best = (k: "i1" | "i2" | "i3" | "fd") => rows.reduce((a, b) => (b[k] < a[k] ? b : a)).j;
  const truth = SH[q].name;
  return (
    <>
      <div className="sc-ctl">{pick(setQ, q, [1])}</div>
      <div className="sh-grid sh-grid-6">
        {SH.slice(0, 6).map((s, j) => <Panel key={j} polys={[{ p: transform(s.pts, 0, 1, false, 0, 0), cls: s.name === truth ? "sh-b" : "sh-a" }]} label={s.name} />)}
      </div>
      <table className="sh-table"><thead><tr><th>reference</th><th>I1</th><th>I2</th><th>I3</th><th>Fourier</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.j} className={NAMES[r.j] === truth ? "sh-true" : ""}><td>{NAMES[r.j]}</td>{(["i1", "i2", "i3", "fd"] as const).map((k) => <td key={k} className={best(k) === r.j ? (NAMES[r.j] === truth ? "sh-ok" : "sh-bad") : ""}>{r[k].toFixed(3)}</td>)}</tr>)}</tbody></table>
      <p className="sh-read">Query: the bottom-row {truth}. Smallest value per column is marked: green = correct match, red = wrong.</p>
    </>
  );
}
