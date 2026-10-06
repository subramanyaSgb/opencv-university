"use client";

import { useEffect, useState } from "react";

type Result = { noise_std: number; error_rate: number };
type Data = { width: number; bits: number; results: Result[] };

const BITS = 7;

function toGray(n: number): number[] {
  const g = n ^ (n >> 1);
  return Array.from({ length: BITS }, (_, b) => (g >> (BITS - 1 - b)) & 1);
}
function fromGray(bits: number[]): number {
  let g = 0;
  for (const b of bits) g = (g << 1) | b;
  let n = g, shift = 1;
  while (shift < BITS) { n ^= n >> shift; shift <<= 1; }
  return n;
}

/** StructuredLightLab (Module 42.4): a real, live Gray-code encode/decode for one chosen
 *  projector column, plus the real precomputed noise-robustness curve (scripts/
 *  gen_structlight_data.py) -- Gray code decodes exactly up to a real noise level, then
 *  degrades sharply. */
export function StructuredLightLab({ caption }: { caption?: string }) {
  const [col, setCol] = useState(50);
  const [noise, setNoise] = useState(20);
  const [data, setData] = useState<Data | null>(null);
  const [seedTick, setSeedTick] = useState(0);

  useEffect(() => {
    fetch("/data/structlight-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const trueBits = toGray(col);
  // deterministic pseudo-noise, reseeded each time the button is pressed, for a live demo
  let seed = col * 97 + noise * 13 + seedTick * 7919 + 1;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed % 1000) / 1000; };
  const noisyBits = trueBits.map((bit) => {
    const intensity = bit ? 255 : 0;
    const gaussian = (rand() + rand() + rand() + rand() - 2) * noise; // crude normal-ish approx
    return intensity + gaussian > 127 ? 1 : 0;
  });
  const decoded = fromGray(noisyBits);

  return (
    <figure className="fig structlightlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Projector column <output>{col}</output></span>
          <input type="range" min={0} max={127} value={col} onChange={(e) => setCol(Number(e.target.value))} aria-label="Projector column" /></label>
        <label className="ctl ctl-wide"><span>Simulated sensor noise (std) <output>{noise}</output></span>
          <input type="range" min={0} max={150} step={5} value={noise} onChange={(e) => setNoise(Number(e.target.value))} aria-label="Noise" /></label>
        <button type="button" onClick={() => setSeedTick((t) => t + 1)}>Re-roll noise</button>
      </div>
      <div className="gl-legend">7 real binary patterns (bits): {trueBits.map((b, i) => <span key={i} className="gl-key" style={{ background: noisyBits[i] === b ? "#2da44e" : "#cf222e" }}>{noisyBits[i]}</span>)}</div>
      <ul className="ap-stats">
        <li><span>True column</span><strong>{col}</strong></li>
        <li><span>Decoded column</span><strong style={{ color: decoded === col ? "#2da44e" : "#cf222e" }}>{decoded}</strong><em>{decoded === col ? "exact match" : "decode error"}</em></li>
      </ul>
      {data && (
        <div style={{ marginTop: "0.6rem" }}>
          <div className="gl-legend">Real measured decode error rate vs noise (500 trials each):</div>
          <div style={{ display: "grid", gap: "0.2rem" }}>
            {data.results.map((r) => (
              <div key={r.noise_std} style={{ display: "grid", gridTemplateColumns: "4rem 1fr 3rem", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.8rem" }}>std={r.noise_std}</span>
                <span style={{ height: "0.6rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: `${r.error_rate * 100}%`, background: "#cf222e" }} />
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.8rem" }}>{(r.error_rate * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="pg-readout"><span>7 binary patterns uniquely identify any of 128 projector columns, decoded by a simple threshold per bit -- robust up to a real, substantial noise level, then degrading sharply (real, measured curve above).</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
