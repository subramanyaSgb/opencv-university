"use client";

import { useState } from "react";
import { broadcast, parseShape } from "@/lib/broadcast-ops";

const PRESETS: { a: string; b: string; what: string }[] = [
  { a: "200, 320, 3", b: "3", what: "subtract a per-channel mean (B, G, R)" },
  { a: "200, 320", b: "320", what: "one value per column (e.g. column gain)" },
  { a: "200, 320", b: "200, 1", what: "one value per row" },
  { a: "200, 320", b: "200", what: "per-row values without the extra axis" },
  { a: "200, 320, 3", b: "200, 320", what: "a 2-D mask on a colour image" },
  { a: "200, 320, 3", b: "200, 320, 1", what: "the same mask with a channel axis" },
];

/** BroadcastLab: line up two shapes from the right and see whether NumPy can combine them, and the result shape. */
export function BroadcastLab({ caption }: { caption?: string }) {
  const [a, setA] = useState(PRESETS[0].a);
  const [b, setB] = useState(PRESETS[0].b);
  const sa = parseShape(a), sb = parseShape(b);
  const r = sa && sb ? broadcast(sa, sb) : { error: "write shapes as numbers separated by commas" };
  const n = Math.max(sa?.length ?? 0, sb?.length ?? 0, 1);
  const pad = (s: number[] | null) => (s ? Array(n - s.length).fill(null).concat(s) : Array(n).fill(null));
  const ra = pad(sa), rb = pad(sb), rr = "shape" in r ? pad(r.shape) : Array(n).fill(null);
  const cell = (v: number | null, i: number, other: (number | null)[]) => {
    const o = other[i];
    const ok = v === null || o === null || v === o || v === 1 || o === 1;
    return <span key={i} className={`bc-cell${v === null ? " bc-none" : ""}${!ok ? " bc-bad" : v === 1 && o !== null && o !== 1 ? " bc-stretch" : ""}`}>{v === null ? "·" : v}</span>;
  };
  return (
    <figure className="fig broadcastlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Examples</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Examples">
            {PRESETS.map((p, i) => <button key={i} type="button" role="radio" aria-checked={a === p.a && b === p.b} className={a === p.a && b === p.b ? "is-on" : ""} onClick={() => { setA(p.a); setB(p.b); }}>{`(${p.a}) & (${p.b})`}</button>)}
          </div>
        </div>
        <label className="ctl"><span>Shape of a</span><input className="bc-in" value={a} onChange={(e) => setA(e.target.value)} aria-label="Shape of a" /></label>
        <label className="ctl"><span>Shape of b</span><input className="bc-in" value={b} onChange={(e) => setB(e.target.value)} aria-label="Shape of b" /></label>
      </div>
      <div className="bc-table" style={{ gridTemplateColumns: `6rem repeat(${n}, 3.6rem)` }}>
        <span className="bc-lab">a</span>{ra.map((v, i) => cell(v, i, rb))}
        <span className="bc-lab">b</span>{rb.map((v, i) => cell(v, i, ra))}
        <span className="bc-lab">a + b</span>{rr.map((v, i) => <span key={i} className="bc-cell bc-res">{v === null ? ("error" in r ? "✗" : "·") : v}</span>)}
      </div>
      <div className="pg-readout" aria-live="polite">
        <span>{"shape" in r ? <>Works: result shape <strong>({r.shape.join(", ")})</strong>. Amber cells of size 1 are stretched (repeated) to match, without copying data.</> : <>Error: {r.error}.</>} {(() => { const w = PRESETS.find((p) => p.a === a && p.b === b)?.what; return w ? `Use: ${w}.` : ""; })()}</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
