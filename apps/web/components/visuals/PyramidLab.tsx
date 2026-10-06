"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toF, gaussianPyramid, laplacianPyramid, collapse, pyramidBlend, blurF, dog, type FImg } from "@/lib/pyr-ops";

type Img = { ch: Float64Array[]; w: number; h: number };
const SRC: Record<string, string> = { scene: "/images/sample-scene.png", zone: "/images/sample-zoneplate.png", clean: "/images/sample-clean.png", particles: "/images/sample-particles.png" };

function useImg(src: string, color = false) {
  const [g, setG] = useState<Img | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, n = img.width * img.height;
      const ch = (color ? [0, 1, 2] : [0]).map((o) => { const d = new Float64Array(n); for (let i = 0; i < n; i++) d[i] = p[4 * i + o]; return d; });
      setG({ ch, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src, color]);
  return g;
}

/** Draws 1 (grey) or 3 (RGB) float channels; `map` turns values into 0..255. */
function View({ ch, w, h, label, cssW, map = (v: number) => v }: { ch: Float64Array[]; w: number; h: number; label: string; cssW?: string; map?: (v: number) => number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const r = map(ch[0][i]), g = map((ch[1] ?? ch[0])[i]), b = map((ch[2] ?? ch[0])[i]);
      im.data.set([r, g, b, 255], 4 * i);
    }
    ctx.putImageData(im, 0, 0);
  }, [ch, w, h, map]);
  return <figure className="py-view" style={cssW ? { width: cssW } : undefined}><canvas ref={ref} width={w} height={h} className="py-img" role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

