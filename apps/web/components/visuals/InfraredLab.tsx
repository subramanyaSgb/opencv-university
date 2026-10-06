"use client";

import { useState } from "react";

const H = 6.62607015e-34, C = 2.99792458e8, KB = 1.380649e-23, SIGMA = 5.670374419e-8, WIEN_B = 2.897771955e-3;

function planck(wavelengthM: number, T: number) {
  return (2 * H * C ** 2) / (wavelengthM ** 5 * (Math.exp((H * C) / (wavelengthM * KB * T)) - 1));
}

/** InfraredLab (Module 46.1): live, exact Planck's law / Wien's law / Stefan-Boltzmann --
 *  drag the temperature and watch the real emission spectrum, its peak wavelength, and the
 *  waveband it falls into (NIR/SWIR/MWIR/LWIR), computed directly, no precomputed data. */
export function InfraredLab({ caption }: { caption?: string }) {
  const [tempC, setTempC] = useState(33);
  const T = tempC + 273.15;
  const peakUm = (WIEN_B / T) * 1e6;
  const power = SIGMA * T ** 4;

  const band = peakUm < 1 ? "visible/NIR" : peakUm < 2.5 ? "SWIR" : peakUm < 5 ? "MWIR" : peakUm < 14 ? "LWIR" : "far IR";

  const W = 480, H_SVG = 140;
  const wavelengths = Array.from({ length: 100 }, (_, i) => 0.5 + (i / 99) * 14.5); // 0.5 to 15 um
  const radiances = wavelengths.map((wl) => planck(wl * 1e-6, T));
  const maxR = Math.max(...radiances);
  const pathD = wavelengths.map((wl, i) => `${(wl / 15) * W},${H_SVG - 10 - (radiances[i] / maxR) * (H_SVG - 20)}`).join(" L ");

  return (
    <figure className="fig infraredlab">
      <label className="ctl ctl-wide"><span>Temperature <output>{tempC}&deg;C ({T.toFixed(1)}K)</output></span>
        <input type="range" min={-20} max={900} step={1} value={tempC} onChange={(e) => setTempC(Number(e.target.value))} aria-label="Temperature" /></label>
      <svg viewBox={`0 0 ${W} ${H_SVG}`} className="cl-svg" role="img" aria-label="Real Planck spectral radiance curve">
        <path d={`M ${pathD}`} fill="none" stroke="#cf222e" strokeWidth={2} />
        <line x1={(peakUm / 15) * W} y1={0} x2={(peakUm / 15) * W} y2={H_SVG} stroke="#1f6feb" strokeDasharray="4 2" />
        <text x={(peakUm / 15) * W + 4} y={14} className="ov-t">peak {peakUm.toFixed(2)}&micro;m</text>
      </svg>
      <ul className="ap-stats">
        <li><span>Peak wavelength (Wien's law)</span><strong>{peakUm.toFixed(2)} &micro;m</strong><em>band: {band}</em></li>
        <li><span>Total radiated power (Stefan-Boltzmann)</span><strong>{power.toFixed(1)} W/m&sup2;</strong></li>
      </ul>
      <div className="pg-readout"><span>Live, exact Planck's law, {'lambda_peak = b/T'}, and {'sigma.T^4'}. Drag toward higher temperatures and watch the real peak shift left, out of LWIR into MWIR and then SWIR.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
