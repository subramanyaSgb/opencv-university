"use client";

import { useState } from "react";
import { indices, text, type Slice } from "@/lib/slice-ops";

const H = 6, W = 8;
const base = () => Array.from({ length: H }, (_, r) => Array.from({ length: W }, (_, c) => 10 * r + c));
type Field = "start" | "stop" | "step";

function SliceCtl({ label, s, set, n }: { label: string; s: Slice; set: (s: Slice) => void; n: number }) {
  const field = (f: Field, min: number, max: number) => {
    const v = s[f];
    return (
      <label className="sl2-f">
        <span>{f}</span>
        <select value={v === null ? "none" : String(v)} onChange={(e) => set({ ...s, [f]: e.target.value === "none" ? (f === "step" ? 1 : null) : Number(e.target.value) })} aria-label={`${label} ${f}`}>
          {f !== "step" && <option value="none">(empty)</option>}
          {Array.from({ length: max - min + 1 }, (_, k) => min + k).filter((x) => !(f === "step" && x === 0)).map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </label>
    );
  };
  return (
    <div className="sl2-ctl"><strong>{label}</strong>{field("start", -n, n)}{field("stop", -n, n)}{field("step", -3, 3)}</div>
  );
}

/** SliceLab: pick row and column slices of a small array, see which values they select, and write through the view. */
export function SliceLab({ caption }: { caption?: string }) {
  const [rs, setRs] = useState<Slice>({ start: 1, stop: 4, step: 1 });
  const [cs, setCs] = useState<Slice>({ start: 2, stop: null, step: 2 });
  const [copy, setCopy] = useState(false);
  const [written, setWritten] = useState(false);
  const ri = indices(H, rs), ci = indices(W, cs);
  const sel = new Set(ri.flatMap((r) => ci.map((c) => `${r}-${c}`)));
  const arr = base();
  if (written && !copy) ri.forEach((r) => ci.forEach((c) => { arr[r][c] = 0; }));
  const expr = `a[${text(rs)}, ${text(cs)}]`;
  return (
    <figure className="fig slicelab">
      <div className="sl2-ctls">
        <SliceCtl label="rows" s={rs} set={(s) => { setRs(s); setWritten(false); }} n={H} />
        <SliceCtl label="cols" s={cs} set={(s) => { setCs(s); setWritten(false); }} n={W} />
      </div>
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Take it as</span>
          <div className="seg seg-small" role="radiogroup" aria-label="View or copy">
            {([[false, "a view"], [true, "a copy (.copy())"]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={copy === k} className={copy === k ? "is-on" : ""} onClick={() => { setCopy(k); setWritten(false); }}>{l}</button>)}
          </div>
        </div>
        <div className="ctl"><button type="button" className="hl-reset" onClick={() => setWritten(!written)}>{written ? "Undo" : "Run  part[:] = 0"}</button></div>
      </div>
      <div className="sl2-wrap">
        <div>
          <div className="vis-title">a (6 × 8): values = 10 · row + column</div>
          <div className="sl2-grid" style={{ gridTemplateColumns: `repeat(${W}, 2.1rem)` }}>
            {arr.flatMap((row, r) => row.map((v, c) => <span key={`${r}-${c}`} className={`sl2-cell${sel.has(`${r}-${c}`) ? " sl2-sel" : ""}${v === 0 && written && !copy && sel.has(`${r}-${c}`) ? " sl2-zero" : ""}`}>{v}</span>))}
          </div>
        </div>
      </div>
      <ul className="ap-stats">
        <li><span>part = {expr}{copy ? ".copy()" : ""}</span><strong>shape ({ri.length}, {ci.length})</strong><em>rows {JSON.stringify(ri)}, columns {JSON.stringify(ci)}</em></li>
        <li><span>After part[:] = 0</span><strong>{!written ? "–" : copy ? "a unchanged" : "a changed!"}</strong><em>{copy ? "the copy has its own memory" : "a view shares memory with a"}</em></li>
      </ul>
      <div className="pg-readout"><span>start is included, stop is excluded, negative numbers count from the end, a negative step walks backwards. Basic slices are views: writing to them writes to the original.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
