"use client";

import { useEffect, useState } from "react";

type Data = {
  blur_levels: number[];
  clean_curves: Record<string, number[]>;
  noise_results: { noise_std: number; VarLaplacian: number; Tenengrad: number }[];
};

const COLORS: Record<string, string> = { VarLaplacian: "#cf222e", Tenengrad: "#1f6feb", FreqEnergy: "#8250df" };

/** FocusMetricLab (Module 50.3): real focus-metric comparison (precomputed by
 *  scripts/gen_focusmetric_data.py) -- a clean blur-sweep view and a real Monte Carlo
 *  noise-robustness view, showing variance-of-Laplacian's real fragility next to
 *  Tenengrad's real robustness. */
export function FocusMetricLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [mode, setMode] = useState<"clean" | "noise">("noise");

  useEffect(() => {
    fetch("/data/focusmetric-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const W = 480, H = 160;

  return (
    <figure className="fig focusmetriclab">
      <div role="group" aria-label="View" style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" onClick={() => setMode("clean")} style={{ background: "none", border: mode === "clean" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Clean blur sweep</button>
        <button type="button" onClick={() => setMode("noise")} style={{ background: "none", border: mode === "noise" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Noise robustness</button>
      </div>
      {mode === "clean" && (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Focus metric vs blur sigma">
            {Object.entries(data.clean_curves).map(([name, vals]) => (
              <polyline key={name} fill="none" stroke={COLORS[name]} strokeWidth={2}
                points={vals.map((v, i) => `${(i / (data.blur_levels.length - 1)) * W},${H - 10 - v * (H - 20)}`).join(" ")} />
            ))}
            <text x={4} y={14} className="ov-t">blur sigma: 0 (sharp) to 5 (most blurred)</text>
          </svg>
          <div className="gl-legend">
            {Object.keys(data.clean_curves).map((name) => <span key={name}><span className="by-k" style={{ background: COLORS[name] }} /> {name}</span>)}
          </div>
        </>
      )}
      {mode === "noise" && (
        <div role="group" aria-label="Noise robustness" style={{ display: "grid", gap: "0.3rem" }}>
          {data.noise_results.map((r) => (
            <div key={r.noise_std} style={{ display: "grid", gridTemplateColumns: "6rem 1fr 1fr" as any, alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem" }}>noise std={r.noise_std}</span>
              <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${r.VarLaplacian}%`, background: COLORS.VarLaplacian }} />
              </span>
              <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${r.Tenengrad}%`, background: COLORS.Tenengrad }} />
              </span>
            </div>
          ))}
          <div className="gl-legend">
            <span className="by-k" style={{ background: COLORS.VarLaplacian }} /> VarLaplacian % correct
            <span className="by-k" style={{ background: COLORS.Tenengrad }} /> Tenengrad % correct
          </div>
        </div>
      )}
      <div className="pg-readout"><span>Real focus metrics, precomputed (300 Monte Carlo trials per noise level in the noise-robustness view). Variance of the Laplacian (2.2's own metric) degrades badly with real sensor noise; Tenengrad stays robust.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
