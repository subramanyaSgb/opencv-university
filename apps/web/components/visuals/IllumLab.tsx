"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { estimate, correct, type BgMethod } from "@/lib/illum-ops";
import { histogram, otsu, metrics } from "@/lib/thresh-ops";

const METHODS: { k: BgMethod; label: string }[] = [
  { k: "none", label: "no correction" },
  { k: "blur", label: "large Gaussian blur" },
  { k: "closing", label: "closing + blur" },
  { k: "poly", label: "polynomial surface" },
  { k: "white", label: "white reference image" },
];

function useGray(src: string) {
  const [g, setG] = useState<{ d: Uint8Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Uint8Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

function Gray({ d, w, h, label }: { d: ArrayLike<number>; w: number; h: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = Math.max(0, Math.min(255, Math.round(d[i]))); im.data.set([v, v, v, 255], 4 * i); }
    ctx.putImageData(im, 0, 0);
  }, [d, w, h]);
  return <figure className="ic-stage"><canvas ref={ref} width={w} height={h} className="ic-img" role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

/** IllumLab (15.3): estimate the illumination of the unevenly lit label in several ways, divide or subtract, and see the row profile, paper uniformity and Otsu F1. */
export function IllumLab({ initial = "closing", caption }: { initial?: BgMethod; caption?: string }) {
  const g = useGray("/images/sample-print-uneven.png"), gt = useGray("/images/sample-print-uneven-gt.png"), wh = useGray("/images/sample-print-white.png");
  const [m, setM] = useState<BgMethod>(initial);
  const [sigma, setSigma] = useState(15);
  const [k, setK] = useState(15);
  const [mode, setMode] = useState<"divide" | "subtract">("divide");
  const [row, setRow] = useState(118);
  const bg = useMemo(() => (g && (m !== "white" || wh) ? estimate(g.d, g.w, g.h, m, { sigma, k, white: wh?.d }) : null), [g, wh, m, sigma, k]);
  const out = useMemo(() => (g && bg ? (m === "none" ? g.d : correct(g.d, bg, mode)) : null), [g, bg, m, mode]);
  const stats = useMemo(() => {
    if (!out || !gt) return null;
    // paper = at least 2 px away from any text pixel (like dilating the text mask with a 5 × 5 square)
    const W = g!.w, Hh = g!.h, near = new Uint8Array(out.length);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (gt.d[y * W + x]) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < Hh && xx >= 0 && xx < W) near[yy * W + xx] = 1; }
    let s = 0, s2 = 0, n = 0;
    for (let i = 0; i < out.length; i++) if (!near[i]) { s += out[i]; s2 += out[i] * out[i]; n++; }
    const mean = s / n, cv = Math.sqrt(s2 / n - mean * mean) / mean;
    const t = otsu(histogram(out));
    return { cv, f1: metrics(Uint8Array.from(out, (v) => (v <= t ? 1 : 0)), gt.d).f1 };
  }, [out, gt, g]);
  const prof = (d: ArrayLike<number>) => g ? Array.from({ length: g.w }, (_, x) => `${x ? "L" : "M"}${x},${(100 - (100 * d[row * g.w + x]) / 255).toFixed(1)}`).join(" ") : "";
  return (
    <figure className="fig illumlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Background estimate</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Method">
            {METHODS.map((x) => <button key={x.k} type="button" role="radio" aria-checked={m === x.k} className={m === x.k ? "is-on" : ""} onClick={() => setM(x.k)}>{x.label}</button>)}
          </div>
        </div>
        {m === "blur" && <label className="ctl ctl-wide"><span>σ <output>{sigma}</output></span><input type="range" min={2} max={40} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} aria-label="Sigma" /></label>}
        {m === "closing" && <label className="ctl ctl-wide"><span>closing size <output>{k} × {k}</output></span><input type="range" min={3} max={41} step={2} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Closing size" /></label>}
        {m !== "none" && (
          <div className="ctl ctl-full"><span>Correction</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Correction">
              {(["divide", "subtract"] as const).map((x) => <button key={x} type="button" role="radio" aria-checked={mode === x} className={mode === x ? "is-on" : ""} onClick={() => setMode(x)}>{x === "divide" ? "divide (multiplicative)" : "subtract (additive)"}</button>)}
            </div>
          </div>
        )}
        <label className="ctl ctl-wide"><span>Profile row <output>{row}</output></span><input type="range" min={0} max={199} value={row} onChange={(e) => setRow(Number(e.target.value))} aria-label="Profile row" /></label>
      </div>
      {g && bg && out && (
        <>
          <div className="ic-strip">
            <Gray d={g.d} w={g.w} h={g.h} label="input" />
            <Gray d={bg} w={g.w} h={g.h} label="background estimate" />
            <Gray d={out} w={g.w} h={g.h} label="corrected" />
          </div>
          <figure className="ic-prof">
            <svg viewBox={`0 0 ${g.w} 100`} preserveAspectRatio="none" aria-hidden="true">
              <path d={prof(g.d)} className="ic-raw" />
              <path d={prof(bg)} className="ic-bg" />
              <path d={prof(out)} className="ic-out" />
            </svg>
            <figcaption>Row {row}: <span className="ic-k-raw">input</span> · <span className="ic-k-bg">background estimate</span> · <span className="ic-k-out">corrected</span>. Dips are the letters.</figcaption>
          </figure>
        </>
      )}
      {stats && <div className="ap-stats ic-stats"><span>paper non-uniformity (std / mean) <b>{(100 * stats.cv).toFixed(1)} %</b></span><span>Otsu F1 after correction <b>{stats.f1.toFixed(3)}</b></span></div>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
