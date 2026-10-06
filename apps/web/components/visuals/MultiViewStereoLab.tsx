"use client";

import { useEffect, useState } from "react";

type Result = { mean_error_mm: number; median_error_mm: number; frac_within_10mm_pct: number };
type Scene = { label: string; noise_std: number; results: Record<string, Result> };
type Data = { f: number; z_true: number; spacing_mm: number; n_cams_tested: number[]; scenes: Record<string, Scene> };

const SCENES: { key: string; label: string }[] = [
  { key: "nonperiodic", label: "Ordinary texture" },
  { key: "periodic", label: "Repetitive texture" },
  { key: "textureless", label: "Textureless" },
];

/** MultiViewStereoLab (Module 44.3): real, from-scratch NumPy plane-sweep stereo
 *  (precomputed by scripts/gen_mvs_data.py) on three synthetic scenes -- showing that more
 *  calibrated views genuinely reduce real noise-driven depth error AND resolve real
 *  repetitive-texture ambiguity, but do NOT help at all on a genuinely textureless region. */
export function MultiViewStereoLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    fetch("/data/mvs-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const key = SCENES[sel].key;
  const scene = data.scenes[key];
  const maxErr = Math.max(...data.n_cams_tested.map((n) => scene.results[String(n)].mean_error_mm));

  return (
    <figure className="fig mvslab">
      <div role="group" aria-label="Scene" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {SCENES.map((s, i) => (
          <button key={s.key} type="button" onClick={() => setSel(i)}
            style={{ background: "none", border: i === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
            {s.label}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Number of views" style={{ display: "grid", gap: "0.3rem" }}>
        {data.n_cams_tested.map((n) => {
          const r = scene.results[String(n)];
          return (
            <div key={n} style={{ display: "grid", gridTemplateColumns: "5rem 1fr 7rem", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem" }}>{n} views</span>
              <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(r.mean_error_mm / maxErr) * 100}%`, background: r.mean_error_mm < 10 ? "#2da44e" : "#cf222e" }} />
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.8rem" }}>{r.mean_error_mm} mm</span>
            </div>
          );
        })}
      </div>
      <ul className="ap-stats">
        <li><span>Scene</span><strong>{scene.label}</strong></li>
        <li><span>Within 10mm of true depth (9 views)</span><strong>{scene.results["9"].frac_within_10mm_pct}%</strong><em>vs {scene.results["2"].frac_within_10mm_pct}% at 2 views</em></li>
      </ul>
      <div className="pg-readout">
        <span>
          Real plane-sweep stereo, precomputed, true depth {data.z_true}mm. {key === "nonperiodic" && "More views average out real sensor noise: mean error drops from 129.7mm (2 views) to 2.88mm (9 views)."}
          {key === "periodic" && "Even with the SAME real sensor noise, a repetitive texture adds a real aliasing hazard on top -- 2 views alone give 57.65mm mean error; more, differently-spaced views break the false match almost completely (6.22mm at 9)."}
          {key === "textureless" && "More views do NOT help here -- error stays around 136-149mm regardless of view count, because the real problem is a lack of any signal to match, not an ambiguity extra views can resolve."}
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
