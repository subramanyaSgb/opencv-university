"use client";

import { useState } from "react";

/** PanoramaLab (Module 45.1): live, exact planar (x=f.tan(theta)) vs cylindrical (x=f.theta)
 *  projection formulas -- the real local stretch factor and total image width needed for a
 *  chosen field of view, computed directly in the browser from the same formulas verified
 *  in this chapter's own Code section. */
export function PanoramaLab({ caption }: { caption?: string }) {
  const [fovDeg, setFovDeg] = useState(120);
  const f = 800;

  const half = (fovDeg / 2) * (Math.PI / 180);
  const planarWidth = 2 * f * Math.tan(half);
  const cylWidth = 2 * f * half;
  const ratio = fovDeg < 180 ? planarWidth / cylWidth : Infinity;

  const h = 1e-5;
  const localScale = (fn: (t: number) => number, t: number) => (fn(t + h) - fn(t - h)) / (2 * h);
  const planarFn = (t: number) => f * Math.tan(t);
  const basePlanar = localScale(planarFn, 0);
  const edgeStretch = fovDeg < 180 ? localScale(planarFn, half) / basePlanar : Infinity;

  return (
    <figure className="fig panoramalab">
      <label className="ctl ctl-wide"><span>Field of view <output>{fovDeg}&deg;</output></span>
        <input type="range" min={20} max={179} step={1} value={fovDeg} onChange={(e) => setFovDeg(Number(e.target.value))} aria-label="Field of view" /></label>
      <ul className="ap-stats">
        <li><span>Planar stretch at the edge</span><strong style={{ color: edgeStretch > 10 ? "#cf222e" : edgeStretch > 2 ? "#d4a72c" : "#2da44e" }}>{Number.isFinite(edgeStretch) ? `${edgeStretch.toFixed(2)}x` : "infinite"}</strong><em>cylindrical: always 1.00x</em></li>
        <li><span>Image width needed, planar</span><strong>{Number.isFinite(planarWidth) ? `${planarWidth.toFixed(0)}px` : "infinite"}</strong></li>
        <li><span>Image width needed, cylindrical</span><strong>{cylWidth.toFixed(0)}px</strong></li>
        <li><span>Ratio (planar / cylindrical)</span><strong>{Number.isFinite(ratio) ? `${ratio.toFixed(2)}x` : "infinite"}</strong></li>
      </ul>
      <div className="pg-readout"><span>Live, exact x=f.tan(theta) vs x=f.theta, f={f}px. Drag the field of view toward 180&deg; and watch the planar numbers diverge toward infinity while the cylindrical ones stay perfectly linear.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
