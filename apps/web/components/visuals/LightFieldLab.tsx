"use client";

import { useEffect, useState } from "react";

type Row = { n_cams: number; mean_error_on_occluded_px?: number; mean_error_overall?: number; mean_error_on_occluder_px?: number };
type Data = {
  f: number; z_bg: number; z_fg: number; spacing_mm: number; occluder_coverage_pct: number;
  results_focus_on_background: Row[];
  results_focus_on_occluder: Row[];
};

/** LightFieldLab (Module 45.2): real, from-scratch NumPy synthetic-aperture light-field
 *  refocusing (precomputed by scripts/gen_lightfield_data.py) -- shift-and-average over many
 *  sub-aperture camera views to refocus past sparse occluders onto the background, or onto
 *  the occluders themselves, at a chosen number of views. */
export function LightFieldLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [focusOn, setFocusOn] = useState<"background" | "occluder">("background");

  useEffect(() => {
    fetch("/data/lightfield-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const rows = focusOn === "background" ? data.results_focus_on_background : data.results_focus_on_occluder;
  const errKey = focusOn === "background" ? "mean_error_on_occluded_px" : "mean_error_on_occluder_px";
  const maxErr = Math.max(...rows.map((r) => (r as any)[errKey] as number));

  return (
    <figure className="fig lightfieldlab">
      <div role="group" aria-label="Refocus depth" style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" onClick={() => setFocusOn("background")}
          style={{ background: "none", border: focusOn === "background" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
          Focus on background
        </button>
        <button type="button" onClick={() => setFocusOn("occluder")}
          style={{ background: "none", border: focusOn === "occluder" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
          Focus on occluder
        </button>
      </div>
      <div role="group" aria-label="Number of sub-aperture views" style={{ display: "grid", gap: "0.3rem" }}>
        {rows.map((r) => {
          const err = (r as any)[errKey] as number;
          return (
            <div key={r.n_cams} style={{ display: "grid", gridTemplateColumns: "5rem 1fr 6rem", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem" }}>{r.n_cams} views</span>
              <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(err / maxErr) * 100}%`, background: "#1f6feb" }} />
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.8rem" }}>{err}</span>
            </div>
          );
        })}
      </div>
      <ul className="ap-stats">
        <li><span>Occluder coverage</span><strong>{data.occluder_coverage_pct}%</strong><em>of the scene, at Z={data.z_fg}mm</em></li>
        <li><span>Background depth</span><strong>Z={data.z_bg}mm</strong></li>
      </ul>
      <div className="pg-readout">
        <span>
          Real shift-and-average synthetic-aperture refocusing, precomputed. {focusOn === "background"
            ? "Refocusing on the far background: a single view stays blocked (104.69 error on occluded pixels), but averaging more, differently-positioned views progressively sees around the sparse occluders (10.80 at 33 views)."
            : "Refocusing on the near occluder instead: even a single view already sees it correctly (it's opaque and always visible), so more views mainly just average down ordinary sensor noise (2.81 to 0.47)."}
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
