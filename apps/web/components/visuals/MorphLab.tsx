"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { structuringElement, morph, morphSkeleton, thinZhangSuen, distanceTransform, type Op, type Shape } from "@/lib/morph-ops";

type Mode = "binary" | "hat" | "skeleton" | "distance" | "grey";
const SRC: Record<Mode, string> = { binary: "/images/sample-morph.png", skeleton: "/images/sample-morph.png", distance: "/images/sample-morph.png", hat: "/images/sample-print-uneven.png", grey: "/images/sample-plate-good.png" };

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

type Px = (i: number) => [number, number, number];
function View({ px, w, h, label, pixelated }: { px: Px; w: number; h: number; label: string; pixelated?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) im.data.set([...px(i), 255], 4 * i);
    ctx.putImageData(im, 0, 0);
  }, [px, w, h]);
  return <figure className="mo-view"><canvas ref={ref} width={w} height={h} className={pixelated ? "mo-img mo-pix" : "mo-img"} role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}
const grey = (d: ArrayLike<number>, s = 1): Px => (i) => { const v = Math.min(255, Math.round(d[i] * s)); return [v, v, v]; };
const heat = (d: ArrayLike<number>, max: number): Px => (i) => { const t = Math.min(1, d[i] / max); return d[i] === 0 ? [0, 0, 0] : [Math.round(255 * Math.min(1, 1.5 * t + 0.2)), Math.round(255 * t * t), Math.round(120 * (1 - t))]; };

/** MorphLab (Module 23). mode "binary": erode/dilate/open/close/gradient with any element; "hat": top-hat / black-hat on uneven print; "skeleton": morphological skeleton vs Zhang–Suen thinning; "distance": L1 / L2 / chessboard distance transform; "grey": grey-level morphology. */
export function MorphLab({ mode = "binary", initialOp, caption }: { mode?: Mode; initialOp?: Op; caption?: string }) {
  const g = useGray(SRC[mode]);
  const [op, setOp] = useState<Op>(initialOp ?? (mode === "hat" ? "blackhat" : "open"));
  const [shape, setShape] = useState<Shape>("ellipse"), [size, setSize] = useState(mode === "hat" ? 15 : 5), [it, setIt] = useState(1);
  const [metric, setMetric] = useState<"l1" | "l2" | "c">("l2"), [dthr, setDthr] = useState(0), [thr, setThr] = useState(40);
  const se = useMemo(() => structuringElement(shape, size, size), [shape, size]);

  const res = useMemo(() => {
    if (!g) return null;
    const { d, w, h } = g;
    if (mode === "skeleton") { const clean = morph(d, w, h, "open", structuringElement("rect", 3, 3)); return { clean, sk: morphSkeleton(clean, w, h), zs: thinZhangSuen(clean, w, h) }; }
    if (mode === "distance") { const dt = distanceTransform(d, w, h, metric); let mx = 0; dt.forEach((v) => { if (v > mx) mx = v; }); return { dt, mx }; }
    return { out: morph(d, w, h, op, se, it) };
  }, [g, mode, op, se, it, metric]);

  const seg = <T extends string>(label: string, opts: [T, string][], v: T, set: (x: T) => void) => (
    <div className="ctl ctl-full"><span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
      </div>
    </div>
  );
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, st: number) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  const count = (a: ArrayLike<number>) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i]) n++; return n; };
  const ops: [Op, string][] = mode === "hat" ? [["tophat", "top-hat (bright details)"], ["blackhat", "black-hat (dark details)"], ["open", "opening"], ["close", "closing"]]
    : [["erode", "erode"], ["dilate", "dilate"], ["open", "open"], ["close", "close"], ["gradient", "gradient"]];

  return (
    <figure className="fig morphlab">
      <div className="sc-ctl">
        {(mode === "binary" || mode === "hat" || mode === "grey") && <>
          {seg("Operation", ops, op, setOp)}
          {seg("Element", [["rect", "rectangle"], ["ellipse", "ellipse"], ["cross", "cross"]], shape, setShape)}
          {sl("size (px)", size, setSize, 3, mode === "hat" ? 31 : 21, 2)}
          {mode !== "hat" && sl("iterations", it, setIt, 1, 5, 1)}
          {mode === "hat" && sl("threshold on the result", thr, setThr, 0, 120, 2)}
        </>}
        {mode === "distance" && <>{seg("Distance", [["l2", "Euclidean (L2)"], ["l1", "city block (L1)"], ["c", "chessboard (C)"]], metric, setMetric)}{sl("keep pixels with distance >", dthr, setDthr, 0, 25, 1)}</>}
      </div>
      {g && res && (
        <div className="mo-grid">
          <View px={grey("clean" in res && res.clean ? res.clean : g.d)} w={g.w} h={g.h} label={mode === "skeleton" ? "input after a 3 × 3 opening (specks removed)" : "input"} />
          {"out" in res && res.out && (mode === "binary"
            ? <View px={(i) => { const a = g.d[i], b = res.out![i]; return op === "gradient" ? [b, b, b] : a && b ? [235, 235, 235] : a ? [230, 60, 60] : b ? [60, 200, 90] : [0, 0, 0]; }} w={g.w} h={g.h} label={op === "gradient" ? `morphological gradient: ${count(res.out)} pixels` : `${op}: white kept, red removed, green added (${count(res.out)} white pixels)`} />
            : <View px={grey(res.out, mode === "hat" ? 3 : 1)} w={g.w} h={g.h} label={mode === "hat" ? `${op} (× 3 for display)` : `grey ${op}`} />)}
          {mode === "hat" && "out" in res && res.out && <View px={(i) => { const v = res.out![i] > thr ? 255 : 0; return [v, v, v]; }} w={g.w} h={g.h} label={`${op} > ${thr}`} />}
          {"sk" in res && res.sk && res.zs && <>
            <View px={grey(res.sk)} w={g.w} h={g.h} label={`morphological skeleton (Lantuéjoul): ${count(res.sk)} px, may be broken`} />
            <View px={grey(res.zs)} w={g.w} h={g.h} label={`Zhang–Suen thinning: ${count(res.zs)} px, connected`} />
          </>}
          {"dt" in res && res.dt && <>
            <View px={heat(res.dt, res.mx)} w={g.w} h={g.h} label={`distance to the background (max ${res.mx.toFixed(1)} px)`} />
            <View px={(i) => { const v = res.dt![i] > dthr ? 255 : 0; return [v, v, v]; }} w={g.w} h={g.h} label={`distance > ${dthr}: same as eroding with a ${metric === "l2" ? "disc" : metric === "l1" ? "diamond" : "square"} of radius ${dthr}`} />
          </>}
          {(mode === "binary" || mode === "hat" || mode === "grey") && (
            <View px={(i) => { const v = se.k[i] ? 255 : 40; return [v, v, v]; }} w={se.w} h={se.h} pixelated label={`element ${se.w} × ${se.h}`} />
          )}
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
