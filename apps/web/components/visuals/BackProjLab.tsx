"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scene, OBJECTS, W, H } from "@/lib/inrange-ops";
import { hsv8ToBgr } from "@/lib/hsv-ops";
import { toHsv, hsHist, normalizeMinMax, backProject, patch, hBin, sBin } from "@/lib/backproj-ops";

const MODELS = [
  { id: 1, label: "orange cap", cx: 34, cy: 40 },
  { id: 2, label: "red cap", cx: 75, cy: 30 },
  { id: 4, label: "green cap", cx: 40, cy: 75 },
  { id: 5, label: "cardboard", cx: 105, cy: 75 },
];
const BINS = [
  { l: "H only, 180", h: 180, s: 1 },
  { l: "H × S, 30 × 32", h: 30, s: 32 },
  { l: "H × S, 8 × 8", h: 8, s: 8 },
];
const R = 6;

function HistGrid({ hist, hBins, sBins, sel, onPick, log }: { hist: Float64Array; hBins: number; sBins: number; sel?: number; onPick?: (i: number) => void; log?: boolean }) {
  let mx = 0; for (const v of hist) mx = Math.max(mx, v);
  const cw = 360 / hBins, ch = sBins === 1 ? 60 : 120 / sBins;
  return (
    <svg viewBox={`0 0 360 ${sBins === 1 ? 74 : 134}`} className="bj-hist" role="img" aria-label="Model histogram: hue left to right, saturation bottom to top">
      <rect x={0} y={0} width={360} height={sBins === 1 ? 60 : 120} className="bj-hframe" />
      {Array.from(hist, (v, i) => {
        if (!v) return null;
        const hb = Math.floor(i / sBins), sb = i % sBins;
        const f = log ? Math.log1p(v) / Math.log1p(mx) : v / mx;
        const [b, g, r] = hsv8ToBgr([Math.round((hb + 0.5) * (180 / hBins)), sBins === 1 ? 255 : Math.round((sb + 0.5) * (256 / sBins)), 235]);
        const y = sBins === 1 ? 60 - 60 * f : 120 - (sb + 1) * ch;
        return <rect key={i} x={hb * cw} y={y} width={Math.max(cw, 1)} height={sBins === 1 ? 60 * f : ch} fill={`rgb(${r},${g},${b})`} opacity={sBins === 1 ? 1 : 0.15 + 0.85 * f}
          className={sel === i ? "bj-sel" : undefined} onClick={onPick ? () => onPick(i) : undefined} style={onPick ? { cursor: "pointer" } : undefined} />;
      })}
      {Array.from({ length: 7 }, (_, k) => {
        const [b, g, r] = hsv8ToBgr([k * 30, 255, 235]);
        return <rect key={`a${k}`} x={k * 60} y={sBins === 1 ? 64 : 124} width={60} height={8} fill={`rgb(${r},${g},${b})`} />;
      })}
    </svg>
  );
}

/**
 * BackProjLab (12.5, 12.6): the shaded cap scene from 10.7.
 * mode "backproject": pick a model patch, a histogram layout and a threshold; see the model histogram, the back-projection and per-object hits.
 * mode "hist2d": the hue–saturation histogram of the whole scene; click a cell to see which pixels fall in it.
 */
