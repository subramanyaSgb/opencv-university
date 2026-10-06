"use client";

import { useMemo, useState } from "react";
import { gaussPdf, mean, median, normals, robustSigma, std, twoSidedTail } from "@/lib/stats-ops";

const N = 4000, BIN = 4, NB = 64, W = 512, H = 170;

/** GaussLab: noisy pixel values, their histogram and Gaussian, mean/std vs median/MAD, and a ±kσ defect threshold. */
export function GaussLab({ caption }: { caption?: string }) {
  const [mu, setMu] = useState(120);
  const [sigma, setSigma] = useState(10);
  const [dirt, setDirt] = useState(0);
  const [k, setK] = useState(3);
  const [robust, setRobust] = useState(false);
  const data = useMemo(() => {
    const v = normals(N, mu, sigma, 11).map((x) => Math.min(255, Math.max(0, Math.round(x))));
    const nd = Math.round((N * dirt) / 100);
    for (let i = 0; i < nd; i++) v[i] = 20; // dark dirt
    return v;
  }, [mu, sigma, dirt]);
  const m = mean(data), s = std(data), md = median(data), rs = robustSigma(data);
  const c = robust ? md : m, sd = robust ? rs : s;
  const lo = c - k * sd, hi = c + k * sd;
  const outside = data.filter((x) => x < lo || x > hi).length;
  const bins = Array(NB).fill(0);
  data.forEach((x) => bins[Math.min(NB - 1, Math.floor(x / BIN))]++);
  const maxB = Math.max(...bins, 1);
  const peak = (N * BIN * gaussPdf(mu, mu, sigma));
  const yScale = (H - 20) / Math.max(maxB, peak);
  const sx = (x: number) => (x / 256) * W;
  const curve = Array.from({ length: 129 }, (_, i) => { const x = i * 2; return `${sx(x)},${H - N * BIN * gaussPdf(x, mu, sigma) * yScale}`; }).join(" ");
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, unit = "") => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}{unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  return (
    <figure className="fig gausslab">
      <div className="sc-ctl">
        {sl("True mean μ", mu, setMu, 30, 220, 1)}
        {sl("Noise σ", sigma, setSigma, 1, 40, 1)}
        {sl("Dark dirt (value 20)", dirt, setDirt, 0, 20, 1, " %")}
        {sl("Threshold k (± k σ)", k, setK, 1, 5, 0.5)}
        <div className="ctl ctl-full">
          <span>Estimate centre and spread with</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Estimator">
            {([[false, "mean and std"], [true, "median and MAD (robust)"]] as const).map(([r, l]) => (
              <button key={l} type="button" role="radio" aria-checked={robust === r} className={robust === r ? "is-on" : ""} onClick={() => setRobust(r)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="gl2-svg" role="img" aria-label={`Histogram of ${N} pixel values with the Gaussian curve and the ±${k}σ limits`}>
        <rect x={sx(Math.max(0, lo))} y={0} width={Math.max(0, sx(Math.min(256, hi)) - sx(Math.max(0, lo)))} height={H} className="gl2-band" />
        {bins.map((b, i) => <rect key={i} x={sx(i * BIN) + 0.5} y={H - b * yScale} width={sx(BIN) - 1} height={b * yScale} className={i * BIN + BIN <= lo || i * BIN >= hi ? "gl2-bar gl2-out" : "gl2-bar"} />)}
        <polyline points={curve} className="gl2-curve" />
        {[0, 64, 128, 192, 255].map((t) => <text key={t} x={sx(t)} y={H + 14} className="gl2-tick" textAnchor={t === 0 ? "start" : t === 255 ? "end" : "middle"}>{t}</text>)}
      </svg>
      <ul className="ap-stats">
        <li><span>Mean / std</span><strong>{m.toFixed(1)} / {s.toFixed(1)}</strong><em>pulled by outliers</em></li>
        <li><span>Median / robust σ</span><strong>{md.toFixed(1)} / {rs.toFixed(1)}</strong><em>1.4826 × MAD</em></li>
        <li><span>Outside ±{k}σ</span><strong>{(100 * outside / N).toFixed(2)} %</strong><em>pure noise would give {(100 * twoSidedTail(k)).toFixed(k >= 4 ? 4 : 2)} %: {Math.round(twoSidedTail(k) * 5013504).toLocaleString("en-US")} px in a 5 MP image</em></li>
      </ul>
      <div className="pg-readout"><span>Bars: {N} simulated pixel values. Curve: the true Gaussian. Shaded: centre ± {k} × spread, using {robust ? "median and robust σ" : "mean and std"}. Red bars are flagged as "defect".</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
