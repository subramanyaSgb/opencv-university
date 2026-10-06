"use client";

import { useEffect, useState } from "react";

type Result = { n_views: number; rms: number; fx: number; fy: number; cx: number; cy: number; fx_error: number };
type Data = { k_true: { fx: number; fy: number; cx: number; cy: number }; results: Result[] };

/** CalibLab (Module 41.4): real cv2.calibrateCamera results (precomputed by
 *  scripts/gen_calib_data.py) recovering a known K_true from a synthetic multi-view
 *  chessboard with realistic 0.2 px corner noise, at 3/5/10/15 views. */
export function CalibLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(15);

  useEffect(() => {
    fetch("/data/calib-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const maxErr = Math.max(...data.results.map((r) => r.fx_error));
  const current = data.results.find((r) => r.n_views === sel) as Result;

  return (
    <figure className="fig caliblab">
      <div role="group" aria-label="Recovered fx error by number of calibration views" style={{ display: "grid", gap: "0.4rem" }}>
        {data.results.map((r) => (
          <button key={r.n_views} type="button" onClick={() => setSel(r.n_views)}
            style={{ display: "grid", gridTemplateColumns: "6rem 1fr 5rem", alignItems: "center", gap: "0.5rem", background: "none", border: r.n_views === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.6rem", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: "0.85rem" }}>{r.n_views} views</span>
            <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${(r.fx_error / maxErr) * 100}%`, background: "#1f6feb" }} />
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem" }}>{r.fx_error.toFixed(2)} px</span>
          </button>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>True fx</span><strong>{data.k_true.fx} px</strong></li>
        <li><span>Recovered fx ({sel} views)</span><strong>{current.fx.toFixed(2)} px</strong><em>error {current.fx_error.toFixed(3)} px</em></li>
        <li><span>RMS reprojection error</span><strong>{current.rms.toFixed(3)} px</strong><em>roughly constant -- it reflects the per-corner noise, not the view count</em></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.calibrateCamera, precomputed. More views reduce the error in the recovered fx itself, even though the per-corner RMS residual stays about the same -- more views average out the same noise in the parameter estimate.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
