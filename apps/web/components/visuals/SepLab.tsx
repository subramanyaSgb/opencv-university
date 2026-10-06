"use client";

import { useMemo, useState } from "react";
import { separability, preset } from "@/lib/sep-ops";

const NAMES: { k: string; label: string }[] = [
  { k: "box", label: "box" },
  { k: "gauss", label: "Gaussian" },
  { k: "sobel", label: "Sobel-type derivative" },
  { k: "laplace", label: "Laplacian (4-neighbour)" },
  { k: "disk", label: "disk (round average)" },
];

/** SepLab (17.4): is a kernel an outer product of two 1-D kernels? Singular values, the 1-D factors, and the cost of 2-D vs two 1-D passes. */
export function SepLab({ caption }: { caption?: string }) {
  const [name, setName] = useState("gauss");
  const [k, setK] = useState(7);
  const K = useMemo(() => preset(name, k), [name, k]);
  const s = useMemo(() => separability(K), [K]);
  const mx = Math.max(...K.flat().map(Math.abs), 1e-12);
  const rank = s.sv.filter((v) => v > 1e-6 * s.sv[0]).length;
  const cell = (v: number) => (v >= 0 ? `rgba(37, 99, 235, ${(0.12 + (0.88 * v) / mx).toFixed(2)})` : `rgba(220, 38, 38, ${(0.12 + (0.88 * -v) / mx).toFixed(2)})`);
  const f = (v: number) => (Math.abs(v) < 1e-9 ? "0" : Math.abs(v) >= 10 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(1) : v.toFixed(3));
  const sep = s.rank1Share > 0.999999;
  return (
    <figure className="fig seplab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Kernel</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Kernel">
            {NAMES.map((n) => <button key={n.k} type="button" role="radio" aria-checked={name === n.k} className={name === n.k ? "is-on" : ""} onClick={() => { setName(n.k); if (n.k === "laplace") setK(3); }}>{n.label}</button>)}
          </div>
        </div>
        {name !== "laplace" && <label className="ctl ctl-wide"><span>Size <output>{k} × {k}</output></span><input type="range" min={3} max={15} step={2} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Kernel size" /></label>}
      </div>
      <div className="sp-grid">
        <div className="sp-mat" style={{ gridTemplateColumns: `repeat(${K.length}, minmax(0, 1fr))` }} aria-label="Kernel weights">
          {K.flat().map((v, i) => <span key={i} style={{ background: cell(v) }} title={String(v)}>{K.length <= 7 ? f(v) : ""}</span>)}
        </div>
        <div className="sp-info">
          <p><b>Singular values</b></p>
          <div className="sp-bars">{s.sv.map((v, i) => <div key={i}><b style={{ width: `${(100 * v) / (s.sv[0] || 1)}%` }} /><em>{v < 1e-9 ? "0" : v.toPrecision(3)}</em></div>)}</div>
          <p>Rank {rank}: {sep ? <span className="sp-ok">separable, K = column · row</span> : <span className="sp-bad">not separable{rank === 2 ? " (sum of two separable kernels)" : ""}; best rank-1 approximation keeps {(100 * s.rank1Share).toFixed(1)} % of its energy</span>}</p>
          {sep && <p className="sp-vec">column: [{s.col.map((v) => f(v / Math.sqrt(Math.abs(s.sv[0])))).join(", ")}]<br />row: [{s.row.map((v) => f(v * Math.sqrt(Math.abs(s.sv[0])))).join(", ")}]</p>}
          <p className="sp-cost">Multiplications per pixel: 2-D {k * k} · two 1-D passes {2 * k}{sep ? ` (${((k * k) / (2 * k)).toFixed(1)}× fewer)` : ""}</p>
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
