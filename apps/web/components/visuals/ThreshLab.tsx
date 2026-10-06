"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { histogram, segment, metrics, type Method } from "@/lib/thresh-ops";

const LABEL: Record<Method, string> = {
  manual: "manual", otsu: "Otsu", triangle: "triangle", kapur: "entropy (Kapur)", mean: "adaptive mean", gauss: "adaptive Gaussian",
  niblack: "Niblack", sauvola: "Sauvola", hysteresis: "hysteresis",
};
type Src = { label: string; src: string; gt?: string; dark?: boolean };
const DEFAULT_SOURCES: Src[] = [
  { label: "printed label, uneven light", src: "/images/sample-print-uneven.png", gt: "/images/sample-print-uneven-gt.png", dark: true },
  { label: "well-lit plate", src: "/images/sample-plate-good.png", gt: "/images/sample-plate-crack-mask.png", dark: true },
  { label: "badly lit plate", src: "/images/sample-plate-poor.png", gt: "/images/sample-plate-crack-mask.png", dark: true },
];

function useGray(src?: string) {
  const [g, setG] = useState<{ d: Uint8Array; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!src) { setG(null); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Uint8Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = Math.round(0.299 * p[4 * i] + 0.587 * p[4 * i + 1] + 0.114 * p[4 * i + 2]);
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

/** ThreshLab (Module 13): global, local and hysteresis thresholds on an image with ground truth; histogram, mask, error view, metrics. */
export function ThreshLab({ methods = ["manual", "otsu", "triangle", "kapur"], initial, sources = DEFAULT_SOURCES, initialSource = 0, initialT = 128, initialStrong = 60, initialWeak = 100, caption }: { methods?: Method[]; initial?: Method; sources?: Src[]; initialSource?: number; initialT?: number; initialStrong?: number; initialWeak?: number; caption?: string }) {
  const [si, setSi] = useState(initialSource);
  const [m, setM] = useState<Method>(initial ?? methods[0]);
  const [t, setT] = useState(initialT);
  const [block, setBlock] = useState(25);
  const [C, setC] = useState(10);
  const [kN, setKN] = useState(-0.2);
  const [kS, setKS] = useState(0.2);
  const [ts, setTs] = useState(initialStrong);
  const [tw, setTw] = useState(initialWeak);
  const [view, setView] = useState<"mask" | "errors">("errors");
  const s = sources[si];
  const g = useGray(s.src), gt = useGray(s.gt);
  const res = useMemo(() => (g ? segment(g.d, g.w, g.h, m, { t, dark: s.dark ?? true, block, C, k: m === "niblack" ? kN : kS, ts, tw }) : null), [g, m, t, block, C, kN, kS, ts, tw, s.dark]);
  const q = res && gt ? metrics(res.mask, gt.d) : null;
  const inRef = useRef<HTMLCanvasElement>(null), outRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!g || !res) return;
    const a = inRef.current?.getContext("2d"), b = outRef.current?.getContext("2d");
    if (!a || !b) return;
    const ia = a.createImageData(g.w, g.h), ib = b.createImageData(g.w, g.h);
    for (let i = 0; i < g.d.length; i++) {
      const v = g.d[i], on = res.mask[i];
      ia.data.set([v, v, v, 255], 4 * i);
      let px: number[];
      if (view === "errors" && gt) {
        const truth = gt.d[i] > 0;
        px = on && truth ? [20, 20, 20] : on ? [230, 40, 40] : truth ? [40, 110, 240] : [245, 245, 245];
      } else px = on ? [20, 20, 20] : [245, 245, 245];
      ib.data.set([px[0], px[1], px[2], 255], 4 * i);
    }
    a.putImageData(ia, 0, 0); b.putImageData(ib, 0, 0);
  }, [g, gt, res, view]);
  const h = useMemo(() => (g ? histogram(g.d) : null), [g]);
  const shownT = m === "manual" ? t : res && Number.isFinite(res.t) ? res.t : null;
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step = 1, fmt = (x: number) => String(x)) => (
    <label className="ctl ctl-wide"><span>{label} <output>{fmt(v)}</output></span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  const hp = h ? (() => { const mx = Math.max(...h, 1); return h.map((v, i) => `M${i + 0.5},60 V${(60 - (56 * Math.sqrt(v)) / Math.sqrt(mx)).toFixed(1)}`).join(" "); })() : "";
  return (
    <figure className="fig threshlab">
      <div className="sc-ctl">
        {sources.length > 1 && (
          <div className="ctl ctl-full"><span>Image</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Image">
              {sources.map((x, i) => <button key={x.src} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{x.label}</button>)}
            </div>
          </div>
        )}
        {methods.length > 1 && (
          <div className="ctl ctl-full"><span>Method</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Method">
              {methods.map((x) => <button key={x} type="button" role="radio" aria-checked={m === x} className={m === x ? "is-on" : ""} onClick={() => setM(x)}>{LABEL[x]}</button>)}
            </div>
          </div>
        )}
        {m === "manual" && sl("Threshold T", t, setT, 0, 255)}
        {(m === "mean" || m === "gauss" || m === "niblack" || m === "sauvola") && sl("Block size", block, setBlock, 3, 75, 2, (x) => `${x} × ${x}`)}
        {(m === "mean" || m === "gauss") && sl("C (subtracted from the local mean)", C, setC, -10, 40)}
        {m === "niblack" && sl("k (T = mean + k · std)", kN, setKN, -1, 0.5, 0.05, (x) => x.toFixed(2))}
        {m === "sauvola" && sl("k (T = mean · (1 + k · (std/128 − 1)))", kS, setKS, 0, 0.8, 0.05, (x) => x.toFixed(2))}
        {m === "hysteresis" && sl("Strong threshold (seeds)", ts, setTs, 0, 255)}
        {m === "hysteresis" && sl("Weak threshold (grow)", tw, setTw, 0, 255)}
        {s.gt && (
          <div className="ctl ctl-full"><span>Result view</span>
            <div className="seg seg-small" role="radiogroup" aria-label="View">
              {(["mask", "errors"] as const).map((v) => <button key={v} type="button" role="radio" aria-checked={view === v} className={view === v ? "is-on" : ""} onClick={() => setView(v)}>{v === "mask" ? "binary mask" : "errors vs ground truth"}</button>)}
            </div>
          </div>
        )}
      </div>
      <div className="th-grid">
        <div><canvas ref={inRef} width={g?.w ?? 1} height={g?.h ?? 1} className="th-img" role="img" aria-label="Input image" /><p className="th-cap">Input ({s.dark ?? true ? "dark objects" : "bright objects"})</p></div>
        <div><canvas ref={outRef} width={g?.w ?? 1} height={g?.h ?? 1} className="th-img" role="img" aria-label="Result" /><p className="th-cap">{view === "errors" && s.gt ? <>Black: found · <span className="th-fp">red: false alarm</span> · <span className="th-fn">blue: missed</span></> : "Object pixels black"}</p></div>
      </div>
      <figure className="th-hist">
        <svg viewBox="0 0 256 60" preserveAspectRatio="none" aria-hidden="true">
          <path d={hp} className="th-bars" />
          {shownT !== null && <line x1={shownT + 0.5} x2={shownT + 0.5} y1={0} y2={60} className="th-t" />}
          {m === "hysteresis" && <><line x1={ts + 0.5} x2={ts + 0.5} y1={0} y2={60} className="th-t" /><line x1={tw + 0.5} x2={tw + 0.5} y1={0} y2={60} className="th-t2" /></>}
        </svg>
        <figcaption>Histogram (√ of counts){shownT !== null ? ` · T = ${shownT}` : m === "hysteresis" ? ` · strong ${ts}, weak ${tw}` : " · local method: one threshold per pixel"}</figcaption>
      </figure>
      {q && (
        <div className="ap-stats th-stats">
          <span>precision <b>{(100 * q.precision).toFixed(1)} %</b></span>
          <span>recall <b>{(100 * q.recall).toFixed(1)} %</b></span>
          <span>F1 <b>{q.f1.toFixed(3)}</b></span>
          <span>IoU <b>{q.iou.toFixed(3)}</b></span>
          <span>false alarms <b>{q.fp}</b> · missed <b>{q.fn}</b></span>
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
