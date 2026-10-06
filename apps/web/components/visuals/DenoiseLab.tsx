"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addNoise, psnr, box, gauss, median, bilateral, nlm, type Noise } from "@/lib/denoise-ops";

type F = "none" | "box" | "gauss" | "median" | "bilateral" | "nlm";
const F_LABEL: Record<F, string> = { none: "no filter", box: "box", gauss: "Gaussian", median: "median", bilateral: "bilateral", nlm: "non-local means" };
const N_LABEL: Record<Noise, string> = { gaussian: "Gaussian", saltpepper: "salt & pepper", speckle: "speckle (multiplicative)", poisson: "shot (Poisson)" };
const N_RANGE: Record<Noise, [number, number, number, number]> = { gaussian: [0, 50, 1, 20], saltpepper: [0, 0.3, 0.01, 0.05], speckle: [0, 0.5, 0.01, 0.2], poisson: [5, 500, 5, 50] };
const ZX = 200, ZY = 10, ZW = 110, ZH = 70; // zoom region: thin lines and small text

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

function View({ d, w, h, label, zoom }: { d: Uint8Array; w: number; h: number; label: string; zoom?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cw = zoom ? ZW : w, ch = zoom ? ZH : h;
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(cw, ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const v = zoom ? d[(ZY + y) * w + ZX + x] : d[y * w + x]; im.data.set([v, v, v, 255], 4 * (y * cw + x)); }
    ctx.putImageData(im, 0, 0);
  }, [d, w, cw, ch, zoom]);
  return <figure className="dn-view"><canvas ref={ref} width={cw} height={ch} className={zoom ? "dn-img dn-zoom" : "dn-img"} role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

/** DenoiseLab (Module 18): add a noise type to a clean test image, filter it, and compare with the clean image (PSNR, zoom on fine detail). */
export function DenoiseLab({ initialNoise = "gaussian", initialFilter = "gauss", filters = ["none", "box", "gauss", "median", "bilateral", "nlm"], caption }: { initialNoise?: Noise; initialFilter?: F; filters?: F[]; caption?: string }) {
  const clean = useGray("/images/sample-clean.png");
  const [noise, setNoise] = useState<Noise>(initialNoise);
  const [level, setLevel] = useState(N_RANGE[initialNoise][3]);
  const [f, setF] = useState<F>(initialFilter);
  const [k, setK] = useState(5);
  const [sigma, setSigma] = useState(1.5);
  const [sc, setSc] = useState(40);
  const [hh, setHh] = useState(15);
  const noisy = useMemo(() => (clean ? addNoise(clean.d, noise, level, 7) : null), [clean, noise, level]);
  const out = useMemo(() => {
    if (!clean || !noisy) return null;
    const { w, h } = clean;
    if (f === "box") return box(noisy, w, h, k);
    if (f === "gauss") return gauss(noisy, w, h, sigma);
    if (f === "median") return median(noisy, w, h, k);
    if (f === "bilateral") return bilateral(noisy, w, h, k, sc, Math.max(1, k / 2));
    if (f === "nlm") return nlm(noisy, w, h, hh, 1, 5);
    return noisy;
  }, [clean, noisy, f, k, sigma, sc, hh]);
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  const [nmin, nmax, nstep] = N_RANGE[noise];
  return (
    <figure className="fig denoiselab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Noise</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Noise type">
            {(Object.keys(N_LABEL) as Noise[]).map((n) => <button key={n} type="button" role="radio" aria-checked={noise === n} className={noise === n ? "is-on" : ""} onClick={() => { setNoise(n); setLevel(N_RANGE[n][3]); }}>{N_LABEL[n]}</button>)}
          </div>
        </div>
        {sl(noise === "gaussian" ? "σ (grey levels)" : noise === "saltpepper" ? "fraction of pixels" : noise === "speckle" ? "relative σ" : "photons at white (fewer = noisier)", level, setLevel, nmin, nmax, nstep)}
        <div className="ctl ctl-full"><span>Filter</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Filter">
            {filters.map((x) => <button key={x} type="button" role="radio" aria-checked={f === x} className={f === x ? "is-on" : ""} onClick={() => setF(x)}>{F_LABEL[x]}</button>)}
          </div>
        </div>
        {(f === "box" || f === "median" || f === "bilateral") && sl(f === "bilateral" ? "diameter d" : "size k", k, setK, 3, 9, 2)}
        {f === "gauss" && sl("σ (pixels)", sigma, setSigma, 0.5, 4, 0.25)}
        {f === "bilateral" && sl("σ colour (grey levels)", sc, setSc, 5, 120, 5)}
        {f === "nlm" && sl("h (filter strength)", hh, setHh, 3, 40, 1)}
      </div>
      {clean && noisy && out && (
        <>
          <div className="dn-grid">
            <View d={clean.d} w={clean.w} h={clean.h} label="clean" />
            <View d={noisy} w={clean.w} h={clean.h} label={`noisy · PSNR ${psnr(noisy, clean.d).toFixed(1)} dB`} />
            <View d={out} w={clean.w} h={clean.h} label={`${F_LABEL[f]} · PSNR ${psnr(out, clean.d).toFixed(1)} dB`} />
          </div>
          <div className="dn-grid">
            <View d={clean.d} w={clean.w} h={clean.h} zoom label="zoom: clean" />
            <View d={noisy} w={clean.w} h={clean.h} zoom label="zoom: noisy" />
            <View d={out} w={clean.w} h={clean.h} zoom label="zoom: filtered (thin lines, small text)" />
          </div>
        </>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
