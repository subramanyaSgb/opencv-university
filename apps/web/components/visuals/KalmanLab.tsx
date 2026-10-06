"use client";

import { useEffect, useState } from "react";

type Data = { true_x: number[]; measured_x: number[]; kalman_x: number[]; freeze_x: number[]; had_measurement: boolean[]; dropout: [number, number] };

const W = 480, H = 170;

/** KalmanLab (Module 40.5): real cv2.KalmanFilter results (precomputed by
 *  scripts/gen_kalman_data.py) on a noisy constant-velocity target, including a real
 *  simulated measurement dropout -- Kalman's prediction vs a naive freeze-last-position
 *  fallback during the gap. */
export function KalmanLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [showFreeze, setShowFreeze] = useState(true);

  useEffect(() => {
    fetch("/data/kalman-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const n = data.true_x.length;
  const allVals = [...data.true_x, ...data.measured_x, ...data.kalman_x, ...data.freeze_x];
  const maxV = Math.max(...allVals), minV = Math.min(...allVals);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - 10 - ((v - minV) / (maxV - minV)) * (H - 20);
  const line = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const dropX1 = x(data.dropout[0]), dropX2 = x(data.dropout[1] - 1);

  return (
    <figure className="fig kalmanlab">
      <label className="ctl ctl-wide" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <input type="checkbox" checked={showFreeze} onChange={(e) => setShowFreeze(e.target.checked)} />
        <span>Show naive "freeze last position" during the dropout</span>
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="True, measured and Kalman-estimated position over time">
        <rect x={dropX1} y={0} width={dropX2 - dropX1} height={H} fill="var(--bg-sunk)" opacity={0.6} />
        <polyline points={line(data.true_x)} fill="none" stroke="#2da44e" strokeWidth={2} />
        <polyline points={line(data.measured_x)} fill="none" stroke="#8250df" strokeWidth={1} opacity={0.6} />
        <polyline points={line(data.kalman_x)} fill="none" stroke="#1f6feb" strokeWidth={2} />
        {showFreeze && <polyline points={line(data.freeze_x)} fill="none" stroke="#cf222e" strokeWidth={1.5} strokeDasharray="4 2" />}
        <text x={(dropX1 + dropX2) / 2} y={14} textAnchor="middle" className="ov-t">dropout: no measurement</text>
      </svg>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#2da44e" }} /> true position
        <span className="by-k" style={{ background: "#8250df" }} /> noisy measurement
        <span className="by-k" style={{ background: "#1f6feb" }} /> Kalman estimate
        {showFreeze && <><span className="by-k" style={{ background: "#cf222e" }} /> freeze-last-position</>}
      </div>
      <ul className="ap-stats">
        <li><span>Mean |error|, raw measurement</span><strong>5.52 px</strong></li>
        <li><span>Mean |error|, Kalman estimate</span><strong style={{ color: "#2da44e" }}>3.33 px</strong></li>
        <li><span>Error at end of dropout</span><strong>Kalman 3.2 px vs freeze 38.0 px</strong></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.KalmanFilter, precomputed. During the dropout, Kalman keeps extrapolating with its learned velocity; freezing the last known position assumes zero velocity instead, and falls far behind.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
