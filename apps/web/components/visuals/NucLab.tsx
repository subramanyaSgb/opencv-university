"use client";

import { useState } from "react";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rand: () => number, mean: number, std: number) {
  const u1 = rand(), u2 = rand();
  return mean + std * Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
}

const N = 2000;
const randBase = mulberry32(10);
const trueGain = Array.from({ length: N }, () => 1.0 + gaussian(randBase, 0, 0.03));
const trueOffset = Array.from({ length: N }, () => gaussian(randBase, 0, 8.0));
const driftCoeff = Array.from({ length: N }, () => gaussian(randBase, 0, 0.6));

function std(arr: number[]) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

/** NucLab (Module 46.4): live, exact 1-point vs 2-point non-uniformity correction on a
 *  simulated 2000-pixel detector array with real per-pixel gain/offset fixed-pattern noise,
 *  plus live internal-temperature-drift degradation of a 1-point correction. */
export function NucLab({ caption }: { caption?: string }) {
  const [deltaT, setDeltaT] = useState(0);
  const [scene, setScene] = useState<"uniform" | "gradient">("uniform");

  const rSeed = mulberry32(900);
  const rRef = mulberry32(1);
  const refCounts = trueGain.map((g, i) => g * 1000 + trueOffset[i] + gaussian(rRef, 0, 0.5));
  const refMean = refCounts.reduce((a, b) => a + b, 0) / N;
  const offsetCorrection = refCounts.map((c) => refMean - c);

  const trueVals = scene === "uniform" ? Array.from({ length: N }, () => 900) : Array.from({ length: N }, (_, i) => 600 + (600 * i) / N);
  const raw = trueVals.map((v, i) => trueGain[i] * v + trueOffset[i] + driftCoeff[i] * deltaT + gaussian(rSeed, 0, 0.5));
  const corrected1pt = raw.map((v, i) => v + offsetCorrection[i]);

  const errRaw = scene === "uniform" ? std(raw) : raw.map((v, i) => Math.abs(v - trueVals[i])).reduce((a, b) => a + b, 0) / N;
  const err1pt = scene === "uniform" ? std(corrected1pt) : corrected1pt.map((v, i) => Math.abs(v - trueVals[i])).reduce((a, b) => a + b, 0) / N;

  return (
    <figure className="fig nuclab">
      <div role="group" aria-label="Test scene" style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" onClick={() => setScene("uniform")} style={{ background: "none", border: scene === "uniform" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Uniform scene</button>
        <button type="button" onClick={() => setScene("gradient")} style={{ background: "none", border: scene === "gradient" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Gradient scene</button>
      </div>
      <label className="ctl ctl-wide"><span>Camera internal temperature drift since calibration <output>{deltaT}&deg;C</output></span>
        <input type="range" min={0} max={10} step={0.5} value={deltaT} onChange={(e) => setDeltaT(Number(e.target.value))} aria-label="Internal temperature drift" /></label>
      <ul className="ap-stats">
        <li><span>Raw (no NUC)</span><strong>{errRaw.toFixed(2)}</strong><em>{scene === "uniform" ? "std across pixels" : "mean abs error"}</em></li>
        <li><span>1-point NUC</span><strong style={{ color: err1pt > 4 ? "#cf222e" : "#2da44e" }}>{err1pt.toFixed(2)}</strong><em>calibrated at drift=0</em></li>
      </ul>
      <div className="pg-readout"><span>Live, exact per-pixel gain/offset simulation (2000 pixels). Switch to the gradient scene to see 1-point correction's real limitation, and drag the drift slider to see a stale calibration's real residual error grow.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
