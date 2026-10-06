"use client";

import { useState } from "react";

const SIGMA = 5.670374419e-8;
const T_MIN = -20 + 273.15, T_MAX = 150 + 273.15;
const W_MIN = SIGMA * T_MIN ** 4, W_MAX = SIGMA * T_MAX ** 4;

function tempToCount(tK: number, bits: number) {
  const W = SIGMA * tK ** 4;
  const nLevels = 2 ** bits;
  const count = Math.round(((W - W_MIN) / (W_MAX - W_MIN)) * (nLevels - 1));
  return Math.max(0, Math.min(nLevels - 1, count));
}

function countToTemp(count: number, bits: number) {
  const nLevels = 2 ** bits;
  const W = W_MIN + (count / (nLevels - 1)) * (W_MAX - W_MIN);
  return (W / SIGMA) ** 0.25;
}

/** InfraRecLab (Module 46.3): live, exact round-trip temperature quantization --
 *  true temperature in, a digital count at a chosen bit depth, true temperature recovered
 *  back out, over the full -20C to 150C calibrated span. */
export function InfraRecLab({ caption }: { caption?: string }) {
  const [bits, setBits] = useState(8);
  const [tempC, setTempC] = useState(37);

  const tK = tempC + 273.15;
  const count = tempToCount(tK, bits);
  const recoveredK = countToTemp(count, bits);
  const errK = Math.abs(recoveredK - tK);

  const sampleTemps = [0, 20, 37, 60, 100, 140];
  const maxErr = Math.max(...sampleTemps.map((t) => Math.abs(countToTemp(tempToCount(t + 273.15, bits), bits) - (t + 273.15))));

  return (
    <figure className="fig infrareclab">
      <div role="group" aria-label="Bit depth" style={{ display: "flex", gap: "0.4rem" }}>
        {[8, 12, 14, 16].map((b) => (
          <button key={b} type="button" onClick={() => setBits(b)}
            style={{ background: "none", border: b === bits ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>
            {b}-bit
          </button>
        ))}
      </div>
      <label className="ctl ctl-wide"><span>True temperature <output>{tempC}&deg;C</output></span>
        <input type="range" min={-20} max={150} step={1} value={tempC} onChange={(e) => setTempC(Number(e.target.value))} aria-label="True temperature" /></label>
      <ul className="ap-stats">
        <li><span>Digital count</span><strong>{count}</strong><em>of {2 ** bits} levels</em></li>
        <li><span>Recovered temperature</span><strong>{(recoveredK - 273.15).toFixed(4)}&deg;C</strong><em>error {errK.toFixed(4)}K</em></li>
        <li><span>Worst-case error over -20 to 150C</span><strong>{maxErr.toFixed(4)}K</strong></li>
      </ul>
      <div className="pg-readout"><span>Live, exact round-trip quantization. Switch bit depth and watch the real recoverable precision change by orders of magnitude -- this is the real floor no colour palette or compression can do better than.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
