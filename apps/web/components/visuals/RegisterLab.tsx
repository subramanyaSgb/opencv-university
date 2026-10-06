"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { moveImage, warpBack, phaseCorrelate, eccEuclidean, type Warp } from "@/lib/reg-ops";

const W = 256, H = 160;
const rad = (d: number) => (d * Math.PI) / 180;

function useScene() {
  const [g, setG] = useState<Float64Array | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, W, H);
      const p = ctx.getImageData(0, 0, W, H).data, d = new Float64Array(W * H);
      for (let i = 0; i < W * H; i++) d[i] = p[4 * i];
      setG(d);
    };
    img.src = "/images/sample-scene.png";
  }, []);
  return g;
}

function Canvas({ draw, w, h, label, pixelated }: { draw: (im: ImageData) => void; w: number; h: number; label: string; pixelated?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h); draw(im); ctx.putImageData(im, 0, 0);
  }, [draw, w, h]);
  return <figure className="rg-view"><canvas ref={ref} width={w} height={h} className={pixelated ? "rg-img rg-pix" : "rg-img"} role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

const gray = (d: ArrayLike<number>) => (im: ImageData) => { for (let i = 0; i < d.length; i++) { const v = Number.isNaN(d[i]) ? 0 : d[i]; im.data.set([v, v, v, 255], 4 * i); } };
/** Overlay: reference in red, other image in cyan; aligned areas look grey. */
const overlay = (a: ArrayLike<number>, b: ArrayLike<number>) => (im: ImageData) => { for (let i = 0; i < a.length; i++) { const u = a[i], v = Number.isNaN(b[i]) ? 0 : b[i]; im.data.set([u, v, v, 255], 4 * i); } };

function corr(a: ArrayLike<number>, b: ArrayLike<number>) {
  let n = 0, sa = 0, sb = 0; for (let i = 0; i < a.length; i++) if (!Number.isNaN(b[i])) { n++; sa += a[i]; sb += b[i]; }
  const ma = sa / n, mb = sb / n; let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) if (!Number.isNaN(b[i])) { const x = a[i] - ma, y = b[i] - mb; ab += x * y; aa += x * x; bb += y * y; }
  return ab / Math.sqrt(aa * bb);
}

/** "Thermal-like" second modality: inverted, non-linear, blurred version of the scene. */
function thermal(d: Float64Array) {
  const o = new Float64Array(d.length);
  for (let i = 0; i < d.length; i++) o[i] = 255 * (1 - (d[i] / 255) ** 0.6) * 0.8 + 30;
  const t = new Float64Array(d.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) { s += o[yy * W + xx]; n++; } } t[y * W + x] = s / n; }
  return t;
}
function gradMag(d: ArrayLike<number>) {
  const o = new Float64Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const gx = d[y * W + x + 1] - d[y * W + x - 1], gy = d[(y + 1) * W + x] - d[(y - 1) * W + x]; o[y * W + x] = Math.hypot(gx, gy); }
  return o;
}

