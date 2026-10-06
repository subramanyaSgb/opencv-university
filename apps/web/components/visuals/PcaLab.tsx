"use client";

import { useMemo, useState } from "react";
import { covariance, eigSym2, type Pt } from "@/lib/pca-ops";
import { normals } from "@/lib/stats-ops";

const W = 400, H = 260, N = 300;

/** PcaLab: a cloud of pixel positions, its covariance matrix, and the eigenvectors that give orientation and elongation. */
export function PcaLab({ caption }: { caption?: string }) {
  const [deg, setDeg] = useState(30);
  const [ratio, setRatio] = useState(3);
  const [stray, setStray] = useState(0);
  const pts = useMemo<Pt[]>(() => {
    const a = normals(N, 0, 1, 31), b = normals(N, 0, 1, 32);
    const t = (deg * Math.PI) / 180, major = 45, minor = 45 / ratio;
    const p = a.map((u, i) => {
      const x = u * major, y = b[i] * minor;
      return [W / 2 + x * Math.cos(t) - y * Math.sin(t), H / 2 + x * Math.sin(t) + y * Math.cos(t)] as Pt;
    });
    for (let k = 0; k < stray; k++) p[k] = [W / 2 + 120 + (k % 5) * 3, H / 2 - 90 + Math.floor(k / 5) * 3];
    return p;
  }, [deg, ratio, stray]);
  const { cx, cy, C } = covariance(pts);
  const e = eigSym2(C[0][0], C[0][1], C[1][1]);
  const s1 = 2 * Math.sqrt(e.l1), s2 = 2 * Math.sqrt(Math.max(e.l2, 0));
  const ang = (Math.atan2(e.v1[1], e.v1[0]) * 180) / Math.PI;
  const orient = ((ang % 180) + 180) % 180;
  return (
    <figure className="fig pcalab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Part angle <output>{deg}°</output></span><input type="range" min={0} max={180} value={deg} onChange={(e2) => setDeg(Number(e2.target.value))} aria-label="Angle" /></label>
        <label className="ctl ctl-wide"><span>Length / width <output>{ratio}</output></span><input type="range" min={1} max={6} step={0.5} value={ratio} onChange={(e2) => setRatio(Number(e2.target.value))} aria-label="Elongation" /></label>
        <label className="ctl ctl-wide"><span>Stray pixels (dirt) <output>{stray}</output></span><input type="range" min={0} max={25} value={stray} onChange={(e2) => setStray(Number(e2.target.value))} aria-label="Stray pixels" /></label>
      </div>
      <div className="pc-row">
        <svg viewBox={`0 0 ${W} ${H}`} className="pc-svg" role="img" aria-label={`Point cloud with principal axes; orientation ${orient.toFixed(1)} degrees`}>
          {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={1.8} className={i < stray ? "pc-pt pc-stray" : "pc-pt"} />)}
          <ellipse cx={cx} cy={cy} rx={s1} ry={s2} transform={`rotate(${ang} ${cx} ${cy})`} className="pc-ell" />
          <line x1={cx} y1={cy} x2={cx + s1 * e.v1[0]} y2={cy + s1 * e.v1[1]} className="pc-v1" />
          <line x1={cx} y1={cy} x2={cx + s2 * e.v2[0]} y2={cy + s2 * e.v2[1]} className="pc-v2" />
          <circle cx={cx} cy={cy} r={3.5} className="pc-c" />
        </svg>
        <div className="pc-info">
          <div className="vis-title">Covariance matrix C</div>
          <div className="tl-mat"><span>{C[0][0].toFixed(0)}</span><span>{C[0][1].toFixed(0)}</span><span>{C[1][0].toFixed(0)}</span><span>{C[1][1].toFixed(0)}</span></div>
          <ul className="ap-stats">
            <li><span>Eigenvalues λ1, λ2</span><strong>{e.l1.toFixed(0)}, {Math.max(e.l2, 0).toFixed(0)}</strong><em>variance along each axis</em></li>
            <li><span>Orientation</span><strong>{orient.toFixed(1)}°</strong><em>of the major eigenvector</em></li>
            <li><span>Elongation √(λ1/λ2)</span><strong>{Math.sqrt(e.l1 / Math.max(e.l2, 1e-9)).toFixed(2)}</strong><em>1 = round</em></li>
          </ul>
        </div>
      </div>
      <div className="pg-readout"><span>Red: major eigenvector (largest spread); green: minor. Ellipse: 2 standard deviations along each axis. Make the part round (ratio 1) and the orientation becomes meaningless; add dirt and watch the axes swing.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
