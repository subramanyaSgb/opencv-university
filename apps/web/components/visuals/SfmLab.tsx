"use client";

import { useEffect, useState } from "react";

type Scene = {
  n_cheirality_inliers: number;
  n_points: number;
  rotation_error_deg: number;
  translation_angle_error_deg: number | null;
  recovered_scale_factor: number | null;
  mean_3d_error: number | null;
  max_3d_error: number | null;
  relative_error_pct: number | null;
  gt_depth_sample: number[];
  est_depth_sample_unit_scale: number[];
};
type Data = { scenes: Record<string, Scene> };

const SCENES: { key: string; label: string }[] = [
  { key: "wide-baseline", label: "Wide baseline" },
  { key: "narrow-baseline", label: "Narrow baseline" },
  { key: "pure-rotation", label: "Pure rotation" },
];

/** SfmLab (Module 43.1): real cv2.findEssentialMat / recoverPose / triangulatePoints
 *  results (precomputed by scripts/gen_sfm_data.py) on three synthetic two-view scenes
 *  with known ground truth -- showing real pose-recovery accuracy collapsing as the
 *  baseline shrinks, and failing outright under pure rotation (no parallax). */
export function SfmLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    fetch("/data/sfm-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const key = SCENES[sel].key;
  const s = data.scenes[key];
  const failed = s.n_cheirality_inliers === 0;

  return (
    <figure className="fig sfmlab">
      <div role="group" aria-label="Scene" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {SCENES.map((sc, i) => (
          <button key={sc.key} type="button" onClick={() => setSel(i)}
            style={{ background: "none", border: i === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
            {sc.label}
          </button>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>Cheirality inliers</span><strong style={{ color: failed ? "#cf222e" : "#2da44e" }}>{s.n_cheirality_inliers} / {s.n_points}</strong><em>{failed ? "recoverPose failed outright" : "points consistent with a real pose in front of both cameras"}</em></li>
        <li><span>Rotation error</span><strong>{s.rotation_error_deg.toFixed(3)}&deg;</strong></li>
        <li><span>Translation direction error</span><strong>{s.translation_angle_error_deg === null ? "undefined" : `${s.translation_angle_error_deg.toFixed(3)}°`}</strong><em>{s.translation_angle_error_deg === null ? "no translation to recover under pure rotation" : null}</em></li>
        <li><span>Mean 3D error (after fixing scale)</span><strong>{s.mean_3d_error === null ? "n/a" : `${s.mean_3d_error.toFixed(3)} units`}</strong><em>{s.relative_error_pct === null ? "" : `${s.relative_error_pct.toFixed(1)}% of mean depth`}</em></li>
      </ul>
      <div className="pg-readout">
        <span>
          Real <code>cv2.findEssentialMat</code> + <code>cv2.recoverPose</code> + <code>cv2.triangulatePoints</code>, precomputed on three synthetic two-view scenes sharing the same 3D points.
          {key === "wide-baseline" && " A 1-unit sideways baseline with a small rotation: pose recovers to well under 2° and the rescaled 3D reconstruction is within 2% of the true depths."}
          {key === "narrow-baseline" && " The same scene with the camera moved only 0.05 units: the essential matrix is now dominated by pixel noise relative to the tiny parallax, and recoverPose finds zero points consistent with any real pose -- a full, not graceful, failure."}
          {key === "pure-rotation" && " The camera only pans, it never translates: rotation still recovers reasonably, but triangulation has no baseline to work with, so recovered depths are off by 3-8x -- the classic structure-from-motion degeneracy."}
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
