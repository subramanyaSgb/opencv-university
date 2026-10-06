"use client";

import { useState } from "react";

const PRESETS: { name: string; red: number; nir: number }[] = [
  { name: "Healthy vegetation", red: 0.07, nir: 0.45 },
  { name: "Stressed vegetation", red: 0.15, nir: 0.30 },
  { name: "Bare soil", red: 0.25, nir: 0.30 },
  { name: "Water", red: 0.05, nir: 0.03 },
  { name: "Concrete", red: 0.30, nir: 0.32 },
];

/** NdviLab (Module 47.3): live, exact NDVI=(NIR-Red)/(NIR+Red) over real representative
 *  material reflectances, plus free-drag red/NIR sliders. */
export function NdviLab({ caption }: { caption?: string }) {
  const [red, setRed] = useState(0.07);
  const [nir, setNir] = useState(0.45);
  const ndvi = (nir - red) / (nir + red);

  return (
    <figure className="fig ndvilab">
      <div role="group" aria-label="Material preset" style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => { setRed(p.red); setNir(p.nir); }}
            style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.6rem", cursor: "pointer", fontSize: "0.78rem" }}>
            {p.name}
          </button>
        ))}
      </div>
      <label className="ctl ctl-wide"><span>Red reflectance <output>{red.toFixed(2)}</output></span>
        <input type="range" min={0} max={0.5} step={0.01} value={red} onChange={(e) => setRed(Number(e.target.value))} aria-label="Red reflectance" /></label>
      <label className="ctl ctl-wide"><span>NIR reflectance <output>{nir.toFixed(2)}</output></span>
        <input type="range" min={0} max={0.5} step={0.01} value={nir} onChange={(e) => setNir(Number(e.target.value))} aria-label="NIR reflectance" /></label>
      <ul className="ap-stats">
        <li><span>NDVI</span><strong style={{ color: ndvi > 0.5 ? "#2da44e" : ndvi < 0 ? "#1f6feb" : "#d4a72c" }}>{ndvi.toFixed(3)}</strong></li>
      </ul>
      <div className="pg-readout"><span>Live, exact NDVI = (NIR-Red)/(NIR+Red). Healthy vegetation's huge NIR/Red contrast pushes NDVI high; water's near-equal low reflectance at both bands pushes it negative.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
