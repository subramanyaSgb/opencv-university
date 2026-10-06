"use client";

import { useEffect, useState } from "react";

type HandEyeResult = { n_poses: number; t_error_mm: number; r_error_deg: number };
type Data = { stereo: { t_true: number[]; t_est: number[]; rms: number }; handeye: HandEyeResult[] };

/** HandEyeLab (Module 41.8): real cv2.stereoCalibrate baseline recovery and real
 *  cv2.calibrateHandEye rotation-error vs pose-count results, precomputed by
 *  scripts/gen_handeye_data.py. */
export function HandEyeLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(20);

  useEffect(() => {
    fetch("/data/handeye-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const maxErr = Math.max(...data.handeye.map((r) => r.r_error_deg));
  const current = data.handeye.find((r) => r.n_poses === sel) as HandEyeResult;
  const baselineErr = Math.hypot(...data.stereo.t_est.map((v, i) => v - data.stereo.t_true[i]));

  return (
    <figure className="fig handeyelab">
      <ul className="ap-stats">
        <li><span>Stereo baseline (true)</span><strong>{data.stereo.t_true[0]} mm</strong></li>
        <li><span>Stereo baseline (recovered)</span><strong>{data.stereo.t_est[0].toFixed(4)} mm</strong><em>error {baselineErr.toExponential(2)} mm</em></li>
      </ul>
      <div role="group" aria-label="Hand-eye rotation error by number of robot poses" style={{ display: "grid", gap: "0.4rem", marginTop: "0.8rem" }}>
        {data.handeye.map((r) => (
          <button key={r.n_poses} type="button" onClick={() => setSel(r.n_poses)}
            style={{ display: "grid", gridTemplateColumns: "6rem 1fr 6rem", alignItems: "center", gap: "0.5rem", background: "none", border: r.n_poses === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.6rem", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: "0.85rem" }}>{r.n_poses} poses</span>
            <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${(r.r_error_deg / maxErr) * 100}%`, background: "#1f6feb" }} />
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem" }}>{r.r_error_deg.toFixed(3)}&deg;</span>
          </button>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>Hand-eye rotation error ({sel} poses)</span><strong>{current.r_error_deg.toFixed(4)}&deg;</strong></li>
        <li><span>Hand-eye translation error ({sel} poses)</span><strong>{current.t_error_mm.toFixed(3)} mm</strong></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.stereoCalibrate and cv2.calibrateHandEye, precomputed. With noiseless data both recover the true transform to floating-point precision; with realistic pose/detection noise, rotation error shrinks with more robot poses -- translation error is noisier but stays in the same sub-millimetre-to-1mm range.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
