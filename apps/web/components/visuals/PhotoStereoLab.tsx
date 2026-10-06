"use client";

import { useEffect, useState } from "react";

type Config = {
  n_lights: number;
  frac_shadowed_any: number;
  naive_mean_error_deg: number;
  naive_max_error_deg: number;
  shadow_aware_mean_error_deg: number;
  shadow_aware_max_error_deg: number;
  shadow_aware_n_failed_pixels: number;
  n_masked_pixels: number;
};
type Data = {
  albedo_true: number;
  noclip_baseline_mean_error_deg: number;
  mean_albedo_recovered_3lights: number;
  configs: Config[];
};

/** PhotoStereoLab (Module 44.2): real, from-scratch NumPy photometric-stereo normal
 *  recovery (precomputed by scripts/gen_photostereo_data.py) on a synthetic rendered
 *  sphere -- the real surprise that MORE lights make a naive solve WORSE (self-shadowed
 *  readings treated as real data), while shadow-aware least squares turns that same
 *  redundancy into a real, large accuracy win. */
export function PhotoStereoLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(1);
  const [shadowAware, setShadowAware] = useState(false);

  useEffect(() => {
    fetch("/data/photostereo-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const cur = data.configs[sel];
  const meanErr = shadowAware ? cur.shadow_aware_mean_error_deg : cur.naive_mean_error_deg;
  const maxErr = shadowAware ? cur.shadow_aware_max_error_deg : cur.naive_max_error_deg;

  return (
    <figure className="fig photostereolab">
      <div role="group" aria-label="Number of lights" style={{ display: "flex", gap: "0.4rem" }}>
        {data.configs.map((c, i) => (
          <button key={c.n_lights} type="button" onClick={() => setSel(i)}
            style={{ background: "none", border: i === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
            {c.n_lights} lights
          </button>
        ))}
      </div>
      <label className="ctl ctl-wide" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <input type="checkbox" checked={shadowAware} onChange={(e) => setShadowAware(e.target.checked)} />
        <span>Exclude shadowed (near-zero intensity) readings per pixel before solving</span>
      </label>
      <ul className="ap-stats">
        <li><span>Pixels shadowed in &ge;1 light</span><strong>{(cur.frac_shadowed_any * 100).toFixed(1)}%</strong><em>of {cur.n_masked_pixels} on the sphere</em></li>
        <li><span>Mean normal angular error</span><strong style={{ color: meanErr < 1 ? "#2da44e" : "#cf222e" }}>{meanErr.toFixed(4)}&deg;</strong><em>max {maxErr.toFixed(2)}&deg;</em></li>
        {shadowAware && <li><span>Pixels that failed (&lt;3 valid lights)</span><strong>{cur.shadow_aware_n_failed_pixels}</strong><em>of {cur.n_masked_pixels}</em></li>}
      </ul>
      <div className="pg-readout">
        <span>
          Real from-scratch NumPy photometric stereo, precomputed. With the naive solve (box unchecked), MORE lights make the real mean error WORSE ({data.configs[0].naive_mean_error_deg}&deg; at 3 lights &rarr; {data.configs[2].naive_mean_error_deg}&deg; at 12) -- more lights means more chances some are self-shadowed, and the naive solve treats each shadowed zero reading as real evidence.
          Checking the box excludes shadowed readings per pixel: at 3 lights this is WORSE still ({data.configs[0].shadow_aware_mean_error_deg}&deg; -- losing even one of exactly 3 leaves too few equations), but at 12 lights it reaches a real {data.configs[2].shadow_aware_mean_error_deg}&deg;, essentially exact.
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
