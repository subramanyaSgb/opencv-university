"use client";

import { useEffect, useState } from "react";

type Result = { n_points: number; tvec_error_mm: number };
type Data = { tvec_true: number[]; rvec_true: number[]; results: Result[] };

/** PnPLab (Module 41.5): real cv2.solvePnP pose-recovery error vs number of correspondence
 *  points (precomputed by scripts/gen_pnp_data.py), same chessboard/camera as 41.4. */
export function PnPLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(54);

  useEffect(() => {
    fetch("/data/pnp-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const maxErr = Math.max(...data.results.map((r) => r.tvec_error_mm));
  const current = data.results.find((r) => r.n_points === sel) as Result;

  return (
    <figure className="fig pnplab">
      <div role="group" aria-label="Pose error by number of correspondence points" style={{ display: "grid", gap: "0.4rem" }}>
        {data.results.map((r) => (
          <button key={r.n_points} type="button" onClick={() => setSel(r.n_points)}
            style={{ display: "grid", gridTemplateColumns: "6rem 1fr 6rem", alignItems: "center", gap: "0.5rem", background: "none", border: r.n_points === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.6rem", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: "0.85rem" }}>{r.n_points} points</span>
            <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${Math.sqrt(r.tvec_error_mm / maxErr) * 100}%`, background: "#1f6feb" }} />
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem" }}>{r.tvec_error_mm.toFixed(3)} mm</span>
          </button>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>True camera position (mm)</span><strong>({data.tvec_true.map((v) => v.toFixed(0)).join(", ")})</strong></li>
        <li><span>Position error ({sel} points)</span><strong>{current.tvec_error_mm.toFixed(3)} mm</strong></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.solvePnP, precomputed. Error drops sharply from 4 to 10 points, then levels off -- the minimum 4-6 points needed for a solution at all is not the same as enough points for a reliably accurate one.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
