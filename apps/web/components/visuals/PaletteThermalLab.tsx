"use client";

import { useEffect, useState } from "react";

type PaletteData = { L: number[]; colors_bgr: [number, number, number][] };
type Data = Record<string, PaletteData>;

const NAMES = ["JET", "TURBO", "INFERNO", "BONE", "HSV"];
const T_MIN = -20, T_MAX = 150, SPAN = T_MAX - T_MIN;

/** PaletteThermalLab (Module 46.6): real cv2.applyColorMap LUTs and their real CIE L*
 *  lightness profiles (precomputed by scripts/gen_palette_data.py) -- 9.5's own L*
 *  monotonicity test, applied to the real -20C to 150C thermal calibration span, with a
 *  live confusable-pair count and worst-case real temperature gap. */
export function PaletteThermalLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [name, setName] = useState("JET");

  useEffect(() => {
    fetch("/data/palette-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const { L, colors_bgr } = data[name];
  let nConfusable = 0, worstGap = 0;
  for (let i = 0; i < 256; i++) {
    for (let j = i + 1; j < 256; j++) {
      const levelGap = j - i;
      if (levelGap > 50 && Math.abs(L[i] - L[j]) < 1.0) {
        nConfusable++;
        if (levelGap > worstGap) worstGap = levelGap;
      }
    }
  }
  const worstTempGap = (worstGap / 255) * SPAN;

  const W = 480, H = 110;
  const barY = 20;

  return (
    <figure className="fig palettethermallab">
      <div role="group" aria-label="Palette" style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
        {NAMES.map((n) => (
          <button key={n} type="button" onClick={() => setName(n)}
            style={{ background: "none", border: n === name ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.6rem", cursor: "pointer", fontSize: "0.8rem" }}>
            {n}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label={`${name} colour bar and lightness profile`}>
        {colors_bgr.map(([b, g, r], i) => (
          <rect key={i} x={(i / 256) * W} y={0} width={W / 256 + 0.5} height={barY} fill={`rgb(${r},${g},${b})`} />
        ))}
        <polyline points={L.map((l, i) => `${(i / 255) * W},${barY + 10 + (H - barY - 20) * (1 - l / 100)}`).join(" ")} fill="none" stroke="#1f6feb" strokeWidth={2} />
        <text x={4} y={H - 4} className="ov-t">L* (lightness) profile, 0 to 100</text>
      </svg>
      <ul className="ap-stats">
        <li><span>Confusable pairs (&gt;33.3&deg;C apart, L* within 1.0)</span><strong style={{ color: nConfusable > 0 ? "#cf222e" : "#2da44e" }}>{nConfusable}</strong></li>
        <li><span>Worst-case hidden temperature gap</span><strong>{worstTempGap.toFixed(1)}&deg;C</strong><em>over the -20 to 150&deg;C span</em></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.applyColorMap LUT and its real CIE L* profile, precomputed. A flat or wandering L* line (JET, TURBO, HSV) means two very different real temperatures can look the same shade; a steadily rising line (INFERNO, BONE) never does.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
