"use client";

import { useState } from "react";
import { css, grayOf, inkOn, isGray, reverse, simpleName, type RGB } from "@/lib/color-ops";

const PRESETS: { name: string; rgb: RGB }[] = [
  { name: "Red", rgb: [255, 0, 0] },
  { name: "Green", rgb: [0, 255, 0] },
  { name: "Blue", rgb: [0, 0, 255] },
  { name: "Yellow", rgb: [255, 255, 0] },
  { name: "Cyan", rgb: [0, 255, 255] },
  { name: "Magenta", rgb: [255, 0, 255] },
  { name: "Gray", rgb: [128, 128, 128] },
  { name: "White", rgb: [255, 255, 255] },
  { name: "Black", rgb: [0, 0, 0] },
];

const CH = [
  { key: 0, label: "Red", cls: "mx-r" },
  { key: 1, label: "Green", cls: "mx-g" },
  { key: 2, label: "Blue", cls: "mx-b" },
] as const;

/**
 * RgbMixer: three sliders (the "knobs") build one colour pixel.
 * Shows the RGB list, the same pixel as OpenCV stores it (BGR), and its gray value.
 */
export function RgbMixer({ initial = [255, 0, 0] as RGB }: { initial?: RGB }) {
  const [rgb, setRgb] = useState<RGB>(initial);
  const name = simpleName(rgb);
  const gray = grayOf(rgb);
  const set = (i: number, v: number) => setRgb(rgb.map((x, j) => (j === i ? v : x)) as RGB);

  return (
    <figure className="fig mixer">
      <div className="fig-controls">
        <div className="seg mx-presets" role="group" aria-label="Presets">
          {PRESETS.map((p) => (
            <button key={p.name} type="button" onClick={() => setRgb(p.rgb)} className={rgb.join() === p.rgb.join() ? "is-on" : ""}>
              <span className="mx-dot" style={{ background: css(p.rgb) }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-body">
        <div className="mx-knobs">
          {CH.map((c) => (
            <label key={c.key} className={`mx-knob ${c.cls}`}>
              <span className="mx-k">{c.label}</span>
              <input type="range" min={0} max={255} value={rgb[c.key]} onChange={(e) => set(c.key, Number(e.target.value))} aria-label={`${c.label} value`} />
              <input type="number" min={0} max={255} value={rgb[c.key]} className="num" aria-label={`${c.label} exact value`}
                onChange={(e) => set(c.key, Math.max(0, Math.min(255, Number(e.target.value) || 0)))} />
            </label>
          ))}
        </div>
        <div className="mx-out">
          <span className="mx-swatch" style={{ background: css(rgb), color: inkOn(rgb) }}>
            {name ?? ""}
          </span>
        </div>
      </div>

      <div className="iex-read" aria-live="polite">
        <div className="iex-line">
          <span className="iex-k">RGB</span>
          <code>[{rgb.join(", ")}]</code>
          {isGray(rgb) && <span className="mx-note">R = G = B → a shade of gray</span>}
        </div>
        <div className="iex-line">
          <span className="iex-k">OpenCV stores (BGR)</span>
          <code>[{reverse(rgb).join(", ")}]</code>
        </div>
        <div className="iex-line">
          <span className="iex-k">Gray value</span>
          <code>0.299×{rgb[0]} + 0.587×{rgb[1]} + 0.114×{rgb[2]}</code> ≈{" "}
          <span className="mx-gray" style={{ background: `rgb(${gray},${gray},${gray})`, color: gray >= 128 ? "#000" : "#fff" }}>{gray}</span>
        </div>
      </div>
      <figcaption>Move the three sliders like knobs. OpenCV's cv2.cvtColor gives the same gray value, or one less or more for a small fraction of colours.</figcaption>
    </figure>
  );
}
