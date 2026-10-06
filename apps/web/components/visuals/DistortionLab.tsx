"use client";

import { useState } from "react";

const W = 400, H = 300;
const FX = 500, CX = 200, CY = 150;

/** Applies the real Brown-Conrady radial+tangential model to one normalised point. */
function distort(x: number, y: number, k1: number, k2: number, p1: number, p2: number) {
  const r2 = x * x + y * y;
  const radial = 1 + k1 * r2 + k2 * r2 * r2;
  const xd = x * radial + 2 * p1 * x * y + p2 * (r2 + 2 * x * x);
  const yd = y * radial + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y;
  return [xd, yd];
}

/** DistortionLab (Module 41.3): a real grid of straight lines, bent by the live Brown-Conrady
 *  model (k1, k2, p1, p2) applied in normalised coordinates -- the same model
 *  cv2.undistort/undistortPoints use, computed live here for an interactive bend. */
export function DistortionLab({ caption }: { caption?: string }) {
  const [k1, setK1] = useState(-0.3);
  const [k2, setK2] = useState(0.08);
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);

  const toPx = (x: number, y: number) => [FX * x + CX, FX * y + CY];

  const lines: string[] = [];
  for (let gy = -3; gy <= 3; gy++) {
    const pts: string[] = [];
    for (let gx = -40; gx <= 40; gx++) {
      const nx = gx / 100, ny = gy / 10;
      const [dx, dy] = distort(nx, ny, k1, k2, p1, p2);
      const [px, py] = toPx(dx, dy);
      pts.push(`${px},${py}`);
    }
    lines.push(pts.join(" "));
  }
  const vLines: string[] = [];
  for (let gx = -4; gx <= 4; gx++) {
    const pts: string[] = [];
    for (let gy = -30; gy <= 30; gy++) {
      const nx = gx / 10, ny = gy / 100;
      const [dx, dy] = distort(nx, ny, k1, k2, p1, p2);
      const [px, py] = toPx(dx, dy);
      pts.push(`${px},${py}`);
    }
    vLines.push(pts.join(" "));
  }

  return (
    <figure className="fig distortionlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>k1 (radial) <output>{k1.toFixed(2)}</output></span>
          <input type="range" min={-0.5} max={0.3} step={0.01} value={k1} onChange={(e) => setK1(Number(e.target.value))} aria-label="k1" /></label>
        <label className="ctl ctl-wide"><span>k2 (radial) <output>{k2.toFixed(2)}</output></span>
          <input type="range" min={-0.2} max={0.2} step={0.01} value={k2} onChange={(e) => setK2(Number(e.target.value))} aria-label="k2" /></label>
        <label className="ctl ctl-wide"><span>p1 (tangential) <output>{p1.toFixed(3)}</output></span>
          <input type="range" min={-0.05} max={0.05} step={0.005} value={p1} onChange={(e) => setP1(Number(e.target.value))} aria-label="p1" /></label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="A grid of straight lines, bent by lens distortion">
        {lines.map((pts, i) => <polyline key={`h${i}`} points={pts} fill="none" stroke="#1f6feb" strokeWidth={1.5} />)}
        {vLines.map((pts, i) => <polyline key={`v${i}`} points={pts} fill="none" stroke="#1f6feb" strokeWidth={1.5} opacity={0.6} />)}
      </svg>
      <div className="pg-readout"><span>A real grid of straight lines, bent by the exact Brown-Conrady model cv2.undistort corrects for. Negative k1 bows lines outward (barrel distortion, typical of wide-angle lenses); positive k1 pinches them inward (pincushion).</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
