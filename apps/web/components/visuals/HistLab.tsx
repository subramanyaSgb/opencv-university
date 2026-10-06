"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hist, cdf, equalizeLut, clahe, matchLut } from "@/lib/hist-ops";

type Op = "none" | "equalize" | "clahe" | "match";
const LABEL: Record<Op, string> = { none: "original", equalize: "equalizeHist", clahe: "CLAHE", match: "match to reference" };

function useGray(src: string) {
  const [g, setG] = useState<{ d: Uint8Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data;
      const d = new Uint8Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = Math.round(0.299 * p[4 * i] + 0.587 * p[4 * i + 1] + 0.114 * p[4 * i + 2]);
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

function HistPlot({ data, label }: { data: ArrayLike<number> | null; label: string }) {
  if (!data) return null;
  const h = hist(data), c = cdf(h), m = Math.max(...h, 1), n = data.length;
  const bars = h.map((v, i) => `M${i + 0.5},60 V${(60 - (56 * v) / m).toFixed(1)}`).join(" ");
  const line = c.map((v, i) => `${i ? "L" : "M"}${i + 0.5},${(60 - (56 * v) / n).toFixed(1)}`).join(" ");
  return (
    <figure className="hl-plot">
      <svg viewBox="0 0 256 60" preserveAspectRatio="none" aria-hidden="true"><path d={bars} className="hl-bars" /><path d={line} className="hl-cdf" /></svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/** HistLab: histogram and cumulative histogram before and after equalization, CLAHE or matching. */
export function HistLab({ ops = ["none", "equalize", "clahe", "match"], initial = "equalize", src = "/images/sample-plate-poor.png", refSrc = "/images/sample-scene.png", sources, caption }: { ops?: Op[]; initial?: Op; src?: string; refSrc?: string; sources?: { label: string; src: string }[]; caption?: string }) {
  const [op, setOp] = useState<Op>(initial);
  const [si, setSi] = useState(0);
  if (sources?.length) src = sources[si].src;
  const [clip, setClip] = useState(2);
  const [tiles, setTiles] = useState(8);
  const g = useGray(src);
  const r = useGray(refSrc);
  const out = useMemo(() => {
    if (!g) return null;
    if (op === "equalize") { const lut = equalizeLut(g.d); return Uint8Array.from(g.d, (v) => lut[v]); }
    if (op === "clahe") return clahe(g.d, g.w, g.h, clip, tiles, tiles);
    if (op === "match" && r) { const lut = matchLut(g.d, r.d); return Uint8Array.from(g.d, (v) => lut[v]); }
    return g.d;
  }, [g, r, op, clip, tiles]);
  const inRef = useRef<HTMLCanvasElement>(null), outRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!g || !out) return;
    for (const [cv, d] of [[inRef.current, g.d], [outRef.current, out]] as const) {
      const ctx = cv?.getContext("2d"); if (!ctx) continue;
      const im = ctx.createImageData(g.w, g.h);
      for (let i = 0; i < d.length; i++) im.data.set([d[i], d[i], d[i], 255], 4 * i);
      ctx.putImageData(im, 0, 0);
    }
  }, [g, out]);
  const stats = (d: ArrayLike<number> | null) => {
    if (!d) return "";
    let s = 0, s2 = 0; for (let i = 0; i < d.length; i++) { s += d[i]; s2 += d[i] * d[i]; }
    const m = s / d.length, used = hist(d).filter((v) => v > 0).length;
    return `mean ${m.toFixed(0)} · std ${Math.sqrt(s2 / d.length - m * m).toFixed(1)} · ${used} levels used`;
  };
  return (
    <figure className="fig histlab">
      {sources && sources.length > 1 && (
        <div className="ctl ctl-full"><span>Image</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Image">
            {sources.map((x, i) => <button key={x.src} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{x.label}</button>)}
          </div>
        </div>
      )}
      {ops.length > 1 && (
        <div className="ctl ctl-full"><span>Operation</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Operation">
            {ops.map((o) => <button key={o} type="button" role="radio" aria-checked={op === o} className={op === o ? "is-on" : ""} onClick={() => setOp(o)}>{LABEL[o]}</button>)}
          </div>
        </div>
      )}
      {op === "clahe" && (
        <div className="sc-ctl">
          <label className="ctl ctl-wide"><span>clipLimit <output>{clip}</output></span><input type="range" min={0.5} max={8} step={0.5} value={clip} onChange={(e) => setClip(Number(e.target.value))} aria-label="Clip limit" /></label>
          <div className="ctl ctl-full"><span>tileGridSize</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Tiles">
              {[2, 4, 8].map((t) => <button key={t} type="button" role="radio" aria-checked={tiles === t} className={tiles === t ? "is-on" : ""} onClick={() => setTiles(t)}>{t} × {t}</button>)}
            </div>
          </div>
        </div>
      )}
      <div className={`hl-grid${ops.length === 1 && op === "none" ? " is-single" : ""}`}>
        <div><canvas ref={inRef} width={g?.w ?? 1} height={g?.h ?? 1} className="hl-img" role="img" aria-label="Input" /><HistPlot data={g?.d ?? null} label={`input: ${stats(g?.d ?? null)}`} /></div>
        <div className="hl-out"><canvas ref={outRef} width={g?.w ?? 1} height={g?.h ?? 1} className="hl-img" role="img" aria-label="Output" /><HistPlot data={out} label={`${LABEL[op]}: ${stats(out)}`} /></div>
      </div>
      <div className="pg-readout"><span>Bars: histogram (how many pixels have each value). Line: cumulative histogram (fraction of pixels at or below each value). {op === "match" ? "Matching makes the line follow the reference's line." : op === "clahe" ? "CLAHE straightens the line inside each tile, with a limited slope." : "Equalization makes the line as straight as possible."}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
