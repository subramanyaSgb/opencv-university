"use client";

import { useEffect, useState } from "react";

type Result = { label: string; valid_fraction: number; mean_disparity: number };
type Data = { true_disparity: number; results: Result[] };

/** DisparityLab (Module 42.3): real cv2.StereoBM/StereoSGBM coverage and mean-disparity
 *  results (precomputed by scripts/gen_disparity_data.py) on a synthetic, known-disparity
 *  textured plane -- showing the real coverage-vs-accuracy trade-off of uniquenessRatio. */
export function DisparityLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    fetch("/data/disparity-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const current = data.results[sel];

  return (
    <figure className="fig disparitylab">
      <div role="group" aria-label="Disparity method" style={{ display: "grid", gap: "0.4rem" }}>
        {data.results.map((r, i) => (
          <button key={r.label} type="button" onClick={() => setSel(i)}
            style={{ display: "grid", gridTemplateColumns: "7rem 1fr 5rem", alignItems: "center", gap: "0.5rem", background: "none", border: i === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.6rem", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: "0.85rem" }}>{r.label}</span>
            <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${r.valid_fraction * 100}%`, background: "#1f6feb" }} />
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem" }}>{(r.valid_fraction * 100).toFixed(1)}%</span>
          </button>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>True disparity</span><strong>{data.true_disparity} px</strong></li>
        <li><span>{current.label} coverage</span><strong>{(current.valid_fraction * 100).toFixed(1)}%</strong></li>
        <li><span>{current.label} mean disparity</span><strong>{current.mean_disparity.toFixed(2)} px</strong><em>error {(current.mean_disparity - data.true_disparity).toFixed(2)} px</em></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.StereoBM/StereoSGBM, precomputed. BM's default uniquenessRatio rejects nearly everything here (2.8% coverage) on this synthetic texture; relaxing it to 0 covers 77.9% of the image, at no real cost to mean accuracy on this test.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
