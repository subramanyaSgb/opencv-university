"use client";

import { useState } from "react";
import { afterAlarms, counts, posterior } from "@/lib/bayes-ops";

const PRIORS = [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2];
const pct = (v: number, d = 1) => `${(100 * v).toFixed(d)} %`;
const num = (v: number) => (v >= 10 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1));

/** BayesLab: defect rate, detection rate and false-alarm rate → how many alarms are real. */
export function BayesLab({ caption }: { caption?: string }) {
  const [pi, setPi] = useState(2);
  const [sens, setSens] = useState(99);
  const [fa, setFa] = useState(2);
  const [n, setN] = useState(10000);
  const prior = PRIORS[pi];
  const c = counts(n, prior, sens / 100, fa / 100);
  const p = posterior(prior, sens / 100, fa / 100);
  const alarms = c.tp + c.fp;
  const realShare = alarms ? c.tp / alarms : 0;
  return (
    <figure className="fig bayeslab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Defect rate (prior) <output>{pct(prior, prior < 0.001 ? 2 : 1)}</output></span><input type="range" min={0} max={PRIORS.length - 1} value={pi} onChange={(e) => setPi(Number(e.target.value))} aria-label="Defect rate" /></label>
        <label className="ctl ctl-wide"><span>Detection rate <output>{sens} %</output></span><input type="range" min={50} max={100} value={sens} onChange={(e) => setSens(Number(e.target.value))} aria-label="Detection rate" /></label>
        <label className="ctl ctl-wide"><span>False-alarm rate <output>{fa} %</output></span><input type="range" min={0} max={20} step={0.5} value={fa} onChange={(e) => setFa(Number(e.target.value))} aria-label="False alarm rate" /></label>
        <label className="ctl ctl-wide"><span>Parts per shift <output>{n.toLocaleString("en-US")}</output></span><input type="range" min={1000} max={100000} step={1000} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Parts" /></label>
      </div>
      <div className="by-bar" role="img" aria-label={`Of ${num(alarms)} alarms, ${num(c.tp)} are real defects`}>
        <span className="by-real" style={{ width: `${100 * realShare}%` }} />
        <span className="by-false" style={{ width: `${100 * (1 - realShare)}%` }} />
      </div>
      <div className="by-legend"><span className="by-k by-real" /> real defects {num(c.tp)} <span className="by-k by-false" /> false alarms {num(c.fp)}</div>
      <table className="by-table">
        <thead><tr><th></th><th>Alarm</th><th>No alarm</th></tr></thead>
        <tbody>
          <tr><th>Defective ({num(c.tp + c.fn)})</th><td className="by-tp">{num(c.tp)} caught</td><td className="by-fn">{num(c.fn)} missed</td></tr>
          <tr><th>Good ({num(c.fp + c.tn)})</th><td className="by-fp">{num(c.fp)} false alarms</td><td>{num(c.tn)} passed</td></tr>
        </tbody>
      </table>
      <ul className="ap-stats">
        <li><span>P(defect | alarm)</span><strong>{pct(p.defectGivenAlarm)}</strong><em>precision: share of alarms that are real</em></li>
        <li><span>P(defect | passed)</span><strong>{pct(p.defectGivenPass, 3)}</strong><em>escapes among passed parts</em></li>
        <li><span>After 2 independent alarms</span><strong>{pct(afterAlarms(prior, sens / 100, Math.max(fa, 0.01) / 100, 2))}</strong><em>e.g. a second camera or re-test</em></li>
      </ul>
      <div className="pg-readout"><span>Detection rate = P(alarm | defect); false-alarm rate = P(alarm | good). When defects are rare, even a small false-alarm rate on the many good parts outnumbers the real defects. Lower the false-alarm rate or raise the prior (pre-selection) to make alarms trustworthy.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
