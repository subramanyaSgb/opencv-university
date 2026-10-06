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

const TRUE_PARTS = [10.0, 10.2, 10.1, 10.3, 10.15, 10.25, 10.05, 10.18, 10.22, 10.12];
const N_OPS = 3, N_REP = 3;

function gaugeRR(repeatStd: number, opBias: number[], seed: number) {
  const rand = mulberry32(seed);
  const n = TRUE_PARTS.length;
  const m: number[][][] = TRUE_PARTS.map((p) =>
    opBias.map((b) => Array.from({ length: N_REP }, () => p + b + repeatStd * gaussian(rand)))
  );
  const flat = m.flat(2);
  const grandMean = flat.reduce((a, b) => a + b, 0) / flat.length;
  const partMeans = m.map((op) => op.flat().reduce((a, b) => a + b, 0) / (N_OPS * N_REP));
  const opMeans = opBias.map((_, o) => {
    let s = 0; for (let p = 0; p < n; p++) s += m[p][o].reduce((a, b) => a + b, 0) / N_REP;
    return s / n;
  });
  const partOpMeans = m.map((op) => op.map((r) => r.reduce((a, b) => a + b, 0) / N_REP));

  let SSpart = 0, SSop = 0, SSint = 0, SSrep = 0;
  for (let p = 0; p < n; p++) SSpart += (partMeans[p] - grandMean) ** 2;
  SSpart *= N_OPS * N_REP;
  for (let o = 0; o < N_OPS; o++) SSop += (opMeans[o] - grandMean) ** 2;
  SSop *= n * N_REP;
  for (let p = 0; p < n; p++) for (let o = 0; o < N_OPS; o++) SSint += (partOpMeans[p][o] - partMeans[p] - opMeans[o] + grandMean) ** 2;
  SSint *= N_REP;
  for (let p = 0; p < n; p++) for (let o = 0; o < N_OPS; o++) for (let r = 0; r < N_REP; r++) SSrep += (m[p][o][r] - partOpMeans[p][o]) ** 2;

  const MSpart = SSpart / (n - 1), MSop = SSop / (N_OPS - 1);
  const MSint = SSint / ((n - 1) * (N_OPS - 1)), MSrep = SSrep / (n * N_OPS * (N_REP - 1));
  const EVvar = MSrep;
  const AVvar = Math.max((MSop - MSint) / (n * N_REP), 0);
  const PVvar = Math.max((MSpart - MSint) / (N_OPS * N_REP), 0);
  const GRRvar = EVvar + AVvar;
  const TVvar = GRRvar + PVvar;
  return { EV: Math.sqrt(EVvar), AV: Math.sqrt(AVvar), GRR: Math.sqrt(GRRvar), PV: Math.sqrt(PVvar), TV: Math.sqrt(TVvar) };
}

/** GaugeRRLab (Module 49.4): live, exact ANOVA-based Gauge R&R on 10 real tight-tolerance
 *  parts -- equipment-noise and operator-bias sliders showing the real %GRR verdict move
 *  between the standard AIAG excellent/acceptable/unacceptable zones. */
export function GaugeRRLab({ caption }: { caption?: string }) {
  const [repeatStd, setRepeatStd] = useState(0.03);
  const [opBiasSpread, setOpBiasSpread] = useState(0.0);

  const { EV, AV, GRR, PV, TV } = gaugeRR(repeatStd, [-opBiasSpread, 0, opBiasSpread], 1);
  const pctGRR = (100 * GRR) / TV;
  const zone = pctGRR < 10 ? "excellent" : pctGRR < 30 ? "acceptable" : "unacceptable";
  const zoneColor = pctGRR < 10 ? "#2da44e" : pctGRR < 30 ? "#d4a72c" : "#cf222e";

  return (
    <figure className="fig gaugerrlab">
      <label className="ctl ctl-wide"><span>Equipment (repeatability) noise std <output>{repeatStd.toFixed(3)}mm</output></span>
        <input type="range" min={0.001} max={0.15} step={0.001} value={repeatStd} onChange={(e) => setRepeatStd(Number(e.target.value))} aria-label="Repeatability noise" /></label>
      <label className="ctl ctl-wide"><span>Operator bias spread <output>&plusmn;{opBiasSpread.toFixed(3)}mm</output></span>
        <input type="range" min={0} max={0.15} step={0.001} value={opBiasSpread} onChange={(e) => setOpBiasSpread(Number(e.target.value))} aria-label="Operator bias spread" /></label>
      <ul className="ap-stats">
        <li><span>EV (repeatability)</span><strong>{EV.toFixed(4)}mm</strong></li>
        <li><span>AV (reproducibility)</span><strong>{AV.toFixed(4)}mm</strong></li>
        <li><span>PV (part-to-part)</span><strong>{PV.toFixed(4)}mm</strong></li>
        <li><span>%GRR</span><strong style={{ color: zoneColor }}>{pctGRR.toFixed(2)}%</strong><em>{zone} (AIAG)</em></li>
      </ul>
      <div className="pg-readout"><span>Live, exact ANOVA on 10 real tight-tolerance parts (10.0-10.3mm). Push either slider up and watch %GRR cross from excellent (&lt;10%) through acceptable (10-30%) into unacceptable (&gt;30%).</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
