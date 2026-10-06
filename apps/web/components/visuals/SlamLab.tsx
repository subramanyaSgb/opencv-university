"use client";

import { useEffect, useState } from "react";

type Data = {
  num_steps: number;
  circumference: number;
  min_inliers: number;
  mean_inliers: number;
  max_inliers: number;
  loop_closure_gap: number;
  mean_error_before: number;
  mean_error_after: number;
  max_error_before: number;
  max_error_after: number;
  true_x: number[];
  true_z: number[];
  est_x: number[];
  est_z: number[];
  corrected_x: number[];
  corrected_z: number[];
};

const W = 320, H = 320, PAD = 20;

/** SlamLab (Module 43.3): real chained cv2.findEssentialMat/recoverPose visual odometry
 *  (precomputed by scripts/gen_slam_data.py) around a closed 60-step circular loop -- the
 *  real drift gap at loop closure, and a real, simple loop-closure correction (linear
 *  redistribution of the known closing error) that cuts mean position error roughly in half. */
export function SlamLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);

  useEffect(() => {
    fetch("/data/slam-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const allX = [...data.true_x, ...data.est_x, ...data.corrected_x];
  const allZ = [...data.true_z, ...data.est_z, ...data.corrected_z];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minZ = Math.min(...allZ), maxZ = Math.max(...allZ);
  const span = Math.max(maxX - minX, maxZ - minZ, 1);
  const px = (x: number) => PAD + ((x - minX) / span) * (W - 2 * PAD);
  const pz = (z: number) => PAD + ((z - minZ) / span) * (H - 2 * PAD);
  const path = (xs: number[], zs: number[]) => xs.map((x, i) => `${px(x)},${pz(zs[i])}`).join(" ");

  const estPath = showCorrected ? path(data.corrected_x, data.corrected_z) : path(data.est_x, data.est_z);
  const meanErr = showCorrected ? data.mean_error_after : data.mean_error_before;
  const maxErr = showCorrected ? data.max_error_after : data.max_error_before;

  return (
    <figure className="fig slamlab">
      <label className="ctl ctl-wide" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <input type="checkbox" checked={showCorrected} onChange={(e) => setShowCorrected(e.target.checked)} />
        <span>Apply the loop-closure correction</span>
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="True vs estimated camera path around a closed loop, top-down view">
        <polyline points={path(data.true_x, data.true_z)} fill="none" stroke="#2da44e" strokeWidth={2.5} />
        <polyline points={estPath} fill="none" stroke={showCorrected ? "#1f6feb" : "#cf222e"} strokeWidth={2} strokeDasharray="4 2" />
        <circle cx={px(data.true_x[0])} cy={pz(data.true_z[0])} r={5} fill="#2da44e" />
        <circle cx={px(data.est_x[data.est_x.length - 1])} cy={pz(data.est_z[data.est_z.length - 1])} r={4} fill={showCorrected ? "#1f6feb" : "#cf222e"} />
      </svg>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#2da44e" }} /> true closed-loop path (60 units around)
        <span className="by-k" style={{ background: showCorrected ? "#1f6feb" : "#cf222e" }} /> {showCorrected ? "corrected VO path" : "raw chained VO path"}
      </div>
      <ul className="ap-stats">
        <li><span>Mean cheirality inliers/step</span><strong>{data.mean_inliers}</strong><em>range {data.min_inliers}-{data.max_inliers}, never degenerate</em></li>
        <li><span>Loop closure gap (uncorrected)</span><strong style={{ color: "#cf222e" }}>{data.loop_closure_gap} units</strong><em>should be exactly 0 -- it's a closed loop</em></li>
        <li><span>Mean position error, {showCorrected ? "corrected" : "raw"}</span><strong>{meanErr} units</strong><em>max {maxErr} units</em></li>
      </ul>
      <div className="pg-readout"><span>Real chained cv2.recoverPose around a closed 60-unit circular path, precomputed. The raw path never returns exactly to the start -- a real 0.81-unit loop closure gap. Recognising the return (35.6-style place recognition) and linearly redistributing that known gap across the path cuts mean error from 0.35 to 0.14 units -- real, but not perfect, since a straight-line redistribution is not full pose-graph optimisation.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
