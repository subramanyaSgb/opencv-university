"use client";

/** Shared pieces for the image labs from Module 33 on: load a grey image, draw it on a canvas with an overlay,
 *  and small control helpers. Styles: `.lk-*` in globals.css. */
import { useEffect, useRef, useState, type ReactNode } from "react";

export type Gray = { d: Float64Array; w: number; h: number };

/** Load one or more images as grey (red channel of an 8-bit grey PNG). Returns null until all are loaded. */
export function useGrays(srcs: string[]): Gray[] | null {
  const [g, setG] = useState<Gray[] | null>(null);
  const key = srcs.join("|");
  useEffect(() => {
    let alive = true;
    Promise.all(key.split("|").map((src) => new Promise<Gray>((ok, fail) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
        const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Float64Array(img.width * img.height);
        for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
        ok({ d, w: img.width, h: img.height });
      };
      img.onerror = fail;
      img.src = src;
    }))).then((r) => { if (alive) setG(r); }).catch(() => {});
    return () => { alive = false; };
  }, [key]);
  return g;
}

export type Paint = (ctx: CanvasRenderingContext2D, s: number) => void;

/** Grey (or heat-coloured, or RGB) image at integer scale with an overlay painter; click reports image pixel coordinates. */
export function GrayView({ d, w, h, label, overlay, heat, rgb, onPick, scale = 2, fixed }: {
  d: ArrayLike<number>; w: number; h: number; label: ReactNode; overlay?: Paint; heat?: boolean; rgb?: Uint8ClampedArray;
  onPick?: (x: number, y: number) => void; scale?: number; fixed?: [number, number];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    let a = Infinity, b = -Infinity;
    if (fixed) [a, b] = fixed; else for (let i = 0; i < w * h; i++) { if (d[i] < a) a = d[i]; if (d[i] > b) b = d[i]; }
    const off = document.createElement("canvas"); off.width = w; off.height = h; const o = off.getContext("2d")!, im = o.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      if (rgb) { im.data[4 * i] = rgb[3 * i]; im.data[4 * i + 1] = rgb[3 * i + 1]; im.data[4 * i + 2] = rgb[3 * i + 2]; }
      else if (heat) {
        const t = Math.max(0, Math.min(1, (d[i] - a) / (b - a || 1)));
        im.data[4 * i] = Math.round(255 * Math.min(1, 1.6 * t)); im.data[4 * i + 1] = Math.round(255 * Math.max(0, 1.6 * t - 0.6)); im.data[4 * i + 2] = Math.round(110 * (1 - t));
      } else { const t = fixed ? (d[i] - a) / (b - a || 1) : d[i] / 255; im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = Math.round(255 * Math.max(0, Math.min(1, t))); }
      im.data[4 * i + 3] = 255;
    }
    o.putImageData(im, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, w * scale, h * scale); ctx.drawImage(off, 0, 0, w * scale, h * scale);
    overlay?.(ctx, scale);
  }, [d, w, h, heat, rgb, overlay, scale, fixed]);
  return (
    <figure className="lk-view">
      <canvas ref={ref} width={w * scale} height={h * scale} className="lk-img" role="img" aria-label={typeof label === "string" ? label : "image"} style={onPick ? { cursor: "crosshair" } : undefined}
        onClick={(e) => { if (!onPick) return; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); onPick(Math.floor(((e.clientX - r.left) / r.width) * w), Math.floor(((e.clientY - r.top) / r.height) * h)); }} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/** Painters for overlays (coordinates in image pixels; s = display scale). */
export const dots = (pts: { x: number; y: number }[], colour: string, r = 3): Paint => (ctx, s) => {
  ctx.strokeStyle = colour; ctx.lineWidth = 1.5;
  for (const p of pts) { ctx.beginPath(); ctx.arc((p.x + 0.5) * s, (p.y + 0.5) * s, r, 0, 2 * Math.PI); ctx.stroke(); }
};
export const rect = (x: number, y: number, w: number, h: number, colour: string, lw = 2): Paint => (ctx, s) => { ctx.strokeStyle = colour; ctx.lineWidth = lw; ctx.strokeRect(x * s, y * s, w * s, h * s); };
export const both = (...ps: (Paint | undefined | false)[]): Paint => (ctx, s) => { for (const p of ps) if (p) p(ctx, s); };

export function Seg<T extends string>({ label, opts, v, set }: { label: string; opts: [T, string][]; v: T; set: (x: T) => void }) {
  return (
    <div className="ctl ctl-full"><span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
      </div>
    </div>
  );
}

export function Slider({ label, v, set, min, max, step, unit = "", show }: { label: string; v: number; set: (n: number) => void; min: number; max: number; step: number; unit?: string; show?: string }) {
  return (
    <label className="ctl ctl-wide"><span>{label} <output>{show ?? v}{unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
}

export function Check({ label, v, set }: { label: string; v: boolean; set: (b: boolean) => void }) {
  return <label className="lk-check"><input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {label}</label>;
}
