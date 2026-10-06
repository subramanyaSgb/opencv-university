"use client";

import { useEffect, useState } from "react";

type Data = { true_x: number[]; measured_x: number[]; decoy_x: (number | null)[]; kalman_x: number[]; particle_x: number[]; ambiguity: [number, number] };

const W = 480, H = 170;

/** ParticleLab (Module 40.6): a real, from-scratch particle filter vs a real cv2.KalmanFilter
 *  fed a naive averaged measurement, during a genuine bimodal ambiguity (a similar-looking
 *  decoy object for several frames). Precomputed by scripts/gen_particle_data.py. */
export function ParticleLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/data/particle-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const n = data.true_x.length;
  const decoyVals = data.decoy_x.filter((v): v is number => v !== null);
  const allVals = [...data.true_x, ...data.measured_x, ...decoyVals, ...data.kalman_x, ...data.particle_x];
  const maxV = Math.max(...allVals), minV = Math.min(...allVals);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - 10 - ((v - minV) / (maxV - minV)) * (H - 20);
  const line = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const ax1 = x(data.ambiguity[0]), ax2 = x(data.ambiguity[1] - 1);
  const errAt = (vals: number[], i: number) => Math.abs(vals[i] - data.true_x[i]);
  const lastAmbig = data.ambiguity[1] - 1;

  return (
    <figure className="fig particlelab">
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="True position, Kalman and particle filter estimates during a decoy ambiguity">
        <rect x={ax1} y={0} width={ax2 - ax1} height={H} fill="var(--bg-sunk)" opacity={0.6} />
        <polyline points={line(data.true_x)} fill="none" stroke="#2da44e" strokeWidth={2} />
        {data.decoy_x.map((v, i) => v !== null && <circle key={i} cx={x(i)} cy={y(v)} r={2} fill="#bf8700" />)}
        <polyline points={line(data.kalman_x)} fill="none" stroke="#cf222e" strokeWidth={2} strokeDasharray="4 2" />
        <polyline points={line(data.particle_x)} fill="none" stroke="#1f6feb" strokeWidth={2} />
        <text x={(ax1 + ax2) / 2} y={14} textAnchor="middle" className="ov-t">decoy ambiguity</text>
      </svg>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#2da44e" }} /> true position
        <span className="by-k" style={{ background: "#bf8700" }} /> decoy candidate
        <span className="by-k" style={{ background: "#cf222e" }} /> Kalman (naive averaged measurement)
        <span className="by-k" style={{ background: "#1f6feb" }} /> particle filter (OR-likelihood)
      </div>
      <ul className="ap-stats">
        <li><span>Kalman error at end of ambiguity</span><strong style={{ color: "#cf222e" }}>{errAt(data.kalman_x, lastAmbig).toFixed(1)} px</strong></li>
        <li><span>Particle filter error at end of ambiguity</span><strong style={{ color: "#2da44e" }}>{errAt(data.particle_x, lastAmbig).toFixed(1)} px</strong></li>
      </ul>
      <div className="pg-readout"><span>Forced to average two candidate measurements into one, Kalman&apos;s single Gaussian drifts toward a point that matches neither real object. The particle filter, weighting particles by either candidate, keeps most of its weight on the true object&apos;s cluster instead.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