export function BackProjLab({ mode = "backproject", caption }: { mode?: "backproject" | "hist2d"; caption?: string }) {
  const { bgr, id } = useMemo(scene, []);
  const hsv = useMemo(() => toHsv(bgr), [bgr]);
  const [mi, setMi] = useState(0);
  const [bi, setBi] = useState(1);
  const [thr, setThr] = useState(50);
  const [log, setLog] = useState(true);
  const [sel, setSel] = useState<number | undefined>(undefined);
  const model = MODELS[mi], spec = mode === "hist2d" ? { hBins: 30, sBins: 32 } : { hBins: BINS[bi].h, sBins: BINS[bi].s };
  const hist = useMemo(() => {
    const raw = hsHist(hsv, spec, mode === "hist2d" ? undefined : patch(W, model.cx, model.cy, R));
    return mode === "hist2d" ? raw : normalizeMinMax(raw);
  }, [hsv, spec.hBins, spec.sBins, model, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const bp = useMemo(() => (mode === "hist2d" ? null : backProject(hsv, hist, spec)), [hsv, hist, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const imgRef = useRef<HTMLCanvasElement>(null), bpRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = imgRef.current?.getContext("2d");
    if (!ctx) return;
    const im = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      let on = true;
      if (mode === "hist2d" && sel !== undefined) on = hBin(hsv.h[i], spec.hBins) * spec.sBins + sBin(hsv.s[i], spec.sBins) === sel;
      const k = on ? 1 : 0.25;
      im.data.set([bgr[3 * i + 2] * k, bgr[3 * i + 1] * k, bgr[3 * i] * k, 255], 4 * i);
    }
    ctx.putImageData(im, 0, 0);
    if (mode === "backproject") { ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 1; ctx.strokeRect(model.cx - R - 0.5, model.cy - R - 0.5, 2 * R + 2, 2 * R + 2); }
  }, [bgr, hsv, mode, sel, model, spec.hBins, spec.sBins]);
  useEffect(() => {
    const ctx = bpRef.current?.getContext("2d");
    if (!ctx || !bp) return;
    const im = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const v = bp[i];
      im.data.set(v > thr ? [v, v * 0.25, v] : [v, v, v], 4 * i);
      im.data[4 * i + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
  }, [bp, thr]);
  const rows = [...OBJECTS.map((o) => ({ id: o.id, name: o.name, bgr: o.bgr })), { id: 0, name: "belt (background)", bgr: [118, 120, 122] as [number, number, number] }];
  const tally = (o: number) => {
    let hit = 0, tot = 0;
    for (let i = 0; i < id.length; i++) if (id[i] === o) { tot++; if (mode === "hist2d" ? sel !== undefined && hBin(hsv.h[i], spec.hBins) * spec.sBins + sBin(hsv.s[i], spec.sBins) === sel : bp![i] > thr) hit++; }
    return (100 * hit) / Math.max(tot, 1);
  };
  const selInfo = sel !== undefined ? (() => {
    const hb = Math.floor(sel / spec.sBins), sb = sel % spec.sBins;
    return `bin H ${hb * 6}–${hb * 6 + 5}, S ${sb * 8}–${sb * 8 + 7}: ${hist[sel]} pixels`;
  })() : "click a cell of the histogram";
  return (
    <figure className="fig backprojlab">
      {mode === "backproject" && (
        <div className="sc-ctl">
          <div className="ctl ctl-full"><span>Model patch</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Model">
              {MODELS.map((m, i) => <button key={m.label} type="button" role="radio" aria-checked={mi === i} className={mi === i ? "is-on" : ""} onClick={() => setMi(i)}>{m.label}</button>)}
            </div>
          </div>
          <div className="ctl ctl-full"><span>Histogram</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Histogram bins">
              {BINS.map((b, i) => <button key={b.l} type="button" role="radio" aria-checked={bi === i} className={bi === i ? "is-on" : ""} onClick={() => setBi(i)}>{b.l}</button>)}
            </div>
          </div>
          <label className="ctl ctl-wide"><span>Threshold on the back-projection <output>{thr}</output></span><input type="range" min={0} max={254} value={thr} onChange={(e) => setThr(Number(e.target.value))} aria-label="Threshold" /></label>
        </div>
      )}
      {mode === "hist2d" && (
        <div className="sc-ctl">
          <div className="ctl ctl-full"><span>Cell shading</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Scale">
              {[false, true].map((v) => <button key={String(v)} type="button" role="radio" aria-checked={log === v} className={log === v ? "is-on" : ""} onClick={() => setLog(v)}>{v ? "log(1 + count)" : "count"}</button>)}
            </div>
          </div>
        </div>
      )}
      <div className="bj-grid">
        <div><canvas ref={imgRef} width={W} height={H} className="bj-img" role="img" aria-label="Scene" /><p className="bj-cap">{mode === "backproject" ? "Scene, model patch in magenta" : selInfo}</p></div>
        <div>
          <HistGrid hist={hist} hBins={spec.hBins} sBins={spec.sBins} log={mode === "hist2d" ? log : false} sel={sel} onPick={mode === "hist2d" ? (i) => setSel(i === sel ? undefined : i) : undefined} />
          <p className="bj-cap">{mode === "backproject" ? `Model histogram (normalised 0–255): hue →${spec.sBins > 1 ? ", saturation ↑" : ""}` : "H × S histogram, 30 × 32 bins: hue →, saturation ↑"}</p>
        </div>
        {mode === "backproject" && <div><canvas ref={bpRef} width={W} height={H} className="bj-img" role="img" aria-label="Back-projection" /><p className="bj-cap">Back-projection (bright = likely); above threshold in magenta</p></div>}
      </div>
      {(mode === "backproject" || sel !== undefined) && (
        <ul className="ir-hits">
          {rows.map((o) => { const pct = tally(o.id); return <li key={o.id}><i style={{ background: `rgb(${o.bgr[2]},${o.bgr[1]},${o.bgr[0]})` }} /><span>{o.name}</span><b style={{ width: `${pct}%` }} /><em>{pct.toFixed(0)} %</em></li>; })}
        </ul>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
