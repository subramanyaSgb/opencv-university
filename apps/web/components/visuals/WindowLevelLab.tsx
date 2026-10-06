"use client";

import { useState } from "react";

const TISSUES: { name: string; hu: number }[] = [
  { name: "Air", hu: -1000 },
  { name: "Fat", hu: -100 },
  { name: "Water", hu: 0 },
  { name: "Muscle", hu: 40 },
  { name: "Cortical bone", hu: 1000 },
];

const PRESETS = [
  { name: "Soft tissue", center: 40, width: 400 },
  { name: "Bone", center: 400, width: 1500 },
  { name: "Lung", center: -500, width: 1500 },
];

function applyWindow(hu: number, center: number, width: number) {
  const lo = center - width / 2, hi = center + width / 2;
  const clipped = Math.max(lo, Math.min(hi, hu));
  return ((clipped - lo) / (hi - lo)) * 255;
}

/** WindowLevelLab (Module 47.4): live, exact CT windowing (reusing 11.4's own linear
 *  contrast-stretch) over 5 real reference tissue Hounsfield values -- drag window
 *  centre/width and watch which tissues clip vs spread out. */
export function WindowLevelLab({ caption }: { caption?: string }) {
  const [center, setCenter] = useState(40);
  const [width, setWidth] = useState(400);

  return (
    <figure className="fig windowlevellab">
      <div role="group" aria-label="Preset" style={{ display: "flex", gap: "0.3rem" }}>
        {PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => { setCenter(p.center); setWidth(p.width); }}
            style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.6rem", cursor: "pointer", fontSize: "0.8rem" }}>
            {p.name}
          </button>
        ))}
      </div>
      <label className="ctl ctl-wide"><span>Window centre (level) <output>{center} HU</output></span>
        <input type="range" min={-1000} max={1500} step={10} value={center} onChange={(e) => setCenter(Number(e.target.value))} aria-label="Window centre" /></label>
      <label className="ctl ctl-wide"><span>Window width <output>{width} HU</output></span>
        <input type="range" min={50} max={2500} step={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} aria-label="Window width" /></label>
      <div role="group" aria-label="Tissue display values" style={{ display: "grid", gap: "0.3rem" }}>
        {TISSUES.map((t) => {
          const v = applyWindow(t.hu, center, width);
          const clipped = v <= 0.01 || v >= 254.99;
          return (
            <div key={t.name} style={{ display: "grid", gridTemplateColumns: "7rem 1fr 4rem", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem" }}>{t.name} ({t.hu} HU)</span>
              <span style={{ height: "0.8rem", background: `rgb(${v},${v},${v})`, border: "1px solid var(--line)", borderRadius: "3px" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: clipped ? "#cf222e" : "inherit" }}>{v.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <div className="pg-readout"><span>Live, exact window/level clip-and-stretch. No single window shows every tissue well -- try each preset and watch which rows clip to pure black or white.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
