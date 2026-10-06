"use client";

import { useState } from "react";

const TRUE_RADIANCE = [1.0, 10.0, 100.0, 1000.0, 10000.0];
const LABELS = ["Deep shadow", "Shadow", "Midtone", "Bright", "Window/sky"];
const EXPOSURE_TIMES = [0.0001, 0.001, 0.01, 0.1, 1.0];
const GAIN = 128.0, MAX_COUNT = 255;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rand: () => number) {
  const u1 = rand(), u2 = rand();
  return Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
}
function weight(c: number) {
  return Math.max(0, Math.min(1, Math.min(c, MAX_COUNT - c) / (MAX_COUNT / 2)));
}

const countsByExposure = EXPOSURE_TIMES.map((t, i) => {
  const rand = mulberry32(100 + i);
  return TRUE_RADIANCE.map((r) => Math.max(0, Math.min(MAX_COUNT, r * GAIN * t + 1.5 * gaussian(rand))));
});

/** HdrLab (Module 48.1): live, exact single-exposure vs weighted multi-exposure HDR
 *  recovery (same seeded simulation as the chapter's own Code section) across 5 real tone
 *  regions spanning 4 decades of true radiance. */
export function HdrLab({ caption }: { caption?: string }) {
  const [selExposure, setSelExposure] = useState(2);
  const [merged, setMerged] = useState(false);

  const singleCounts = countsByExposure[selExposure];
  const singleWeights = singleCounts.map(weight);

  let mergedRecovered: number[] = [];
  if (merged) {
    mergedRecovered = TRUE_RADIANCE.map((_, idx) => {
      let num = 0, den = 0;
      EXPOSURE_TIMES.forEach((t, ei) => {
        const c = countsByExposure[ei][idx];
        const w = c < 1.0 ? 0 : weight(c);
        num += w * (c / (GAIN * t));
        den += w;
      });
      return den > 1e-6 ? num / den : NaN;
    });
  }

  return (
    <figure className="fig hdrlab">
      <div role="group" aria-label="Mode" style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" onClick={() => setMerged(false)} style={{ background: "none", border: !merged ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Single exposure</button>
        <button type="button" onClick={() => setMerged(true)} style={{ background: "none", border: merged ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>5-exposure merge</button>
      </div>
      {!merged && (
        <label className="ctl ctl-wide"><span>Exposure time <output>{EXPOSURE_TIMES[selExposure]}s</output></span>
          <input type="range" min={0} max={4} step={1} value={selExposure} onChange={(e) => setSelExposure(Number(e.target.value))} aria-label="Exposure time" /></label>
      )}
      <div role="group" aria-label="Tone regions" style={{ display: "grid", gap: "0.3rem" }}>
        {LABELS.map((lbl, i) => {
          const trueVal = TRUE_RADIANCE[i];
          if (!merged) {
            const c = singleCounts[i], w = singleWeights[i];
            const usable = w >= 0.05;
            return (
              <div key={lbl} style={{ display: "grid", gridTemplateColumns: "7rem 6rem 1fr", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem" }}>{lbl} ({trueVal})</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>raw={c.toFixed(1)}</span>
                <span style={{ fontSize: "0.78rem", color: usable ? "#2da44e" : "#cf222e" }}>{usable ? `usable (weight ${w.toFixed(3)})` : "unusable / clipped"}</span>
              </div>
            );
          }
          const rec = mergedRecovered[i];
          const isNan = Number.isNaN(rec);
          const errPct = isNan ? null : (Math.abs(rec - trueVal) / trueVal) * 100;
          return (
            <div key={lbl} style={{ display: "grid", gridTemplateColumns: "7rem 6rem 1fr", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem" }}>{lbl} ({trueVal})</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>{isNan ? "FAILED" : rec.toFixed(2)}</span>
              <span style={{ fontSize: "0.78rem", color: isNan ? "#cf222e" : "#2da44e" }}>{isNan ? "no usable exposure" : `error ${errPct!.toFixed(2)}%`}</span>
            </div>
          );
        })}
      </div>
      <div className="pg-readout"><span>Live, exact simulation (same seeds as the chapter's own Code section). A single exposure always leaves some real regions clipped or buried in noise; merging all 5 recovers every one to within a few percent.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