/** RegisterLab (Module 21). mode "manual": align a moved copy by hand (overlay, correlation). "phase": phase correlation on a shifted copy, with its correlation surface. "ecc": ECC alignment (Euclidean) from the identity. "multimodal": a thermal-like image; ECC on intensities vs on gradient magnitudes. */
export function RegisterLab({ mode = "manual", caption }: { mode?: "manual" | "phase" | "ecc" | "multimodal"; caption?: string }) {
  const ref = useScene();
  const [ta, setTa] = useState(mode === "phase" ? 0 : 2), [tx, setTx] = useState(mode === "phase" ? 7.5 : 6), [ty, setTy] = useState(mode === "phase" ? -4 : -4);
  const [gain, setGain] = useState(mode === "manual" ? 1 : 0.8), [noise, setNoise] = useState(mode === "phase" ? 4 : 2);
  const [ga, setGa] = useState(0), [gx, setGx] = useState(0), [gy, setGy] = useState(0);
  const [feat, setFeat] = useState<"intensity" | "gradient">("intensity");
  const truth: Warp = useMemo(() => ({ theta: rad(ta), tx, ty }), [ta, tx, ty]);

  const moved = useMemo(() => {
    if (!ref) return null;
    const src = mode === "multimodal" ? thermal(ref) : ref;
    const m = moveImage(src, W, H, truth, NaN); // edges replicated, like BORDER_REPLICATE
    let seed = 5; const r = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (let i = 0; i < m.length; i++) { const g = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); m[i] = Math.max(0, Math.min(255, (mode === "multimodal" ? 1 : gain) * m[i] + (mode === "multimodal" ? 0 : 20 * (1 - gain)) + noise * g)); }
    return m;
  }, [ref, mode, truth, gain, noise]);

  const result = useMemo(() => {
    if (!ref || !moved) return null;
    if (mode === "manual") { const p = { theta: rad(ga), tx: gx, ty: gy }; const back = warpBack(moved, W, H, p); return { p, back, rho: corr(ref, back) }; }
    if (mode === "phase") {
      const a = new Float64Array(256 * 256), b = new Float64Array(256 * 256);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { a[y * 256 + x] = ref[y * W + x]; b[y * 256 + x] = moved[y * W + x]; }
      const r = phaseCorrelate(a, b, 256, 256), p = { theta: 0, tx: r.dx, ty: r.dy };
      return { p, back: warpBack(moved, W, H, p), rho: corr(ref, warpBack(moved, W, H, p)), surface: r.surface, peak: r.peak };
    }
    const A = mode === "multimodal" && feat === "gradient" ? gradMag(ref) : ref, B = mode === "multimodal" && feat === "gradient" ? gradMag(moved) : moved;
    const e = eccEuclidean(A, B, W, H, { theta: 0, tx: 0, ty: 0 }, 60);
    const back = warpBack(moved, W, H, e.warp);
    return { p: e.warp, back, rho: e.rho[e.rho.length - 1], iters: e.rho.length, rhos: e.rho };
  }, [ref, moved, mode, ga, gx, gy, feat]);

  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  const err = result ? Math.hypot(result.p.tx - tx, result.p.ty - ty) : 0;
  const surf = useMemo(() => {
    if (!result || !("surface" in result) || !result.surface) return null;
    const S = result.surface, N = 64, out = new Float64Array(N * N); let mx = 1e-9;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = Math.max(0, S[((y - N / 2 + 256) % 256) * 256 + ((x - N / 2 + 256) % 256)]); out[y * N + x] = v; mx = Math.max(mx, v); }
    return out.map((v) => 255 * Math.sqrt(v / mx));
  }, [result]);

  return (
    <figure className="fig registerlab">
      <div className="sc-ctl">
        <p className="rg-head">True motion of the second image</p>
        {mode !== "phase" && sl("rotation (°)", ta, setTa, -10, 10, 0.5)}
        {sl("shift x (px)", tx, setTx, -30, 30, 0.25)}
        {sl("shift y (px)", ty, setTy, -20, 20, 0.25)}
        {mode !== "multimodal" && sl("brightness gain", gain, setGain, 0.5, 1.5, 0.05)}
        {sl("noise σ", noise, setNoise, 0, 20, 1)}
        {mode === "manual" && <><p className="rg-head">Your estimate</p>{sl("rotation (°)", ga, setGa, -10, 10, 0.5)}{sl("shift x (px)", gx, setGx, -30, 30, 0.25)}{sl("shift y (px)", gy, setGy, -20, 20, 0.25)}</>}
        {mode === "multimodal" && (
          <div className="ctl ctl-full"><span>ECC on</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Features">
              {(["intensity", "gradient"] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={feat === k} className={feat === k ? "is-on" : ""} onClick={() => setFeat(k)}>{k === "intensity" ? "grey values" : "gradient magnitude"}</button>)}
            </div>
          </div>
        )}
      </div>
      {ref && moved && result && (
        <>
          <div className="rg-grid">
            <Canvas draw={gray(ref)} w={W} h={H} label="reference" />
            <Canvas draw={gray(moved)} w={W} h={H} label={mode === "multimodal" ? "second camera (thermal-like), moved" : "second image, moved"} />
            <Canvas draw={overlay(ref, result.back)} w={W} h={H} label="overlay after alignment: red = reference, cyan = aligned image" />
            {surf && <Canvas draw={gray(surf)} w={64} h={64} pixelated label="phase correlation surface (centre 64 × 64)" />}
          </div>
          <p className="rg-read">
            Estimate: rotation {(result.p.theta * 180 / Math.PI).toFixed(2)}°, shift ({result.p.tx.toFixed(2)}, {result.p.ty.toFixed(2)}) px
            {" · "}shift error {err.toFixed(2)} px{mode !== "phase" && ` · rotation error ${Math.abs(result.p.theta * 180 / Math.PI - ta).toFixed(2)}°`}
            {" · "}correlation after alignment {result.rho.toFixed(3)}
            {"iters" in result && result.iters !== undefined && ` · ECC iterations ${result.iters}`}
            {"peak" in result && result.peak !== undefined && ` · peak height ${result.peak.toFixed(3)}`}
          </p>
        </>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
