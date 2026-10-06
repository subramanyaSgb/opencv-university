"use client";

import { useState } from "react";

const H_PLANCK = 6.62607015e-34, C_LIGHT = 2.99792458e8, EV = 1.602176634e-19;

const MATERIALS: { name: string; eg: number }[] = [
  { name: "Silicon (CMOS/CCD)", eg: 1.12 },
  { name: "GaAs", eg: 1.42 },
  { name: "InGaAs (SWIR)", eg: 0.73 },
  { name: "Germanium", eg: 0.67 },
];

/** BandgapLab (Module 47.1): live, exact E=hc/lambda vs a sensor material's own real
 *  bandgap energy -- drag the wavelength and see whether each real material could detect
 *  it, and why. */
export function BandgapLab({ caption }: { caption?: string }) {
  const [wl, setWl] = useState(940);
  const photonEv = (H_PLANCK * C_LIGHT) / (wl * 1e-9) / EV;

  return (
    <figure className="fig bandgaplab">
      <label className="ctl ctl-wide"><span>Wavelength <output>{wl} nm</output></span>
        <input type="range" min={400} max={2000} step={5} value={wl} onChange={(e) => setWl(Number(e.target.value))} aria-label="Wavelength" /></label>
      <ul className="ap-stats">
        <li><span>Photon energy</span><strong>{photonEv.toFixed(3)} eV</strong></li>
      </ul>
      <div role="group" aria-label="Materials" style={{ display: "grid", gap: "0.3rem" }}>
        {MATERIALS.map((m) => {
          const detectable = photonEv >= m.eg;
          const cutoffNm = (H_PLANCK * C_LIGHT) / (m.eg * EV) * 1e9;
          return (
            <div key={m.name} style={{ display: "grid", gridTemplateColumns: "10rem 1fr 7rem", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem" }}>{m.name}</span>
              <span style={{ fontSize: "0.8rem", color: detectable ? "#2da44e" : "#cf222e" }}>{detectable ? "detects it" : "cannot detect (below bandgap)"}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>cutoff {cutoffNm.toFixed(0)}nm</span>
            </div>
          );
        })}
      </div>
      <div className="pg-readout"><span>Live, exact E=hc/lambda. Drag past 1107nm and watch silicon stop detecting entirely, while InGaAs and germanium keep going.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
