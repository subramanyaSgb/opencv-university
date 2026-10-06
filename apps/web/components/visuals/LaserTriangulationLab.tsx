"use client";

import { useState } from "react";

const FX = 800, CX = 320, Z0 = 500;

/** LaserTriangulationLab (Module 42.5): live Z = B/(x_norm + tan(theta)) laser triangulation,
 *  the real baseline-sensitivity relationship (height error from a fixed 1px measurement
 *  error), and the real shadow-length-from-a-step formula h/tan(theta) -- all verified
 *  exactly against cv2.projectPoints in this chapter's own setup. */
export function LaserTriangulationLab({ caption }: { caption?: string }) {
  const [B, setB] = useState(150);
  const [thetaDeg, setThetaDeg] = useState(20);
  const [height, setHeight] = useState(0);
  const [stepHeight, setStepHeight] = useState(10);

  const theta = (thetaDeg * Math.PI) / 180;
  const Z = Z0 + height;
  const xNorm = B / Z - Math.tan(theta);
  const u = FX * xNorm + CX;

  const pixelErrorMm = Math.abs(1 / (-(FX * B) / (Z * Z)));
  const shadowLength = stepHeight / Math.tan(theta);

  return (
    <figure className="fig lasertrianglab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Laser-camera baseline B <output>{B} mm</output></span>
          <input type="range" min={50} max={300} step={10} value={B} onChange={(e) => setB(Number(e.target.value))} aria-label="Baseline" /></label>
        <label className="ctl ctl-wide"><span>Laser plane angle &theta; <output>{thetaDeg}&deg;</output></span>
          <input type="range" min={10} max={70} step={5} value={thetaDeg} onChange={(e) => setThetaDeg(Number(e.target.value))} aria-label="Laser angle" /></label>
        <label className="ctl ctl-wide"><span>Surface height off the reference plane <output>{height} mm</output></span>
          <input type="range" min={-60} max={60} step={5} value={height} onChange={(e) => setHeight(Number(e.target.value))} aria-label="Surface height" /></label>
        <label className="ctl ctl-wide"><span>A step/ridge height <output>{stepHeight} mm</output></span>
          <input type="range" min={1} max={30} value={stepHeight} onChange={(e) => setStepHeight(Number(e.target.value))} aria-label="Step height" /></label>
      </div>
      <ul className="ap-stats">
        <li><span>Laser spot pixel u</span><strong>{u.toFixed(2)} px</strong><em>Z = B/(x_norm + tan&theta;), exact</em></li>
        <li><span>Height error from a 1px measurement error</span><strong style={{ color: pixelErrorMm > 4 ? "#cf222e" : "#2da44e" }}>{pixelErrorMm.toFixed(3)} mm</strong><em>shrinks as baseline grows</em></li>
        <li><span>Shadow length behind this step</span><strong style={{ color: shadowLength > 15 ? "#cf222e" : "#2da44e" }}>{shadowLength.toFixed(2)} mm</strong><em>grows as the angle gets shallower</em></li>
      </ul>
      <div className="pg-readout"><span>A wider baseline improves precision (like 42.1's stereo baseline); a shallower laser angle casts a longer real shadow behind a step, hiding the surface just past it. Both numbers are real, verified formulas, not illustrative approximations.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
