"use client";

import { useState } from "react";
import { blobPixel, PRESETS } from "@/lib/blob-ops";

const SWATCHES: { name: string; bgr: [number, number, number] }[] = [
  { name: "red label", bgr: [40, 40, 200] },
  { name: "blue part", bgr: [190, 90, 30] },
  { name: "grey steel", bgr: [128, 128, 128] },
  { name: "white", bgr: [255, 255, 255] },
];
const f = (v: number) => (Math.abs(v) < 1e-9 ? "0" : Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3));

/** BlobLab: one pixel through cv2.dnn.blobFromImage: channel order, mean, scale, NCHW layout. */
export function BlobLab({ caption }: { caption?: string }) {
  const [px, setPx] = useState(0);
  const [pre, setPre] = useState("pm1");
  const [swapOverride, setSwapOverride] = useState<boolean | null>(null);
  const preset = PRESETS.find((p) => p.key === pre)!;
  const swapRB = swapOverride ?? preset.params.swapRB;
  const bgr = SWATCHES[px].bgr;
  const r = blobPixel(bgr, { ...preset.params, swapRB });
  const names = swapRB ? ["R", "G", "B"] : ["B", "G", "R"];
  const wrong = swapRB !== preset.params.swapRB;
  return (
    <figure className="fig bloblab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Pixel</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Pixel">
            {SWATCHES.map((s, i) => <button key={s.name} type="button" role="radio" aria-checked={px === i} className={px === i ? "is-on" : ""} onClick={() => setPx(i)}><i className="bb-sw" style={{ background: `rgb(${s.bgr[2]},${s.bgr[1]},${s.bgr[0]})` }} />{s.name}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Model expects</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Preprocessing preset">
            {PRESETS.map((p) => <button key={p.key} type="button" role="radio" aria-checked={pre === p.key} className={pre === p.key ? "is-on" : ""} onClick={() => { setPre(p.key); setSwapOverride(null); }}>{p.label}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>swapRB</span>
          <div className="seg seg-small" role="radiogroup" aria-label="swapRB">
            {[true, false].map((v) => <button key={String(v)} type="button" role="radio" aria-checked={swapRB === v} className={swapRB === v ? "is-on" : ""} onClick={() => setSwapOverride(v)}>{v ? "True" : "False"}</button>)}
          </div>
        </div>
      </div>
      <div className="pg-readout"><span>{preset.note}</span></div>
      <div className="bb-wrap">
        <table className="bb-table">
          <thead><tr><th>Step</th><th>ch 0</th><th>ch 1</th><th>ch 2</th></tr></thead>
          <tbody>
            <tr><td>image pixel (B, G, R)</td>{bgr.map((v, i) => <td key={i}>{v}</td>)}</tr>
            <tr><td>{swapRB ? "swapRB → (R, G, B)" : "kept (B, G, R)"}</td>{r.ordered.map((v, i) => <td key={i}>{names[i]} {v}</td>)}</tr>
            <tr><td>− mean ({preset.params.mean.map((m) => f(m)).join(", ")})</td>{r.centred.map((v, i) => <td key={i}>{f(v)}</td>)}</tr>
            <tr><td>× scale</td>{r.out.map((v, i) => <td key={i}><strong>{f(v)}</strong></td>)}</tr>
          </tbody>
        </table>
      </div>
      <ul className="ap-stats">
        <li><span>Blob layout</span><strong>(1, 3, H, W)</strong><em>NCHW: plane 0 = {names[0]}, plane 1 = {names[1]}, plane 2 = {names[2]}</em></li>
        <li><span>Matches the model?</span><strong className={wrong ? "bl-bad" : "bl-ok"}>{wrong ? "No: R and B swapped" : "Yes"}</strong><em>{wrong ? "the network sees a red part as blue: accuracy drops, often silently" : "same channel order and scaling as in training"}</em></li>
      </ul>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
