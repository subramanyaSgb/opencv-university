"use client";

import { useMemo, useState } from "react";
import { channelAt, demosaic, mosaic, type Pattern, type RGB } from "@/lib/bayer-ops";

const N = 8;
const SCENES: Record<string, (r: number, c: number) => RGB> = {
  "Flat orange": () => [230, 140, 40],
  "Red / blue edge": (_r, c) => (c < 4 ? [210, 30, 30] : [30, 60, 210]),
  "Thin white line": (_r, c) => (c === 3 ? [255, 255, 255] : [20, 20, 20]),
};
const NAMES = ["R", "G", "B"];
const MODES = ["Scene", "What the sensor records", "Demosaiced"] as const;

/** BayerLab: a tiny 8 × 8 scene, the mosaic the sensor records, and the bilinear reconstruction. */
export function BayerLab({ caption }: { caption?: string }) {
  const [scene, setScene] = useState("Red / blue edge");
  const [pattern, setPattern] = useState<Pattern>("RGGB");
  const [mode, setMode] = useState<(typeof MODES)[number]>("What the sensor records");
  const [sel, setSel] = useState<[number, number]>([3, 3]);
  const img = useMemo(() => Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => SCENES[scene](r, c))), [scene]);
  const m = useMemo(() => mosaic(img, pattern), [img, pattern]);
  const d = useMemo(() => demosaic(m, pattern), [m, pattern]);
  const [sr, sc] = sel;
  const own = channelAt(pattern, sr, sc);

  const colourOf = (r: number, c: number): string => {
    if (mode === "Scene") return `rgb(${img[r][c].join(",")})`;
    if (mode === "Demosaiced") return `rgb(${d[r][c].join(",")})`;
    const ch = channelAt(pattern, r, c), v = m[r][c];
    return `rgb(${ch === 0 ? v : 0},${ch === 1 ? v : 0},${ch === 2 ? v : 0})`;
  };

  return (
    <figure className="fig bayerlab">
      <div className="sc-ctl">
        <Seg label="Scene" options={Object.keys(SCENES)} value={scene} onChange={setScene} />
        <Seg label="Pattern" options={["RGGB", "BGGR", "GRBG", "GBRG"]} value={pattern} onChange={(v) => setPattern(v as Pattern)} />
        <Seg label="Show" options={[...MODES]} value={mode} onChange={(v) => setMode(v as (typeof MODES)[number])} />
      </div>
      <div className="bl-row">
        <div className="bl-grid" role="grid" aria-label={`${mode}, ${pattern} pattern`}>
          {Array.from({ length: N * N }, (_, k) => {
            const r = Math.floor(k / N), c = k % N;
            const on = r === sr && c === sc;
            return (
              <button key={k} type="button" className={on ? "bl-cell is-sel" : "bl-cell"} style={{ background: colourOf(r, c) }}
                aria-label={`row ${r}, column ${c}: filter ${NAMES[channelAt(pattern, r, c)]}`} onClick={() => setSel([r, c])}>
                {mode === "What the sensor records" ? NAMES[channelAt(pattern, r, c)] : ""}
              </button>
            );
          })}
        </div>
        <div className="bl-info">
          <p><strong>Pixel ({sr}, {sc})</strong> sits under a <strong>{NAMES[own]}</strong> filter.</p>
          <table className="fp-table">
            <thead><tr><th></th><th>R</th><th>G</th><th>B</th></tr></thead>
            <tbody>
              <tr><td>Scene</td>{img[sr][sc].map((v, i) => <td key={i}>{v}</td>)}</tr>
              <tr><td>Measured</td>{[0, 1, 2].map((i) => <td key={i}>{i === own ? m[sr][sc] : "–"}</td>)}</tr>
              <tr><td>Demosaiced</td>{d[sr][sc].map((v, i) => <td key={i} className={i === own ? "" : "bl-guess"}>{v}</td>)}</tr>
            </tbody>
          </table>
          <p className="fl-cap">Italic values were guessed from the neighbours. Only one of three is measured.</p>
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Seg({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="ctl ctl-full">
      <span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} className={value === o ? "is-on" : ""} onClick={() => onChange(o)}>{o}</button>)}
      </div>
    </div>
  );
}
