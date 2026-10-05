"use client";

import { useState } from "react";
import { airyDiameter, defocusOverRange, dofLimits, lightRelative, totalBlur } from "@/lib/aperture-ops";
import { fmt } from "@/lib/scale-ops";

const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const PX = 0.00345; // 3.45 µm pixels
const C = 2 * PX; // accepted blur: 2 pixels

/**
 * ApertureLab: pick an f-number and see light, depth of field and diffraction together.
 * The chart finds the sweet spot for a part that spans focus ± depth.
 */
export function ApertureLab({ caption }: { caption?: string }) {
  const [i, setI] = useState(3); // f/4
  const [f, setF] = useState(25);
  const [sM, setSM] = useState(2);
  const [depth, setDepth] = useState(200);
  const N = STOPS[i];
  const s = sM * 1000;
  const { near, far } = dofLimits(f, N, s, C);
  const s1 = Math.max(s - depth, f * 4), s2 = s + depth;

  const rows = STOPS.map((n) => {
    const d = defocusOverRange(f, n, s, s1, s2) / PX;
    const a = airyDiameter(n) / PX;
    return { n, d, a, t: totalBlur(d, a) };
  });
  const best = rows.reduce((b, r) => (r.t < b.t ? r : b));
  const cur = rows[i];
  const partInside = near <= s1 && far >= s2;

  // DOF bar: 0 .. 2s
  const W = 600, x0 = 20, span = 2 * s;
  const X = (v: number) => x0 + (Math.min(v, span) / span) * W;
  // chart
  const CW = 560, CH = 150, cx0 = 50, cy0 = 20;
  const ymax = Math.max(8, Math.min(30, Math.max(...rows.map((r) => Math.max(r.d, r.a))) * 1.05));
  const px = (k: number) => cx0 + (k / (STOPS.length - 1)) * CW;
  const py = (v: number) => cy0 + CH - (Math.min(v, ymax) / ymax) * CH;
  const path = (key: "d" | "a" | "t") => rows.map((r, k) => `${k ? "L" : "M"}${px(k)} ${py(r[key])}`).join(" ");
  const D = f / N;

  return (
    <figure className="fig aplab op">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Aperture</span>
          <div className="seg seg-small" role="radiogroup" aria-label="f-number">
            {STOPS.map((n, k) => (
              <button key={n} type="button" role="radio" aria-checked={i === k} className={i === k ? "is-on" : ""} onClick={() => setI(k)}>f/{n}</button>
            ))}
          </div>
        </div>
        <div className="ctl">
          <span>Lens</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Focal length">
            {[12, 25, 50].map((v) => (
              <button key={v} type="button" role="radio" aria-checked={f === v} className={f === v ? "is-on" : ""} onClick={() => setF(v)}>{v} mm</button>
            ))}
          </div>
        </div>
        <label className="ctl ctl-wide">
          <span>Focus at <output>{fmt(sM, 1)} m</output></span>
          <input type="range" min={0.5} max={5} step={0.1} value={sM} onChange={(e) => setSM(Number(e.target.value))} aria-label="Focus distance in metres" />
        </label>
        <label className="ctl ctl-wide">
          <span>Part depth ± <output>{depth} mm</output></span>
          <input type="range" min={10} max={500} step={10} value={depth} onChange={(e) => setDepth(Number(e.target.value))} aria-label="Part depth in millimetres either side of focus" />
        </label>
      </div>

      <div className="ap-top">
        <div className="ap-iris" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="56" className="ap-ring" />
            <circle cx="60" cy="60" r={Math.max(2, (D / (f / 1.4)) * 52)} className="ap-open" />
          </svg>
          <span className="fl-cap">opening {fmt(D, 1)} mm</span>
        </div>
        <ul className="ap-stats">
          <li><span>Light</span><strong>×{fmt(lightRelative(N, 1.4), 3)}</strong><em>of f/1.4</em></li>
          <li><span>Sharp from</span><strong>{fmt(near / 1000, 2)} – {Number.isFinite(far) ? fmt(far / 1000, 2) : "∞"} m</strong><em>DOF {Number.isFinite(far) ? `${fmt(far - near, 0)} mm` : "to infinity"}</em></li>
          <li><span>Diffraction spot</span><strong>{fmt(cur.a, 1)} px</strong><em>{fmt(airyDiameter(N) * 1000, 1)} µm</em></li>
        </ul>
      </div>

      <div className="sk">
        <svg viewBox="0 0 640 70" role="img" aria-label={`Depth of field from ${fmt(near, 0)} to ${Number.isFinite(far) ? fmt(far, 0) : "infinity"} millimetres; part from ${fmt(s1, 0)} to ${fmt(s2, 0)} millimetres`}>
          <line x1={x0} y1="36" x2={x0 + W} y2="36" className="ax-line" />
          <rect x={X(near)} y="22" width={Math.max(2, X(far) - X(near))} height="28" rx="4" className="ap-dof" />
          <rect x={X(s1)} y="30" width={Math.max(2, X(s2) - X(s1))} height="12" rx="3" className={partInside ? "ap-part ok" : "ap-part bad"} />
          <line x1={X(s)} y1="14" x2={X(s)} y2="58" className="ax-guide" />
          <text x={X(s)} y="10" textAnchor="middle" className="ax-label">focus</text>
          <text x={x0} y="66" className="ax-origin">camera</text>
          <text x={x0 + W} y="66" textAnchor="end" className="ax-origin">{fmt((2 * s) / 1000, 1)} m</text>
        </svg>
        <div className="ap-legend"><span className="lg lg-dof" /> sharp zone (blur ≤ 2 px) <span className="lg lg-part" /> the part</div>
      </div>

      <div className="sk">
        <svg viewBox="0 0 640 200" role="img" aria-label={`Blur in pixels at each f-number; the lowest total blur is at f/${best.n}`}>
          <line x1={cx0} y1={cy0 + CH} x2={cx0 + CW} y2={cy0 + CH} className="ax-line" />
          <line x1={cx0} y1={cy0} x2={cx0} y2={cy0 + CH} className="ax-line" />
          {[0, ymax / 2, ymax].map((v) => <text key={v} x={cx0 - 6} y={py(v) + 4} textAnchor="end" className="ax-origin">{fmt(v, 0)}</text>)}
          <text x={cx0 - 40} y={cy0 - 6} className="ax-origin">blur px</text>
          <path d={path("d")} className="ap-l-def" />
          <path d={path("a")} className="ap-l-dif" />
          <path d={path("t")} className="ap-l-tot" />
          <circle cx={px(STOPS.indexOf(best.n))} cy={py(best.t)} r="7" className="ap-best" />
          <circle cx={px(i)} cy={py(cur.t)} r="4.5" className="ax-dot" />
          {STOPS.map((n, k) => <text key={n} x={px(k)} y={cy0 + CH + 18} textAnchor="middle" className={k === i ? "ax-label sz-strong" : "ax-origin"}>f/{n}</text>)}
        </svg>
        <div className="ap-legend"><span className="lg lg-def" /> defocus at the part edges <span className="lg lg-dif" /> diffraction <span className="lg lg-tot" /> total <span className="lg lg-best" /> sweet spot</div>
      </div>

      <div className="pg-readout" aria-live="polite">
        <span>
          At <strong>f/{N}</strong> the part edges get <strong>{fmt(cur.d, 1)} px</strong> of defocus and <strong>{fmt(cur.a, 1)} px</strong> of diffraction: about{" "}
          <strong>{fmt(cur.t, 1)} px</strong> in total. {partInside ? "The whole part is inside the sharp zone." : "Part of the object is outside the sharp zone."}{" "}
          Sweet spot for this setup: <strong>f/{best.n}</strong>.
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
