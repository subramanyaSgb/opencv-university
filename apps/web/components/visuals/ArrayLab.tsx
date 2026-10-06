"use client";

import { useState } from "react";
import { ITEMSIZE, nbytes, offset, OPENCV_OK, RANGE, strides, type DType } from "@/lib/array-ops";

const DTYPES: DType[] = ["uint8", "uint16", "int16", "int32", "float32", "float64", "bool"];
const CH = ["B", "G", "R"];

/** ArrayLab: shape and dtype of a small image array, its strides and where each value sits in memory. */
export function ArrayLab({ caption }: { caption?: string }) {
  const [h, setH] = useState(2);
  const [w, setW] = useState(3);
  const [c, setC] = useState(3);
  const [dt, setDt] = useState<DType>("uint8");
  const [sel, setSel] = useState<[number, number, number]>([1, 2, 0]);
  const shape = c === 1 ? [h, w] : [h, w, c];
  const it = ITEMSIZE[dt];
  const st = strides(shape, it);
  const idx = c === 1 ? [Math.min(sel[0], h - 1), Math.min(sel[1], w - 1)] : [Math.min(sel[0], h - 1), Math.min(sel[1], w - 1), Math.min(sel[2], c - 1)];
  const off = offset(idx, st);
  const n = h * w * c;
  const shapeTxt = `(${shape.join(", ")})`;
  return (
    <figure className="fig arraylab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Rows (height) <output>{h}</output></span><input type="range" min={1} max={4} value={h} onChange={(e) => setH(Number(e.target.value))} aria-label="Rows" /></label>
        <label className="ctl ctl-wide"><span>Columns (width) <output>{w}</output></span><input type="range" min={1} max={5} value={w} onChange={(e) => setW(Number(e.target.value))} aria-label="Columns" /></label>
        <div className="ctl ctl-full"><span>Channels</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Channels">
            {[1, 3].map((k) => <button key={k} type="button" role="radio" aria-checked={c === k} className={c === k ? "is-on" : ""} onClick={() => setC(k)}>{k === 1 ? "1 (gray)" : "3 (BGR)"}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>dtype</span>
          <div className="seg seg-small" role="radiogroup" aria-label="dtype">
            {DTYPES.map((d) => <button key={d} type="button" role="radio" aria-checked={dt === d} className={dt === d ? "is-on" : ""} onClick={() => setDt(d)}>{d}</button>)}
          </div>
        </div>
      </div>
      <div className="vis-title">The image: click a value</div>
      <div className="al-grid" style={{ gridTemplateColumns: `repeat(${w}, auto)` }}>
        {Array.from({ length: h * w }, (_, k) => {
          const r = Math.floor(k / w), col = k % w;
          return (
            <div key={k} className="al-px">
              {Array.from({ length: c }, (_, ch) => {
                const on = idx[0] === r && idx[1] === col && (c === 1 || idx[2] === ch);
                return <button key={ch} type="button" className={`al-v al-c${c === 1 ? "g" : ch}${on ? " al-on" : ""}`} onClick={() => setSel([r, col, ch])} aria-label={`row ${r}, column ${col}${c === 3 ? `, channel ${CH[ch]}` : ""}`}>{c === 1 ? `${r},${col}` : CH[ch]}</button>;
              })}
            </div>
          );
        })}
      </div>
      <div className="vis-title">Memory (one row of bytes, C order)</div>
      <div className="al-mem" role="img" aria-label={`${n * it} bytes in memory`}>
        {Array.from({ length: n }, (_, k) => {
          const ch = c === 1 ? -1 : k % c;
          const on = k * it === off;
          return <span key={k} className={`al-cell al-c${ch < 0 ? "g" : ch}${on ? " al-on" : ""}`} style={{ width: `${1.15 * it + 0.6}rem` }} title={`byte ${k * it}`}>{k * it}</span>;
        })}
      </div>
      <ul className="ap-stats">
        <li><span>img.shape / img.dtype</span><strong>{shapeTxt} {dt}</strong><em>{RANGE[dt]}</em></li>
        <li><span>img.strides</span><strong>({st.join(", ")})</strong><em>bytes to step one row, column{c === 3 ? ", channel" : ""}</em></li>
        <li><span>Offset of img[{idx.join(", ")}]</span><strong>{idx.map((v, i) => `${v}·${st[i]}`).join(" + ")} = {off}</strong><em>img.nbytes = {nbytes(shape, it)}</em></li>
        <li><span>1920 × 1080 × {c} {dt}</span><strong>{(nbytes(c === 1 ? [1080, 1920] : [1080, 1920, 3], it) / 1e6).toFixed(1)} MB</strong><em>OpenCV support: {OPENCV_OK[dt]}</em></li>
      </ul>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
