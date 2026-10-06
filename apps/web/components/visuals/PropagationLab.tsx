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
function gaussian(rand: () => number) {
  const u1 = rand(), u2 = rand();
  return Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
}

const F = 800, B = 120;

/** PropagationLab (Module 49.3): live, exact linearized vs Monte Carlo uncertainty
 *  propagation through 42.1's own real Z=f.B/d depth formula -- drag the disparity and its
 *  noise to see when the linearized (first-order) approximation holds, and when it breaks. */
export function PropagationLab({ caption }: { caption?: string }) {
  const [dTrue, setDTrue] = useState(19.2);
  const [dStd, setDStd] = useState(1.0);

  const trueZ = (F * B) / dTrue;
  const dZdd = (F * B) / dTrue ** 2;
  const linearSigma = dZdd * dStd;

  const rand = mulberry32(Math.round(dTrue * 100 + dStd * 1000));
  const N = 3000;
  let sum = 0, sumSq = 0;
  for (let i = 0; i < N; i++) {
    const d = Math.max(0.01, dTrue + dStd * gaussian(rand));
    const z = (F * B) / d;
    sum += z; sumSq += z * z;
  }
  const mcMean = sum / N;
  const mcSigma = Math.sqrt(sumSq / N - mcMean * mcMean);
  const relNoise = (dStd / dTrue) * 100;

  return (
    <figure className="fig propagationlab">
      <label className="ctl ctl-wide"><span>Disparity d <output>{dTrue.toFixed(1)}px</output></span>
        <input type="range" min={5} max={100} step={0.5} value={dTrue} onChange={(e) => setDTrue(Number(e.target.value))} aria-label="Disparity" /></label>
      <label className="ctl ctl-wide"><span>Disparity noise std <output>{dStd.toFixed(1)}px</output></span>
        <input type="range" min={0.1} max={10} step={0.1} value={dStd} onChange={(e) => setDStd(Number(e.target.value))} aria-label="Disparity noise" /></label>
      <ul className="ap-stats">
        <li><span>Relative noise</span><strong>{relNoise.toFixed(1)}%</strong></li>
        <li><span>True depth Z</span><strong>{trueZ.toFixed(1)}mm</strong></li>
        <li><span>Linearized sigma_Z</span><strong>{linearSigma.toFixed(1)}mm</strong></li>
        <li><span>Monte Carlo sigma_Z</span><strong style={{ color: Math.abs(mcSigma - linearSigma) / linearSigma > 0.05 ? "#cf222e" : "#2da44e" }}>{mcSigma.toFixed(1)}mm</strong><em>bias {(mcMean - trueZ).toFixed(1)}mm</em></li>
      </ul>
      <div className="pg-readout"><span>Live, exact linearized formula vs a real Monte Carlo simulation. At small relative noise they match closely; push relative noise up (smaller disparity, or more noise) and watch the Monte Carlo spread and bias both pull away from the linearized prediction.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
