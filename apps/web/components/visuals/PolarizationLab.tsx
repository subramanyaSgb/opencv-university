"use client";

import { useState } from "react";

function fresnelRsRp(thetaDeg: number, n1: number, n2: number) {
  const ti = (thetaDeg * Math.PI) / 180;
  const sinT = Math.max(-1, Math.min(1, (n1 / n2) * Math.sin(ti)));
  const tt = Math.asin(sinT);
  const Rs = ((n1 * Math.cos(ti) - n2 * Math.cos(tt)) / (n1 * Math.cos(ti) + n2 * Math.cos(tt))) ** 2;
  const Rp = ((n1 * Math.cos(tt) - n2 * Math.cos(ti)) / (n1 * Math.cos(tt) + n2 * Math.cos(ti))) ** 2;
  return { Rs, Rp };
}

/** PolarizationLab (Module 47.2): live, exact Malus's law and real Fresnel/Brewster-angle
 *  reflectance for a chosen dielectric -- drag the filter angle and the viewing angle and
 *  watch transmitted intensity and glare reflectance change exactly. */
export function PolarizationLab({ caption }: { caption?: string }) {
  const [filterAngle, setFilterAngle] = useState(45);
  const [viewAngle, setViewAngle] = useState(53.06);
  const n1 = 1.0, n2 = 1.33;

  const transmitted = 100 * Math.cos((filterAngle * Math.PI) / 180) ** 2;
  const { Rs, Rp } = fresnelRsRp(viewAngle, n1, n2);
  const brewster = (Math.atan(n2 / n1) * 180) / Math.PI;

  return (
    <figure className="fig polarizationlab">
      <label className="ctl ctl-wide"><span>Filter angle (Malus's law) <output>{filterAngle}&deg;</output></span>
        <input type="range" min={0} max={90} step={1} value={filterAngle} onChange={(e) => setFilterAngle(Number(e.target.value))} aria-label="Filter angle" /></label>
      <ul className="ap-stats">
        <li><span>Transmitted intensity</span><strong>{transmitted.toFixed(1)}%</strong><em>I = I0.cos&sup2;(theta)</em></li>
      </ul>
      <label className="ctl ctl-wide"><span>Viewing angle from the water surface's normal <output>{viewAngle.toFixed(1)}&deg;</output></span>
        <input type="range" min={0} max={85} step={0.1} value={viewAngle} onChange={(e) => setViewAngle(Number(e.target.value))} aria-label="Viewing angle" /></label>
      <ul className="ap-stats">
        <li><span>Perpendicular reflectance (Rs)</span><strong>{Rs.toFixed(4)}</strong></li>
        <li><span>Parallel reflectance (Rp)</span><strong style={{ color: Rp < 0.001 ? "#2da44e" : "#cf222e" }}>{Rp.toFixed(6)}</strong><em>Brewster's angle = {brewster.toFixed(2)}&deg;</em></li>
      </ul>
      <div className="pg-readout"><span>Live, exact physics. Drag the viewing angle to exactly {brewster.toFixed(2)}&deg; and watch Rp hit zero -- the real reason a polarizing filter erases glare completely at that one angle.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
