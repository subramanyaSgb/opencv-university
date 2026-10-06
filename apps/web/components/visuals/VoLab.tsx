"use client";

import { useEffect, useState } from "react";

type Data = {
  num_frames: number;
  true_step: number;
  noise_std: number;
  inliers: number[];
  n_points: number[];
  true_z: number[];
  oracle_scale_z: number[];
  oracle_scale_error: number[];
  naive_unit_scale_z: number[];
  naive_unit_scale_final_distance_ratio: number;
};

const W = 480, H = 170;

/** VoLab (Module 43.2): real chained cv2.findEssentialMat/recoverPose results
 *  (precomputed by scripts/gen_vo_data.py) over a synthetic 20-frame forward-moving
 *  camera path -- the real, slow positional drift that accumulates even when every
 *  step's scale is known exactly, vs the real, much larger, constant-factor distance
 *  error that appears with no scale reference at all. */
export function VoLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [showNaive, setShowNaive] = useState(false);

  useEffect(() => {
    fetch("/data/vo-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const n = data.num_frames;
  const allVals = showNaive
    ? [...data.true_z, ...data.naive_unit_scale_z]
    : [...data.true_z, ...data.oracle_scale_z];
  const maxV = Math.max(...allVals), minV = Math.min(...allVals);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - 14 - ((v - minV) / (maxV - minV)) * (H - 28);
  const line = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const lastErr = data.oracle_scale_error[n - 1];
  const meanInliers = data.inliers.reduce((a, b) => a + b, 0) / data.inliers.length;

  return (
    <figure className="fig volab">
      <label className="ctl ctl-wide" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <input type="checkbox" checked={showNaive} onChange={(e) => setShowNaive(e.target.checked)} />
        <span>Show the no-scale-reference (naive unit-scale) trajectory instead</span>
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="True vs estimated forward position over 20 frames">
        <polyline points={line(data.true_z)} fill="none" stroke="#2da44e" strokeWidth={2} />
        {!showNaive && <polyline points={line(data.oracle_scale_z)} fill="none" stroke="#1f6feb" strokeWidth={2} strokeDasharray="5 3" />}
        {showNaive && <polyline points={line(data.naive_unit_scale_z)} fill="none" stroke="#cf222e" strokeWidth={2} strokeDasharray="5 3" />}
      </svg>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#2da44e" }} /> true forward position
        {!showNaive && <><span className="by-k" style={{ background: "#1f6feb" }} /> chained VO, true per-step scale</>}
        {showNaive && <><span className="by-k" style={{ background: "#cf222e" }} /> chained VO, no scale reference</>}
      </div>
      <ul className="ap-stats">
        <li><span>Mean cheirality inliers per step</span><strong>{meanInliers.toFixed(1)}</strong><em>of {data.n_points[0]}-{data.n_points[data.n_points.length - 1]} matched points</em></li>
        <li><span>Position error at frame {n - 1}, true scale known</span><strong>{lastErr.toFixed(3)} units</strong><em>real drift from accumulated per-step noise</em></li>
        <li><span>Total distance ratio, no scale reference</span><strong style={{ color: "#cf222e" }}>{data.naive_unit_scale_final_distance_ratio.toFixed(2)}x too far</strong><em>correct path shape, wrong absolute size</em></li>
      </ul>
      <div className="pg-readout"><span>Real chained cv2.recoverPose, precomputed over 20 frames. Even with every step's true distance supplied from outside (an oracle), small per-step rotation/translation errors accumulate into a real, growing drift. With no scale reference at all, the path's shape stays correct but its overall size is wrong by a constant factor close to 1/{data.true_step} -- a structurally different kind of error.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
