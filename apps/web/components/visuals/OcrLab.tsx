"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rotate, binarize, profile, deskewAngle } from "@/lib/ocr-ops";

const W = 320, H = 200;

function useGray(src: string) {
  const [d, setD] = useState<Uint8Array | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H);
      for (let i = 0; i < out.length; i++) out[i] = p[4 * i];
      setD(out);
    };
    img.src = src;
  }, [src]);
  return d;
}

function Mask({ d, label, invert }: { d: Uint8Array; label: string; invert?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) { const v = invert ? 255 - d[i] : d[i]; im.data.set([v, v, v, 255], 4 * i); }
    ctx.putImageData(im, 0, 0);
  }, [d, invert]);
  return <figure className="oc-stage"><canvas ref={ref} width={W} height={H} className="oc-img" role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

function Profile({ rows, label }: { rows: number[]; label: string }) {
  const mx = Math.max(...rows, 1);
  const d = rows.map((r, y) => `M0,${y + 0.5} H${((100 * r) / mx).toFixed(1)}`).join(" ");
  return (
    <figure className="oc-prof">
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/** OcrLab (15.4): skew the label, binarise it for OCR (dark text on white), look at the row projection profile, and deskew automatically. */
export function OcrLab({ caption }: { caption?: string }) {
  const g = useGray("/images/sample-print-uneven.png");
  const [skew, setSkew] = useState(4);
  const [fix, setFix] = useState<number | null>(null);
  const skewed = useMemo(() => (g ? rotate(g, W, H, skew, null) : null), [g, skew]);
  const mask = useMemo(() => (skewed ? binarize(skewed, W, H) : null), [skewed]);
  const prof = useMemo(() => (mask ? profile(mask, W, H) : null), [mask]);
  const fixed = useMemo(() => (mask && fix !== null ? rotate(mask, W, H, fix, 0) : null), [mask, fix]);
  const fixedProf = useMemo(() => (fixed ? profile(fixed, W, H) : null), [fixed]);
  useEffect(() => setFix(null), [skew]);
  return (
    <figure className="fig ocrlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Skew of the label <output>{skew.toFixed(1)}°</output></span><input type="range" min={-10} max={10} step={0.5} value={skew} onChange={(e) => setSkew(Number(e.target.value))} aria-label="Skew angle" /></label>
        <button type="button" className="hl-reset" onClick={() => mask && setFix(deskewAngle(mask, W, H, 10, 0.25))}>Find the deskew angle</button>
      </div>
      {skewed && mask && prof && (
        <div className="oc-grid">
          <Mask d={skewed} label="input (rotated)" />
          <div className="oc-pair"><Mask d={mask} invert label="binarised: dark text on white" /><Profile rows={prof.rows} label={`row profile, variance ${prof.variance.toFixed(0)}`} /></div>
          {fixed && fixedProf && <div className="oc-pair"><Mask d={fixed} invert label={`deskewed by ${fix?.toFixed(2)}°`} /><Profile rows={fixedProf.rows} label={`row profile, variance ${fixedProf.variance.toFixed(0)}`} /></div>}
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
