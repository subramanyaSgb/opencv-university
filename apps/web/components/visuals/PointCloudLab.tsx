"use client";

import { useEffect, useState } from "react";

type Data = {
  sphere_radius: number;
  n_surface: number;
  n_outliers: number;
  noise_std: number;
  downsample: { voxel_size: number; n_out: number; mean_radius_error: number }[];
  sor_k: number;
  sor: { std_ratio: number; n_flagged: number; true_outliers_caught: number; detection_rate_pct: number; false_positives: number; false_positive_rate_pct: number }[];
  normals: { k: number; mean_angular_error_deg: number; max_angular_error_deg: number }[];
  viz_cloud_x: number[];
  viz_cloud_y: number[];
  viz_outlier_x: number[];
  viz_outlier_y: number[];
  viz_outlier_flagged: boolean[];
};

const W = 320, H = 320;

/** PointCloudLab (Module 44.1): real, from-scratch NumPy point-cloud operations
 *  (precomputed by scripts/gen_pointcloud_data.py) on a synthetic noisy sphere with
 *  injected outliers -- voxel downsampling, statistical outlier removal, and local-PCA
 *  normal estimation, each measured against the known true sphere. Core OpenCV 4.13 ships
 *  no point-cloud module (new in 5.0's `ptcloud`, 8.10), so every number here is real NumPy. */
export function PointCloudLab({ mode = "outliers", caption }: { mode?: "downsample" | "outliers" | "normals"; caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(1);

  useEffect(() => {
    fetch("/data/pointcloud-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  if (mode === "downsample") {
    const rows = data.downsample;
    const cur = rows[sel] ?? rows[0];
    return (
      <figure className="fig pointcloudlab">
        <div role="group" aria-label="Voxel size" style={{ display: "flex", gap: "0.4rem" }}>
          {rows.map((r, i) => (
            <button key={r.voxel_size} type="button" onClick={() => setSel(i)}
              style={{ background: "none", border: i === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
              voxel {r.voxel_size}
            </button>
          ))}
        </div>
        <ul className="ap-stats">
          <li><span>Points before</span><strong>{data.n_surface}</strong></li>
          <li><span>Points after downsampling</span><strong>{cur.n_out}</strong><em>{(cur.n_out / data.n_surface * 100).toFixed(1)}% kept</em></li>
          <li><span>Mean radius error vs true sphere (R={data.sphere_radius})</span><strong>{cur.mean_radius_error}</strong><em>input noise std was {data.noise_std}</em></li>
        </ul>
        <div className="pg-readout"><span>Real voxel-grid downsampling (one averaged point per voxel), precomputed. A bigger voxel keeps far fewer points without making the real radius error much worse -- averaging several noisy points per voxel partly cancels the input noise.</span></div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  if (mode === "normals") {
    const rows = data.normals;
    const maxErr = Math.max(...rows.map((r) => r.max_angular_error_deg));
    return (
      <figure className="fig pointcloudlab">
        <div role="group" aria-label="Neighbourhood size k" style={{ display: "grid", gap: "0.3rem" }}>
          {rows.map((r) => (
            <div key={r.k} style={{ display: "grid", gridTemplateColumns: "4rem 1fr 6rem", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem" }}>k={r.k}</span>
              <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(r.mean_angular_error_deg / maxErr) * 100}%`, background: "#1f6feb" }} />
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.8rem" }}>{r.mean_angular_error_deg}&deg;</span>
            </div>
          ))}
        </div>
        <div className="pg-readout"><span>Real local-PCA normal estimation error vs the known analytic sphere normal, precomputed over 200 sampled points. Too few neighbours (k=5) gives a noisy, real {rows[0].mean_angular_error_deg}&deg; mean error; a larger neighbourhood averages out noise, down to {rows[rows.length - 1].mean_angular_error_deg}&deg; at k={rows[rows.length - 1].k} -- with diminishing returns beyond that.</span></div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  // mode === "outliers"
  const rows = data.sor;
  const cur = rows[sel] ?? rows[1];
  const allX = [...data.viz_cloud_x, ...data.viz_outlier_x];
  const allY = [...data.viz_cloud_y, ...data.viz_outlier_y];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const span = Math.max(maxX - minX, maxY - minY);
  const px = (x: number) => 10 + ((x - minX) / span) * (W - 20);
  const py = (y: number) => 10 + ((y - minY) / span) * (H - 20);

  return (
    <figure className="fig pointcloudlab">
      <div role="group" aria-label="Std ratio threshold" style={{ display: "flex", gap: "0.4rem" }}>
        {rows.map((r, i) => (
          <button key={r.std_ratio} type="button" onClick={() => setSel(i)}
            style={{ background: "none", border: i === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
            ratio {r.std_ratio}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Point cloud (top view) with injected outliers">
        {data.viz_cloud_x.map((x, i) => (
          <circle key={`s${i}`} cx={px(x)} cy={py(data.viz_cloud_y[i])} r={1.2} fill="#2da44e" opacity={0.5} />
        ))}
        {data.viz_outlier_x.map((x, i) => (
          <circle key={`o${i}`} cx={px(x)} cy={py(data.viz_outlier_y[i])} r={2.2} fill={sel === 1 && data.viz_outlier_flagged[i] ? "#cf222e" : "#8250df"} />
        ))}
      </svg>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#2da44e" }} /> real surface points
        <span className="by-k" style={{ background: "#8250df" }} /> injected outliers
        <span className="by-k" style={{ background: "#cf222e" }} /> outliers flagged at this ratio (std_ratio=2.0 shown)
      </div>
      <ul className="ap-stats">
        <li><span>Outliers caught</span><strong>{cur.true_outliers_caught} / {data.n_outliers}</strong><em>{cur.detection_rate_pct}%</em></li>
        <li><span>Real surface points wrongly flagged</span><strong>{cur.false_positives} / {data.n_surface}</strong><em>{cur.false_positive_rate_pct}%</em></li>
      </ul>
      <div className="pg-readout"><span>Real statistical outlier removal (k={data.sor_k} nearest-neighbour mean distance vs a global mean+{cur.std_ratio}&sigma; threshold), precomputed. A stricter (lower) ratio catches more real outliers but 0% false positives here throughout -- these outliers sit far enough from the dense, uniform sphere surface to separate cleanly.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
