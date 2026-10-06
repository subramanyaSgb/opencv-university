"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepLargest, haar2, softThreshold, gaborKernel, filter2D, radon, rampFilter, backproject } from "@/lib/basis-ops";
import { psnr } from "@/lib/fourier-ops";
import { rng } from "@/lib/denoise-ops";

type Mode = "dct" | "wavelet" | "gabor" | "radon";

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
const range = (d: ArrayLike<number>) => { let a = Infinity, b = -Infinity; for (let i = 0; i < d.length; i++) { if (d[i] < a) a = d[i]; if (d[i] > b) b = d[i]; } return [a, b] as const; };
function Gray({ d, w, h, lo = 0, hi = 255, label, auto }: { d: ArrayLike<number>; w: number; h: number; lo?: number; hi?: number; label: string; auto?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const [a, b] = auto ? range(d) : [lo, hi];
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = Math.max(0, Math.min(255, Math.round(((d[i] - a) / (b - a || 1)) * 255))); im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255; }
    ctx.putImageData(im, 0, 0);
  }, [d, w, h, lo, hi, auto]);
  return <figure className="bs-view"><canvas ref={ref} width={w} height={h} className="bs-img" role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}
const seg = <T extends string>(lab: string, opts: [T, string][], v: T, set: (x: T) => void) => (
  <div className="ctl ctl-full"><span>{lab}</span>
    <div className="seg seg-small" role="radiogroup" aria-label={lab}>
      {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
    </div>
  </div>
);
const sl = (lab: string, v: number, set: (n: number) => void, min: number, max: number, st: number, unit = "") => (
  <label className="ctl ctl-wide"><span>{lab} <output>{v}{unit}</output></span><input type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={lab} /></label>
);

/** BasisLab (Module 31). mode "dct": keep the largest x % of DCT vs DFT coefficients of the 256 × 256 scene, PSNR.
 *  "wavelet": Haar levels and soft-threshold denoising of a noisy scene. "gabor": a Gabor kernel (= cv2.getGaborKernel)
 *  and its response on a woven fabric with a defect. "radon": sinogram of a CT test object and back-projection with
 *  or without the ramp filter, for any number of angles. */
export function BasisLab({ mode = "dct", caption }: { mode?: Mode; caption?: string }) {
  return (
    <figure className="fig basislab">
      {mode === "dct" ? <Dct /> : mode === "wavelet" ? <Wavelet /> : mode === "gabor" ? <Gabor /> : <Radon />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Dct() {
  const g = useGray("/images/sample-fft-scene.png"), [pct, setPct] = useState(5);
  const r = useMemo(() => (g ? { dct: keepLargest(g.d, 256, pct / 100, "dct"), dft: keepLargest(g.d, 256, pct / 100, "dft") } : null), [g, pct]);
  if (!g || !r) return <p className="bs-read">Loading…</p>;
  return (
    <>
      <div className="sc-ctl">{sl("coefficients kept", pct, setPct, 0.5, 50, 0.5, " %")}</div>
      <div className="bs-grid">
        <Gray d={g.d} w={256} h={256} label="original 256 × 256" />
        <Gray d={r.dct} w={256} h={256} label={`DCT, largest ${pct} %: PSNR ${psnr(r.dct, g.d).toFixed(1)} dB`} />
        <Gray d={r.dft} w={256} h={256} label={`DFT, largest ${pct} %: PSNR ${psnr(r.dft, g.d).toFixed(1)} dB`} />
      </div>
      <p className="bs-read">The DFT counts a complex coefficient (two numbers) and its mirror separately, so at the same percentage it stores about as many numbers as the DCT. Look at the borders: the DFT result wraps the left edge into the right one.</p>
    </>
  );
}

function Wavelet() {
  const g = useGray("/images/sample-fft-scene.png");
  const [levels, setLevels] = useState(3), [T, setT] = useState(40), [sigma, setSigma] = useState(20), [view, setView] = useState<"coef" | "result">("result");
  const noisy = useMemo(() => { if (!g) return null; const r = rng(31), n = new Float64Array(256 * 256); for (let i = 0; i < n.length; i++) n[i] = g.d[i] + sigma * Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); return n; }, [g, sigma]);
  const res = useMemo(() => {
    if (!noisy) return null;
    const c = haar2(noisy, 256, levels), t = softThreshold(c, 256, levels, T), out = haar2(t, 256, levels, true);
    let zero = 0, det = 0; const s = 256 >> levels; for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { if (x < s && y < s) continue; det++; if (t[y * 256 + x] === 0) zero++; }
    const shown = Float64Array.from(c, (v, i) => { const x = i % 256, y = (i / 256) | 0; return x < s && y < s ? v / (1 << levels) : Math.min(255, 4 * Math.abs(v)); });
    return { out, shown, zero: zero / det };
  }, [noisy, levels, T]);
  if (!g || !noisy || !res) return <p className="bs-read">Loading…</p>;
  return (
    <>
      <div className="sc-ctl">
        {sl("noise σ", sigma, setSigma, 0, 40, 5)}
        {sl("levels", levels, setLevels, 1, 5, 1)}
        {sl("soft threshold T", T, setT, 0, 120, 5)}
        {seg("Show", [["result", "denoised image"], ["coef", "Haar coefficients"]], view, setView)}
      </div>
      <div className="bs-grid">
        <Gray d={noisy} w={256} h={256} label={`noisy · PSNR ${psnr(noisy, g.d).toFixed(1)} dB`} />
        {view === "coef" ? <Gray d={res.shown} w={256} h={256} label="approximation (top-left) and |details| × 4 for each level" /> : <Gray d={res.out} w={256} h={256} label={`after thresholding · PSNR ${psnr(res.out, g.d).toFixed(1)} dB`} />}
      </div>
      <p className="bs-read">{(res.zero * 100).toFixed(1)} % of the detail coefficients set to zero. Noise spreads over all coefficients with small values; edges give a few large ones that survive the threshold.</p>
    </>
  );
}

function Gabor() {
  const g = useGray("/images/sample-fabric.png");
  const [theta, setTheta] = useState(0), [lambd, setLambd] = useState(8), [sigma, setSigma] = useState(4), [gamma, setGamma] = useState(0.5), [psi, setPsi] = useState(0);
  const k = useMemo(() => gaborKernel(21, sigma, (theta * Math.PI) / 180, lambd, gamma, (psi * Math.PI) / 180), [theta, lambd, sigma, gamma, psi]);
  const res = useMemo(() => {
    if (!g) return null;
    const r = filter2D(g.d, 256, 256, k), a = Float64Array.from(r, Math.abs);
    const box = Array.from({ length: 15 }, () => Array(15).fill(1 / 225)), e = filter2D(a, 256, 256, box);
    return { r, e };
  }, [g, k]);
  const kimg = useMemo(() => Float64Array.from(k.flat()), [k]);
  if (!g || !res) return <p className="bs-read">Loading…</p>;
  return (
    <>
      <div className="sc-ctl">
        {sl("θ orientation", theta, setTheta, 0, 180, 5, "°")}
        {sl("λ wavelength", lambd, setLambd, 3, 20, 0.5, " px")}
        {sl("σ envelope", sigma, setSigma, 1, 8, 0.5, " px")}
        {sl("γ aspect", gamma, setGamma, 0.2, 1, 0.05)}
        {sl("ψ phase", psi, setPsi, 0, 180, 15, "°")}
      </div>
      <div className="bs-grid bs-grid-4">
        <Gray d={kimg} w={21} h={21} auto label="kernel 21 × 21 (grey = 0)" />
        <Gray d={g.d} w={256} h={256} label="fabric with missing threads and a knot" />
        <Gray d={res.r} w={256} h={256} auto label="Gabor response" />
        <Gray d={res.e} w={256} h={256} auto label="local energy: mean |response| in 15 × 15" />
      </div>
      <p className="bs-read">At θ = 0° and λ = 8 px the filter responds to the vertical threads (period 8 px across x): the band without them goes dark in the energy map. At θ = 90° it responds to the horizontal threads instead, which are intact there.</p>
    </>
  );
}

function Radon() {
  const g = useGray("/images/sample-phantom.png");
  const [nAng, setNAng] = useState(60), [filt, setFilt] = useState(true);
  const res = useMemo(() => {
    if (!g) return null;
    const angles = Array.from({ length: nAng }, (_, i) => (180 * i) / nAng), sino = radon(g.d, 128, angles);
    const rec = backproject(filt ? rampFilter(sino) : sino, 128, angles);
    const s = new Float64Array(nAng * 128); sino.forEach((p, a) => s.set(p, a * 128));
    let e = 0; const scale = filt ? 1 : 1; for (let i = 0; i < rec.length; i++) e += (rec[i] * scale - g.d[i]) ** 2;
    return { s, rec, rms: Math.sqrt(e / rec.length) };
  }, [g, nAng, filt]);
  if (!g || !res) return <p className="bs-read">Loading…</p>;
  return (
    <>
      <div className="sc-ctl">
        {sl("number of angles (0…180°)", nAng, setNAng, 4, 180, 4)}
        {seg("Back-projection", [["filtered", "filtered (ramp)"], ["plain", "plain (unfiltered)"]], filt ? "filtered" : "plain", (k) => setFilt(k === "filtered"))}
      </div>
      <div className="bs-grid">
        <Gray d={g.d} w={128} h={128} label="test object" />
        <Gray d={res.s} w={128} h={nAng} auto label={`sinogram: ${nAng} projections (rows) × 128 detector positions`} />
        <Gray d={res.rec} w={128} h={128} auto label={filt ? `filtered back-projection · RMS error ${res.rms.toFixed(1)}` : "plain back-projection (blurred, scaled for display)"} />
      </div>
    </>
  );
}
