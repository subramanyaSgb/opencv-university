"use client";

import { useState } from "react";

const C = 299792458; // m/s, real speed of light

/** TimeOfFlightLab (Module 42.6): live, real direct-ToF round-trip timing and phase-based
 *  ToF distance recovery, including the real phase-wrapping failure past the max
 *  unambiguous range -- verified exactly against the real physics formulas. */
export function TimeOfFlightLab({ caption }: { caption?: string }) {
  const [distance, setDistance] = useState(3);
  const [fMod, setFMod] = useState(20);

  const roundTripNs = (2 * distance / C) * 1e9;
  const fModHz = fMod * 1e6;
  const maxRange = C / (2 * fModHz);
  const truePhase = (4 * Math.PI * fModHz * distance / C) % (2 * Math.PI);
  const recoveredDistance = (truePhase * C) / (4 * Math.PI * fModHz);
  const wrapped = distance > maxRange;

  return (
    <figure className="fig toflab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>True distance <output>{distance.toFixed(1)} m</output></span>
          <input type="range" min={0.1} max={12} step={0.1} value={distance} onChange={(e) => setDistance(Number(e.target.value))} aria-label="Distance" /></label>
        <label className="ctl ctl-wide"><span>Modulation frequency <output>{fMod} MHz</output></span>
          <input type="range" min={5} max={40} step={1} value={fMod} onChange={(e) => setFMod(Number(e.target.value))} aria-label="Modulation frequency" /></label>
      </div>
      <ul className="ap-stats">
        <li><span>Direct ToF round-trip time</span><strong>{roundTripNs.toFixed(3)} ns</strong><em>at the speed of light, exactly</em></li>
        <li><span>Max unambiguous range (phase ToF)</span><strong>{maxRange.toFixed(2)} m</strong><em>c / (2 &times; f_mod)</em></li>
        <li><span>Phase-recovered distance</span><strong style={{ color: wrapped ? "#cf222e" : "#2da44e" }}>{recoveredDistance.toFixed(3)} m</strong><em>{wrapped ? "WRAPPED -- wrong, looks closer than it is" : "correct"}</em></li>
      </ul>
      <div className="pg-readout"><span>Push the true distance past the max unambiguous range and watch the phase-recovered distance wrap around to a real, wrong, closer-looking value -- a real, physical ambiguity, not a bug.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
