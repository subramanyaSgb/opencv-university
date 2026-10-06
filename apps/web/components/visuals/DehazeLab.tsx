"use client";

import { useEffect, useState } from "react";

type Density = { beta: number; mae_hazy: number; mae_dehazed: number; A_est: number[] };
type Data = { a_true: number; density: Density[]; sky_failure: { true_transmission: number; estimated_transmission: number; mae_sky: number; mae_non_sky: number } };

/** DehazeLab (Module 48.3): real, from-scratch Dark Channel Prior dehazing results
 *  (precomputed by scripts/gen_dehaze_data.py) -- haze-density accuracy and the real,
 *  documented sky-region failure mode. */
export function DehazeLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [mode, setMode] = useState<"density" | "sky">("density");

  useEffect(() => {
    fetch("/data/dehaze-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const maxMae = Math.max(...data.density.map((d) => d.mae_hazy));

  return (
    <figure className="fig dehazelab">
      <div role="group" aria-label="View" style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" onClick={() => setMode("density")} style={{ background: "none", border: mode === "density" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Haze density</button>
        <button type="button" onClick={() => setMode("sky")} style={{ background: "none", border: mode === "sky" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Sky-region failure</button>
      </div>
      {mode === "density" && (
        <div role="group" aria-label="Haze density results" style={{ display: "grid", gap: "0.3rem" }}>
          {data.density.map((d) => (
            <div key={d.beta} style={{ display: "grid", gridTemplateColumns: "5rem 1fr 1fr" as any, alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem" }}>beta={d.beta}</span>
              <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(d.mae_hazy / maxMae) * 100}%`, background: "#cf222e" }} />
              </span>
              <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(d.mae_dehazed / maxMae) * 100}%`, background: "#2da44e" }} />
              </span>
            </div>
          ))}
          <div className="gl-legend">
            <span className="by-k" style={{ background: "#cf222e" }} /> hazy (uncorrected) MAE
            <span className="by-k" style={{ background: "#2da44e" }} /> dehazed MAE
          </div>
        </div>
      )}
      {mode === "sky" && (
        <ul className="ap-stats">
          <li><span>True transmission (sky region)</span><strong>{data.sky_failure.true_transmission}</strong></li>
          <li><span>Estimated transmission (sky region)</span><strong style={{ color: "#cf222e" }}>{data.sky_failure.estimated_transmission}</strong><em>badly underestimated</em></li>
          <li><span>MAE in sky region</span><strong style={{ color: "#cf222e" }}>{data.sky_failure.mae_sky}</strong></li>
          <li><span>MAE in non-sky region</span><strong style={{ color: "#2da44e" }}>{data.sky_failure.mae_non_sky}</strong></li>
        </ul>
      )}
      <div className="pg-readout"><span>Real Dark Channel Prior dehazing, precomputed. Dehazing substantially cuts error at every haze density, but a bright sky-coloured region (matching the atmospheric light) gets a badly wrong transmission estimate and a real 3x worse error.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
