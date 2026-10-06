"use client";

import { useState } from "react";

const F = 800, B = 120, CX = 320;

/** StereoLab (Module 42.1): live Z = f.B/disparity, and the real depth-error-vs-distance
 *  sensitivity -- a fixed 1px disparity error produces a real depth error that grows with
 *  the square of distance, verified: 2.6mm at 500mm up to 274.7mm at 5000mm. */
export function StereoLab({ caption }: { caption?: string }) {
  const [Z, setZ] = useState(1000);
  const [X] = useState(30);

  const disparity = (F * B) / Z;
  const leftX = CX + (F * X) / Z;
  const rightX = CX + (F * (X - B)) / Z;

  const disparityWithError = disparity - 1;
  const zWithError = (F * B) / disparityWithError;
  const zError = zWithError - Z;

  return (
    <figure className="fig stereolab">
      <label className="ctl ctl-wide"><span>Point distance Z <output>{Z} mm</output></span>
        <input type="range" min={300} max={5000} step={50} value={Z} onChange={(e) => setZ(Number(e.target.value))} aria-label="Distance" /></label>
      <ul className="ap-stats">
        <li><span>Left pixel x</span><strong>{leftX.toFixed(1)} px</strong></li>
        <li><span>Right pixel x</span><strong>{rightX.toFixed(1)} px</strong></li>
        <li><span>Disparity</span><strong>{disparity.toFixed(2)} px</strong><em>Z = f&middot;B / disparity</em></li>
        <li><span>Depth error from a 1 px disparity error</span><strong style={{ color: Math.abs(zError) > 50 ? "#cf222e" : "#2da44e" }}>{zError.toFixed(1)} mm</strong><em>grows with Z^2</em></li>
      </ul>
      <div className="pg-readout"><span>f=800px, baseline=120mm. A single pixel of disparity error costs only a few mm of depth error up close, but hundreds of mm far away -- the real, structural reason stereo depth gets less precise with distance.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
