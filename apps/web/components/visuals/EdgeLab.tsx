"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gradients, magnitude, nms, hysteresis, gaussBlur, laplacian, zeroCrossings } from "@/lib/edge-ops";

const SRC: Record<string, string> = { scene: "/images/sample-scene.png", clean: "/images/sample-clean.png", plate: "/images/sample-plate-good.png" };

function useGray(src: string) {
  const [g, setG] = useState<{ d: Float64Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Float64Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

type Px = (i: number) => [number, number, number];
function View({ px, w, h, label }: { px: Px; w: number; h: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const [r, g, b] = px(i); im.data.set([r, g, b, 255], 4 * i); }
    ctx.putImageData(im, 0, 0);
  }, [px, w, h]);
  return <figure className="ed-view"><canvas ref={ref} width={w} height={h} className="ed-img" role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const grey = (d: ArrayLike<number>, scale = 1, off = 0): Px => (i) => { const v = cl(off + scale * d[i]); return [v, v, v]; };
/** Gradient direction as hue, brightness from magnitude. */
const dirColour = (gx: Float64Array, gy: Float64Array, mag: Float64Array, scale: number): Px => (i) => {
  const a = (Math.atan2(gy[i], gx[i]) + Math.PI) / (2 * Math.PI), v = Math.min(1, mag[i] * scale), h6 = a * 6, f = h6 - Math.floor(h6), q = v * (1 - f), t = v * f;
  const k = Math.floor(h6) % 6, rgb = [[v, t, 0], [q, v, 0], [0, v, t], [0, q, v], [t, 0, v], [v, 0, q]][k];
  return [cl(rgb[0] * 255), cl(rgb[1] * 255), cl(rgb[2] * 255)];
};

/** EdgeLab (Module 22). mode "gradient": Sobel/Scharr gx, gy, magnitude and direction. "log": Laplacian of Gaussian and its zero crossings. "canny": every Canny step with σ, low and high thresholds. */
export function EdgeLab({ mode = "canny", initialSource = "scene", caption }: { mode?: "gradient" | "log" | "canny"; initialSource?: "scene" | "clean" | "plate"; caption?: string }) {
  const [src, setSrc] = useState(initialSource);
  const g = useGray(SRC[src]);
  const [sigma, setSigma] = useState(mode === "log" ? 2 : 1), [kind, setKind] = useState<"sobel" | "scharr">("sobel");
  const [thr, setThr] = useState(100), [slope, setSlope] = useState(4);
  const [low, setLow] = useState(50), [high, setHigh] = useState(150), [l2, setL2] = useState(false);
  const [step, setStep] = useState<"blur" | "mag" | "nms" | "double" | "final">("final");

  const r = useMemo(() => {
    if (!g) return null;
    const { d, w, h } = g, b = gaussBlur(d, w, h, sigma);
    if (mode === "log") { const L = laplacian(b, w, h).map((v) => v * sigma * sigma); return { b, L, zc: zeroCrossings(L, w, h, slope) }; }
    const { gx, gy } = gradients(b, w, h, kind, mode === "canny"), mag = magnitude(gx, gy, mode === "canny" ? l2 : true);
    if (mode === "gradient") return { b, gx, gy, mag };
    const thin = nms(mag, gx, gy, w, h), hy = hysteresis(thin, w, h, low, high);
    return { b, gx, gy, mag, thin, ...hy };
  }, [g, mode, sigma, kind, slope, l2, low, high]);

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

  return (
    <figure className="fig edgelab">
      <div className="sc-ctl">
        {seg("Image", [["scene", "scene"], ["clean", "test chart"], ["plate", "metal plate"]], src, setSrc)}
        {sl(mode === "canny" ? "pre-blur σ (cv2.Canny itself has none)" : "Gaussian σ", sigma, setSigma, mode === "log" ? 0.5 : 0, 6, 0.25)}
        {mode === "gradient" && <>{seg("Kernel", [["sobel", "Sobel 3 × 3"], ["scharr", "Scharr 3 × 3"]], kind, setKind)}{sl("magnitude threshold", thr, setThr, 0, 600, 10)}</>}
        {mode === "log" && sl("zero crossing: minimum jump", slope, setSlope, 0, 40, 1)}
        {mode === "canny" && <>
          {sl("low threshold", low, setLow, 0, 500, 5)}{sl("high threshold", high, setHigh, 0, 800, 5)}
          {seg("Magnitude", [["l1", "L1: |gx| + |gy| (default)"], ["l2", "L2: √(gx² + gy²)"]], l2 ? "l2" : "l1", (k) => setL2(k === "l2"))}
          {seg("Show step", [["blur", "1 smooth"], ["mag", "2 gradient"], ["nms", "3 thin (NMS)"], ["double", "4 double threshold"], ["final", "5 hysteresis"]], step, setStep)}
        </>}
      </div>
      {g && r && (
        <div className="ed-grid">
          <View px={grey(r.b)} w={g.w} h={g.h} label={sigma > 0 ? `smoothed, σ = ${sigma}` : "input"} />
          {mode === "gradient" && "gx" in r && r.gx && r.gy && r.mag && <>
            <View px={grey(r.gx, 0.5, 128)} w={g.w} h={g.h} label="gx (grey = 0)" />
            <View px={grey(r.gy, 0.5, 128)} w={g.w} h={g.h} label="gy (grey = 0)" />
            <View px={grey(r.mag, 0.5)} w={g.w} h={g.h} label="magnitude √(gx² + gy²)" />
            <View px={dirColour(r.gx, r.gy, r.mag, 1 / 300)} w={g.w} h={g.h} label="direction as colour (brightness = magnitude)" />
            <View px={(i) => { const v = r.mag![i] > thr ? 255 : 0; return [v, v, v]; }} w={g.w} h={g.h} label={`magnitude > ${thr}: ${count(r.mag!.map((v) => (v > thr ? 1 : 0)))} pixels, thick edges`} />
          </>}
          {mode === "log" && "L" in r && r.L && r.zc && <>
            <View px={grey(r.L, 4, 128)} w={g.w} h={g.h} label="σ² · LoG (grey = 0)" />
            <View px={grey(r.zc)} w={g.w} h={g.h} label={`zero crossings: ${count(r.zc)} pixels`} />
          </>}
          {mode === "canny" && "edge" in r && r.edge && r.view && r.thin && r.mag && (
            <View
              px={step === "blur" ? grey(r.b) : step === "mag" ? grey(r.mag, 0.4) : step === "nms" ? grey(r.thin, 0.4) : step === "double" ? (i) => { const t = r.thin![i]; return t > high ? [255, 255, 255] : t > low ? [230, 150, 40] : [0, 0, 0]; } : grey(r.edge)}
              w={g.w} h={g.h}
              label={step === "double" ? `strong (white) > ${high}, weak (orange) > ${low}` : step === "final" ? `edges: ${count(r.edge)} pixels (weak pixels kept only if connected to strong ones)` : step === "nms" ? "after non-maximum suppression: 1-pixel-wide ridges" : step === "mag" ? `gradient magnitude (${l2 ? "L2" : "L1"})` : "smoothed input"}
            />
          )}
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
