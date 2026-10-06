"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { unsharp, laplacianSharpen, makePsf, otf, padMirror, crop, convolveFFT, wiener, richardsonLucy, type PsfKind } from "@/lib/restore-ops";
import { addNoise, psnr } from "@/lib/denoise-ops";
import { gaussian } from "@/lib/pipe-ops";

type SharpM = "none" | "unsharp" | "laplacian";
type RestM = "none" | "inverse" | "wiener" | "rl";
const PROW = 60, PX0 = 92, PX1 = 122; // profile across the right edge of the bright square

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

function View({ d, w, h, label, scale = 1 }: { d: ArrayLike<number>; w: number; h: number; label: string; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = d[i]; im.data.set([v, v, v, 255], 4 * i); }
    ctx.putImageData(im, 0, 0);
  }, [d, w, h]);
  return <figure className="rs-view"><canvas ref={ref} width={w} height={h} className="rs-img" style={scale > 1 ? { imageRendering: "pixelated", width: w * scale } : undefined} role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

function Profile({ a, b, w }: { a: ArrayLike<number>; b: ArrayLike<number>; w: number }) {
  const n = PX1 - PX0, X = (i: number) => (i / (n - 1)) * 300, Y = (v: number) => 110 - (v / 255) * 100;
  const line = (d: ArrayLike<number>) => Array.from({ length: n }, (_, i) => `${X(i).toFixed(1)},${Y(d[PROW * w + PX0 + i]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="-4 0 308 120" className="rs-prof" role="img" aria-label="Row profile across the edge of the square: input and result">
      <line x1={0} y1={10} x2={300} y2={10} className="rs-lim" /><line x1={0} y1={110} x2={300} y2={110} className="rs-lim" />
      <polyline points={line(a)} className="rs-in" /><polyline points={line(b)} className="rs-out" />
      <text x={2} y={9} className="rs-t">255</text><text x={2} y={118} className="rs-t">0</text>
    </svg>
  );
}

/** RestoreLab (Module 19). mode "sharpen": unsharp mask or Laplacian on a slightly blurred image, with edge profile. mode "restore": blur with a PSF (Gaussian, motion, defocus disk) + noise, then inverse, Wiener or Richardson–Lucy. */
export function RestoreLab({ mode = "sharpen", initial, initialPsf = "gauss", initialNoise, caption }: { mode?: "sharpen" | "restore"; initial?: SharpM | RestM; initialPsf?: PsfKind; initialNoise?: number; caption?: string }) {
  const clean = useGray("/images/sample-clean.png");
  const [noise, setNoise] = useState(initialNoise ?? (mode === "sharpen" ? 0 : 2));
  const [sm, setSm] = useState<SharpM>((mode === "sharpen" ? initial : undefined) as SharpM ?? "unsharp");
  const [rm, setRm] = useState<RestM>((mode === "restore" ? initial : undefined) as RestM ?? "wiener");
  const [sig, setSig] = useState(2), [amt, setAmt] = useState(1.5), [thr, setThr] = useState(0), [c, setC] = useState(0.5), [eight, setEight] = useState(false);
  const [pk, setPk] = useState<PsfKind>(initialPsf), [pp, setPp] = useState(initialPsf === "gauss" ? 2 : initialPsf === "motion" ? 11 : 4), [ang, setAng] = useState(0);
  const [logK, setLogK] = useState(-2.5), [iters, setIters] = useState(20);

  const input = useMemo(() => {
    if (!clean) return null;
    const { d, w, h } = clean;
    if (mode === "sharpen") { const b = Uint8Array.from(gaussian(d, w, h, 1.5), (v) => Math.max(0, Math.min(255, Math.round(v)))); return noise > 0 ? addNoise(b, "gaussian", noise, 7) : b; }
    const P = padMirror(d, w, h), T = otf(makePsf(pk, pp, ang), P.W, P.H), b = crop(convolveFFT(P.data, P.W, P.H, T), P.W, w, h);
    return noise > 0 ? addNoise(b, "gaussian", noise, 7) : b;
  }, [clean, mode, noise, pk, pp, ang]);

  const out = useMemo(() => {
    if (!clean || !input) return null;
    const { w, h } = clean;
    if (mode === "sharpen") return sm === "unsharp" ? unsharp(input, w, h, sig, amt, thr) : sm === "laplacian" ? laplacianSharpen(input, w, h, c, eight) : input;
    if (rm === "none") return input;
    const P = padMirror(input, w, h), T = otf(makePsf(pk, pp, ang), P.W, P.H);
    const r = rm === "rl" ? richardsonLucy(P.data, P.W, P.H, T, iters) : wiener(P.data, P.W, P.H, T, rm === "inverse" ? 0 : 10 ** logK);
    return crop(r, P.W, w, h);
  }, [clean, input, mode, sm, sig, amt, thr, c, eight, rm, pk, pp, ang, logK, iters]);

  const psf = useMemo(() => makePsf(pk, pp, ang), [pk, pp, ang]);
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, show?: string) => (
    <label className="ctl ctl-wide"><span>{label} <output>{show ?? v}</output></span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  const seg = <T extends string>(label: string, opts: [T, string][], v: T, set: (x: T) => void) => (
    <div className="ctl ctl-full"><span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
      </div>
    </div>
  );
  const flatStd = (d: ArrayLike<number>, w: number) => { let s = 0, s2 = 0, n = 0; for (let y = 50; y < 80; y++) for (let x = 155; x < 185; x++) { const v = d[y * w + x]; s += v; s2 += v * v; n++; } return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)); };
  const edgeMinMax = (d: ArrayLike<number>, w: number) => { let mn = 255, mx = 0; for (let x = PX0; x < PX1; x++) { const v = d[PROW * w + x]; mn = Math.min(mn, v); mx = Math.max(mx, v); } return [mn, mx]; };

  return (
    <figure className="fig restorelab">
      <div className="sc-ctl">
        {mode === "sharpen" ? (
          <>
            {seg("Method", [["none", "none"], ["unsharp", "unsharp mask"], ["laplacian", "Laplacian"]], sm, setSm)}
            {sm === "unsharp" && <>{sl("σ of the blur (px)", sig, setSig, 0.5, 5, 0.25)}{sl("amount", amt, setAmt, 0, 4, 0.1)}{sl("threshold (grey levels)", thr, setThr, 0, 30, 1)}</>}
            {sm === "laplacian" && <>{sl("strength c", c, setC, 0, 2, 0.05)}{seg("Kernel", [["4", "4-neighbour"], ["8", "8-neighbour"]], eight ? "8" : "4", (k) => setEight(k === "8"))}</>}
            {sl("noise σ in the input", noise, setNoise, 0, 15, 1)}
          </>
        ) : (
          <>
            {seg("Blur (PSF)", [["gauss", "Gaussian"], ["motion", "motion"], ["disk", "defocus disk"]], pk, (k) => { setPk(k); setPp(k === "gauss" ? 2 : k === "motion" ? 11 : 4); })}
            {sl(pk === "gauss" ? "σ (px)" : pk === "motion" ? "length (px)" : "radius (px)", pp, setPp, pk === "gauss" ? 0.5 : 1, pk === "gauss" ? 4 : pk === "motion" ? 25 : 8, pk === "gauss" ? 0.25 : 1)}
            {pk === "motion" && sl("angle (°)", ang, setAng, 0, 180, 5)}
            {sl("noise σ added after the blur", noise, setNoise, 0, 10, 0.5)}
            {seg("Restoration", [["none", "none"], ["inverse", "inverse"], ["wiener", "Wiener"], ["rl", "Richardson–Lucy"]], rm, setRm)}
            {rm === "wiener" && sl("K (noise-to-signal)", logK, setLogK, -5, 0, 0.25, (10 ** logK).toExponential(1))}
            {rm === "rl" && sl("iterations", iters, setIters, 1, 60, 1)}
          </>
        )}
      </div>
      {clean && input && out && (
        <>
          <div className="rs-grid">
            <View d={clean.d} w={clean.w} h={clean.h} label="original (sharp)" />
            <View d={input} w={clean.w} h={clean.h} label={`${mode === "sharpen" ? "input: blurred σ = 1.5" : "blurred + noise"} · PSNR ${psnr(input, clean.d).toFixed(1)} dB`} />
            <View d={out} w={clean.w} h={clean.h} label={`result · PSNR ${psnr(out, clean.d).toFixed(1)} dB`} />
          </div>
          <div className="rs-row">
            <div className="rs-pbox">
              <Profile a={input} b={out} w={clean.w} />
              <p className="rs-cap"><span className="rs-k rs-kin" /> input <span className="rs-k rs-kout" /> result, row {PROW} across the square's edge · result range {edgeMinMax(out, clean.w).join("–")} (clipped at 0 and 255) · noise in flat circle: {flatStd(input, clean.w).toFixed(1)} → {flatStd(out, clean.w).toFixed(1)}</p>
            </div>
            {mode === "restore" && <View d={Uint8Array.from(psf.k, (v) => Math.round((v / Math.max(...psf.k)) * 255))} w={psf.size} h={psf.size} scale={Math.max(2, Math.floor(84 / psf.size))} label={`PSF ${psf.size} × ${psf.size}`} />}
          </div>
        </>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
