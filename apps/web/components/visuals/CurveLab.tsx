"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lut, histogram, type CurveKind } from "@/lib/curve-ops";

const LABELS: Record<CurveKind, string> = {
  identity: "identity", negative: "negative", log: "log", gamma: "gamma", stretch: "contrast stretch",
  slice: "level slicing", threshold: "threshold", contrast: "α·x + β",
};

function Hist({ h, label }: { h: number[]; label: string }) {
  const m = Math.max(...h, 1);
  const d = h.map((v, i) => `M${i + 0.5},40 V${(40 - (38 * v) / m).toFixed(1)}`).join(" ");
  return <figure className="cv-hist"><svg viewBox="0 0 256 40" preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg><figcaption>{label}</figcaption></figure>;
}

/** CurveLab: a point operation as a transfer curve (lookup table), applied to an image, with histograms before and after. */
export function CurveLab({ kinds = ["identity", "negative", "log", "gamma", "stretch", "slice", "threshold", "contrast"], initial = "gamma", src = "/images/sample-scene.png", caption }: { kinds?: CurveKind[]; initial?: CurveKind; src?: string; caption?: string }) {
  const [kind, setKind] = useState<CurveKind>(initial);
  const [gamma, setGamma] = useState(0.5);
  const [lo, setLo] = useState(60);
  const [hi, setHi] = useState(180);
  const [keep, setKeep] = useState(true);
  const [t, setT] = useState(128);
  const [alpha, setAlpha] = useState(1.5);
  const [beta, setBeta] = useState(-40);
  const [gray, setGray] = useState<Uint8Array | null>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const outRef = useRef<HTMLCanvasElement>(null);
  const inRef = useRef<HTMLCanvasElement>(null);
  const table = useMemo(() => lut(kind, { gamma, lo, hi, keep, t, alpha, beta }), [kind, gamma, lo, hi, keep, t, alpha, beta]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height).data;
      const g = new Uint8Array(img.width * img.height);
      for (let i = 0; i < g.length; i++) g[i] = Math.round(0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2]);
      setSize([img.width, img.height]);
      setGray(g);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!gray) return;
    const draw = (cv: HTMLCanvasElement | null, f: (v: number) => number) => {
      const ctx = cv?.getContext("2d");
      if (!ctx) return;
      const im = ctx.createImageData(size[0], size[1]);
      for (let i = 0; i < gray.length; i++) { const v = f(gray[i]); im.data.set([v, v, v, 255], 4 * i); }
      ctx.putImageData(im, 0, 0);
    };
    draw(inRef.current, (v) => v);
    draw(outRef.current, (v) => table[v]);
  }, [gray, table, size]);

  const hIn = useMemo(() => (gray ? histogram(gray) : new Array(256).fill(0)), [gray]);
  const hOut = useMemo(() => (gray ? histogram(Array.from(gray, (v) => table[v])) : new Array(256).fill(0)), [gray, table]);
  const curve = table.map((v, x) => `${x ? "L" : "M"}${x},${255 - v}`).join(" ");
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step = 1) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  return (
    <figure className="fig curvelab">
      {kinds.length > 1 && (
        <div className="ctl ctl-full"><span>Operation</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Operation">
            {kinds.map((k) => <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? "is-on" : ""} onClick={() => setKind(k)}>{LABELS[k]}</button>)}
          </div>
        </div>
      )}
      <div className="sc-ctl">
        {kind === "gamma" && sl("γ (gamma)", gamma, setGamma, 0.1, 3, 0.05)}
        {(kind === "stretch" || kind === "slice") && sl("low", lo, setLo, 0, 254)}
        {(kind === "stretch" || kind === "slice") && sl("high", hi, setHi, 1, 255)}
        {kind === "slice" && <div className="ctl"><button type="button" className="hl-reset" onClick={() => setKeep(!keep)}>{keep ? "Others: keep" : "Others: black"}</button></div>}
        {kind === "threshold" && sl("threshold", t, setT, 0, 255)}
        {kind === "contrast" && sl("α (gain)", alpha, setAlpha, 0, 3, 0.05)}
        {kind === "contrast" && sl("β (offset)", beta, setBeta, -128, 128)}
      </div>
      <div className="cv-grid">
        <div><canvas ref={inRef} width={size[0] || 1} height={size[1] || 1} className="cv-img" role="img" aria-label="Input image" /><Hist h={hIn} label="input histogram" /></div>
        <svg viewBox="-12 -6 280 276" className="cv-curve" role="img" aria-label={`Transfer curve: ${LABELS[kind]}`}>
          <rect x="0" y="0" width="256" height="256" className="cv-frame" />
          <line x1="0" y1="256" x2="256" y2="0" className="cv-diag" />
          <path d={curve} className="cv-line" />
          <text x="128" y="270" textAnchor="middle" className="cv-lab">input value →</text>
          <text x="-4" y="128" textAnchor="middle" className="cv-lab" transform="rotate(-90 -4 128)">output →</text>
        </svg>
        <div><canvas ref={outRef} width={size[0] || 1} height={size[1] || 1} className="cv-img" role="img" aria-label="Output image" /><Hist h={hOut} label="output histogram" /></div>
      </div>
      <div className="pg-readout"><span>Every output pixel depends only on the same input pixel: out = table[in]. In OpenCV: cv2.LUT(img, table).</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
