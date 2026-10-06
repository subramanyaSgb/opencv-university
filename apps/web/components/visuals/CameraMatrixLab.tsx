"use client";

import { useState } from "react";

/** CameraMatrixLab (Module 41.1-41.2): mode "intrinsics" builds K from f/pixel pitch/principal
 *  point and projects one 3D point; mode "extrinsics" adds a rotation (yaw) and translation
 *  before the same intrinsic projection, showing the full P = K[R|t] pipeline live. */
export function CameraMatrixLab({ mode = "intrinsics", caption }: { mode?: "intrinsics" | "extrinsics"; caption?: string }) {
  const [fMm, setFMm] = useState(8.0);
  const [pitch, setPitch] = useState(3.45);
  const [cx, setCx] = useState(640);
  const [cy, setCy] = useState(360);
  const [X, setX] = useState(50);
  const [Y, setY] = useState(20);
  const [Z, setZ] = useState(800);
  const [yawDeg, setYawDeg] = useState(0);
  const [tx, setTx] = useState(0);

  const fx = fMm / (pitch / 1000);
  const fy = fx;

  let Xc = X, Zc = Z;
  if (mode === "extrinsics") {
    const yaw = (yawDeg * Math.PI) / 180;
    Xc = X * Math.cos(yaw) + Z * Math.sin(yaw) + tx;
    Zc = -X * Math.sin(yaw) + Z * Math.cos(yaw);
  }
  const u = fx * (Xc / Zc) + cx;
  const v = fy * (Y / Zc) + cy;

  return (
    <figure className="fig cameramatrixlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Focal length f <output>{fMm.toFixed(1)} mm</output></span>
          <input type="range" min={4} max={16} step={0.5} value={fMm} onChange={(e) => setFMm(Number(e.target.value))} aria-label="Focal length" /></label>
        <label className="ctl ctl-wide"><span>Pixel pitch <output>{pitch.toFixed(2)} um</output></span>
          <input type="range" min={1.5} max={6} step={0.05} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} aria-label="Pixel pitch" /></label>
        <label className="ctl ctl-wide"><span>Object X, Y (mm) <output>{X}, {Y}</output></span>
          <input type="range" min={-100} max={100} value={X} onChange={(e) => setX(Number(e.target.value))} aria-label="Object X" /></label>
        <label className="ctl ctl-wide"><span>Object distance Z <output>{Z} mm</output></span>
          <input type="range" min={300} max={1500} value={Z} onChange={(e) => setZ(Number(e.target.value))} aria-label="Object Z" /></label>
        {mode === "extrinsics" && (
          <>
            <label className="ctl ctl-wide"><span>Camera yaw <output>{yawDeg}&deg;</output></span>
              <input type="range" min={-30} max={30} value={yawDeg} onChange={(e) => setYawDeg(Number(e.target.value))} aria-label="Camera yaw" /></label>
            <label className="ctl ctl-wide"><span>Camera translation tx <output>{tx} mm</output></span>
              <input type="range" min={-100} max={100} value={tx} onChange={(e) => setTx(Number(e.target.value))} aria-label="Camera translation" /></label>
          </>
        )}
      </div>
      <ul className="ap-stats">
        <li><span>fx = fy</span><strong>{fx.toFixed(1)} px</strong><em>f / pixel pitch</em></li>
        {mode === "extrinsics" && <li><span>Point in camera frame</span><strong>({Xc.toFixed(1)}, {Zc.toFixed(1)})</strong><em>after R, t</em></li>}
        <li><span>Pixel coordinate (u, v)</span><strong>({u.toFixed(1)}, {v.toFixed(1)})</strong><em>fx&middot;X/Z + cx, fy&middot;Y/Z + cy</em></li>
      </ul>
      <div className="pg-readout"><span>K = [[fx, 0, cx], [0, fy, cy], [0, 0, 1]], principal point fixed at ({cx}, {cy}) for this figure. {mode === "extrinsics" ? "The camera's own yaw and translation transform the point before the same intrinsic projection -- the full P = K[R|t] pipeline." : "Change f or pixel pitch and watch fx change, then the projected pixel with it."}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
