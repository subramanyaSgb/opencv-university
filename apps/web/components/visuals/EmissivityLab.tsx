"use client";

import { useState } from "react";

const SIGMA = 5.670374419e-8;

function apparentTempK(tObjK: number, tReflK: number, epsilon: number) {
  const W = epsilon * SIGMA * tObjK ** 4 + (1 - epsilon) * SIGMA * tReflK ** 4;
  return (W / SIGMA) ** 0.25;
}

/** EmissivityLab (Module 46.2): live, exact general radiometric equation --
 *  W = epsilon.sigma.T_obj^4 + (1-epsilon).sigma.T_reflected^4 -- drag emissivity and
 *  reflected temperature and watch the real apparent-temperature error. */
export function EmissivityLab({ caption }: { caption?: string }) {
  const [epsilon, setEpsilon] = useState(0.95);
  const [tReflC, setTReflC] = useState(20);
  const tObjC = 76.85;
  const tObjK = tObjC + 273.15;
  const tReflK = tReflC + 273.15;
  const appK = apparentTempK(tObjK, tReflK, epsilon);
  const appC = appK - 273.15;
  const errK = tObjK - appK;

  return (
    <figure className="fig emissivitylab">
      <label className="ctl ctl-wide"><span>Emissivity <output>{epsilon.toFixed(2)}</output></span>
        <input type="range" min={0.05} max={1} step={0.01} value={epsilon} onChange={(e) => setEpsilon(Number(e.target.value))} aria-label="Emissivity" /></label>
      <label className="ctl ctl-wide"><span>Reflected (ambient/sky) temperature <output>{tReflC}&deg;C</output></span>
        <input type="range" min={-30} max={40} step={1} value={tReflC} onChange={(e) => setTReflC(Number(e.target.value))} aria-label="Reflected temperature" /></label>
      <ul className="ap-stats">
        <li><span>True object temperature</span><strong>{tObjC}&deg;C</strong></li>
        <li><span>Apparent (naive, epsilon=1-assumed) reading</span><strong style={{ color: Math.abs(errK) > 10 ? "#cf222e" : "#2da44e" }}>{appC.toFixed(2)}&deg;C</strong></li>
        <li><span>Real error</span><strong>{errK.toFixed(2)}K</strong></li>
      </ul>
      <div className="pg-readout"><span>Live, exact radiometric equation. Drag emissivity down toward a shiny metal's real value (~0.1-0.2) and the reflected temperature down toward a cold sky, and watch a scorching-hot object read as cold.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
