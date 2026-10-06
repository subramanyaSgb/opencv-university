"use client";

import { useMemo, useState } from "react";
import { huber, ols, perp, tls, type Line, type Pt } from "@/lib/fit-ops";
import { normals } from "@/lib/stats-ops";

const W = 400, H = 260, CX = 200, CY = 130, N = 16;
const OUT_OFFSETS = [60, -55, 70, -65];

/** FitLab: noisy edge points, outliers, and three line fits (y = ax + b, perpendicular, robust). */
export function FitLab({ caption }: { caption?: string }) {
  const [deg, setDeg] = useState(20);
  const [noise, setNoise] = useState(3);
  const [outliers, setOutliers] = useState(0);
  const [show, setShow] = useState<"ols" | "tls" | "huber">("tls");
  const pts = useMemo<Pt[]>(() => {
    const t = (deg * Math.PI) / 180, dx = Math.cos(t), dy = Math.sin(t);
    const n = normals(N, 0, noise, 21);
    const p = Array.from({ length: N }, (_, i) => { const s = (i - (N - 1) / 2) * 20; return [CX + s * dx - n[i] * dy, CY + s * dy + n[i] * dx] as Pt; });
    for (let k = 0; k < outliers; k++) { const i = [3, 11, 7, 14][k]; p[i] = [p[i][0] - OUT_OFFSETS[k] * dy, p[i][1] + OUT_OFFSETS[k] * dx]; }
    return p;
  }, [deg, noise, outliers]);
  const o = ols(pts), l2 = tls(pts), hb = huber(pts);
  const olsAngle = Math.atan(o.a) * 180 / Math.PI;
  const lineAngle = (l: Line) => { let a = Math.atan2(l.dy, l.dx) * 180 / Math.PI; if (a > 90) a -= 180; return a; };
  const seg = (l: Line, cls: string) => <line x1={l.cx - 400 * l.dx} y1={l.cy - 400 * l.dy} x2={l.cx + 400 * l.dx} y2={l.cy + 400 * l.dy} className={cls} />;
  const olsVisible = Number.isFinite(o.a) && Math.abs(o.a) < 1e4;
  const sticks = pts.map((p, i) => {
    if (show === "ols") return olsVisible ? <line key={i} x1={p[0]} y1={p[1]} x2={p[0]} y2={o.a * p[0] + o.b} className="fl-res" /> : null;
    const l = show === "tls" ? l2 : hb, d = perp(l, p);
    return <line key={i} x1={p[0]} y1={p[1]} x2={p[0] - d * l.dy} y2={p[1] + d * l.dx} className="fl-res" />;
  });
  const err = (a: number) => { let e = a - deg; while (e > 90) e -= 180; while (e < -90) e += 180; return e; };
  return (
    <figure className="fig fitlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>True edge angle <output>{deg}°</output></span><input type="range" min={0} max={90} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="True angle" /></label>
        <label className="ctl ctl-wide"><span>Noise σ <output>{noise} px</output></span><input type="range" min={0} max={10} value={noise} onChange={(e) => setNoise(Number(e.target.value))} aria-label="Noise" /></label>
        <label className="ctl ctl-wide"><span>Outliers <output>{outliers}</output></span><input type="range" min={0} max={4} value={outliers} onChange={(e) => setOutliers(Number(e.target.value))} aria-label="Outliers" /></label>
        <div className="ctl ctl-full">
          <span>Show residuals of</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Residuals">
            {([["ols", "y = a x + b (vertical)"], ["tls", "perpendicular (cv2.fitLine L2)"], ["huber", "robust (fitLine Huber)"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={show === k} className={show === k ? "is-on" : ""} onClick={() => setShow(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="fl-svg" role="img" aria-label={`${N} points and three fitted lines`}>
        <defs><clipPath id="fl-clip"><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
        <g clipPath="url(#fl-clip)">
          {sticks}
          {olsVisible && <line x1={0} y1={o.b} x2={W} y2={o.a * W + o.b} className="fl-ols" />}
          {seg(l2, "fl-tls")}
          {seg(hb, "fl-huber")}
          {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3.5} className={outliers > 0 && [3, 11, 7, 14].slice(0, outliers).includes(i) ? "fl-pt fl-bad" : "fl-pt"} />)}
        </g>
      </svg>
      <ul className="ap-stats fl-stats">
        <li><span className="fl-k fl-k-ols">y = a x + b</span><strong>{olsVisible ? `${olsAngle.toFixed(2)}°` : "fails"}</strong><em>error {olsVisible ? `${err(olsAngle).toFixed(2)}°` : "(vertical line)"}</em></li>
        <li><span className="fl-k fl-k-tls">perpendicular</span><strong>{lineAngle(l2).toFixed(2)}°</strong><em>error {err(lineAngle(l2)).toFixed(2)}°</em></li>
        <li><span className="fl-k fl-k-huber">robust (Huber)</span><strong>{lineAngle(hb).toFixed(2)}°</strong><em>error {err(lineAngle(hb)).toFixed(2)}°</em></li>
      </ul>
      <div className="pg-readout"><span>Angles measured from the x axis (y down). Grey sticks: the residuals being squared and summed. Turn the edge towards 90° to see y = a x + b break down; add outliers to see plain least squares tilt while the robust fit stays.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