/** PyramidLab (Module 20). mode "gauss": Gaussian pyramid levels, with or without blurring before subsampling. "laplacian": band-pass levels and exact reconstruction. "blend": cut, feather or multiband pyramid blend of two textures. "dog": difference of Gaussians. */
export function PyramidLab({ mode = "gauss", initialSource = "zone", caption }: { mode?: "gauss" | "laplacian" | "blend" | "dog"; initialSource?: "scene" | "zone" | "clean" | "particles"; caption?: string }) {
  const [src, setSrc] = useState(initialSource);
  const gray = useImg(SRC[src]);
  const A = useImg("/images/sample-blend-a.png", true), B = useImg("/images/sample-blend-b.png", true);
  const [blurFirst, setBlurFirst] = useState(true);
  const [gain, setGain] = useState(3);
  const [bm, setBm] = useState<"cut" | "feather" | "pyramid">("pyramid"), [mask, setMask] = useState<"half" | "circle">("half");
  const [levels, setLevels] = useState(5), [fs, setFs] = useState(8);
  const [sig, setSig] = useState(2), [kk, setKk] = useState(1.6);
  const seg = <T extends string>(label: string, opts: [T, string][], v: T, set: (x: T) => void) => (
    <div className="ctl ctl-full"><span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
      </div>
    </div>
  );
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );

  const gaussLevels = useMemo(() => {
    if (!gray || mode !== "gauss") return null;
    const f = toF(gray.ch[0], gray.w, gray.h);
    if (blurFirst) return gaussianPyramid(f, 5);
    const out: FImg[] = [f];
    for (let i = 1; i < 5; i++) { const p = out[i - 1], w = (p.w + 1) >> 1, h = (p.h + 1) >> 1, d = new Float64Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = p.d[2 * y * p.w + 2 * x]; out.push({ d, w, h }); }
    return out;
  }, [gray, mode, blurFirst]);

  const lap = useMemo(() => {
    if (!gray || mode !== "laplacian") return null;
    const L = laplacianPyramid(toF(gray.ch[0], gray.w, gray.h), 5), R = collapse(L);
    let err = 0; R.d.forEach((v, i) => { err = Math.max(err, Math.abs(v - gray.ch[0][i])); });
    return { L, err };
  }, [gray, mode]);

  const blend = useMemo(() => {
    if (!A || !B || mode !== "blend") return null;
    const { w, h } = A, m = new Float64Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = mask === "half" ? (x < w / 2 ? 1 : 0) : Math.hypot(x - w / 2, y - h / 2) < w * 0.3 ? 1 : 0;
    const M = { d: m, w, h }, mf = bm === "feather" ? blurF(M, fs) : M;
    const ch = [0, 1, 2].map((c) => {
      if (bm === "pyramid") return pyramidBlend(toF(A.ch[c], w, h), toF(B.ch[c], w, h), M, levels).d;
      return A.ch[c].map((v, i) => mf.d[i] * v + (1 - mf.d[i]) * B.ch[c][i]);
    });
    return { ch, w, h };
  }, [A, B, mode, bm, mask, levels, fs]);

  const dg = useMemo(() => {
    if (!gray || mode !== "dog") return null;
    const f = toF(gray.ch[0], gray.w, gray.h);
    return { a: blurF(f, sig), b: blurF(f, sig * kk), d: dog(f, sig, kk) };
  }, [gray, mode, sig, kk]);

  const signed = useMemo(() => (v: number) => clamp(128 + gain * v), [gain]);
  const plain = useMemo(() => (v: number) => clamp(v), []);

  return (
    <figure className="fig pyramidlab">
      <div className="sc-ctl">
        {mode !== "blend" && seg("Image", [["zone", "zone plate"], ["scene", "scene"], ["clean", "test chart"], ["particles", "particles"]], src, setSrc)}
        {mode === "gauss" && seg("Before taking every second pixel", [["y", "blur (pyrDown)"], ["n", "no blur (just drop pixels)"]], blurFirst ? "y" : "n", (k) => setBlurFirst(k === "y"))}
        {mode === "laplacian" && sl("display gain for the band levels", gain, setGain, 1, 8, 0.5)}
        {mode === "blend" && <>
          {seg("Method", [["cut", "hard cut"], ["feather", "feathered mask"], ["pyramid", "pyramid (multiband)"]], bm, setBm)}
          {seg("Mask", [["half", "left half"], ["circle", "circle"]], mask, setMask)}
          {bm === "feather" && sl("feather σ (px)", fs, setFs, 1, 40, 1)}
          {bm === "pyramid" && sl("pyramid levels", levels, setLevels, 1, 7, 1)}
        </>}
        {mode === "dog" && <>{sl("σ (px)", sig, setSig, 0.5, 8, 0.25)}{sl("ratio k", kk, setKk, 1.1, 4, 0.1)}{sl("display gain", gain, setGain, 1, 12, 0.5)}</>}
      </div>

      {gaussLevels && (
        <div className="py-row">
          {gaussLevels.map((l, i) => <View key={i} ch={[l.d]} w={l.w} h={l.h} map={plain} cssW={`${Math.max(12, 100 / 2 ** i)}%`} label={`${i}`} />)}
        </div>
      )}
      {gaussLevels && <p className="py-cap">Levels 0–4 at true size: {gaussLevels.map((l) => `${l.w} × ${l.h}`).join(", ")}</p>}
      {gaussLevels && (
        <div className="py-grid">
          {gaussLevels.slice(1, 4).map((l, i) => <View key={i} ch={[l.d]} w={l.w} h={l.h} map={plain} label={`level ${i + 1} enlarged to the same width`} />)}
        </div>
      )}
      {lap && (
        <>
          <div className="py-grid">
            {lap.L.map((l, i) => <View key={i} ch={[l.d]} w={l.w} h={l.h} map={i < lap.L.length - 1 ? signed : plain} label={i < lap.L.length - 1 ? `L${i} (${l.w} × ${l.h}): detail, 128 = 0, × ${gain}` : `G${i} residual (${l.w} × ${l.h})`} />)}
          </div>
          <p className="py-cap">Collapse (upsample and add, from the smallest level up) rebuilds the image: maximum error {lap.err.toExponential(1)} grey levels.</p>
        </>
      )}
      {blend && A && B && (
        <div className="py-grid">
          <View ch={A.ch} w={A.w} h={A.h} map={plain} label="A" />
          <View ch={B.ch} w={B.w} h={B.h} map={plain} label="B" />
          <View ch={blend.ch} w={blend.w} h={blend.h} map={plain} label={`result: ${bm === "pyramid" ? `pyramid, ${levels} levels` : bm === "feather" ? `feathered, σ = ${fs}` : "hard cut"}`} />
        </div>
      )}
      {dg && (
        <div className="py-grid">
          <View ch={[dg.a.d]} w={dg.a.w} h={dg.a.h} map={plain} label={`Gaussian σ = ${sig}`} />
          <View ch={[dg.b.d]} w={dg.b.w} h={dg.b.h} map={plain} label={`Gaussian σ = ${(sig * kk).toFixed(2)}`} />
          <View ch={[dg.d.d]} w={dg.d.w} h={dg.d.h} map={signed} label={`difference (128 = 0, × ${gain})`} />
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
