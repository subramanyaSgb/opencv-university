"use client";

import { useState } from "react";
import { pitchMM, arcmin, visibility, zoomNeeded } from "@/lib/acuity-ops";

const SCREENS = [
  { l: '15.6" laptop, 1920 × 1080', d: 15.6, w: 1920, h: 1080 },
  { l: '24" monitor, 1920 × 1080', d: 24, w: 1920, h: 1080 },
  { l: '27" monitor, 3840 × 2160', d: 27, w: 3840, h: 2160 },
  { l: '12" HMI panel, 1280 × 800', d: 12, w: 1280, h: 800 },
];
const VIS = { invisible: "cannot be resolved", limit: "at the limit: only with full attention", visible: "easily seen" };

/** AcuityLab: will the operator see a defect of n image pixels on this screen, at this distance and zoom? */
export function AcuityLab({ caption }: { caption?: string }) {
  const [si, setSi] = useState(1);
  const [dist, setDist] = useState(600);
  const [px, setPx] = useState(2);
  const [zoom, setZoom] = useState(1);
  const s = SCREENS[si];
  const p = pitchMM(s.d, s.w, s.h);
  const size = px * zoom * p;
  const a = arcmin(size, dist);
  const v = visibility(a);
  const need = zoomNeeded(px, p, dist, 4);
  const barMax = 8;
  return (
    <figure className="fig acuitylab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Screen</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Screen">
            {SCREENS.map((x, i) => <button key={x.l} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{x.l}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Viewing distance <output>{dist} mm</output></span><input type="range" min={300} max={2000} step={50} value={dist} onChange={(e) => setDist(Number(e.target.value))} aria-label="Viewing distance" /></label>
        <label className="ctl ctl-wide"><span>Defect size in the image <output>{px} px</output></span><input type="range" min={1} max={20} value={px} onChange={(e) => setPx(Number(e.target.value))} aria-label="Defect size" /></label>
        <label className="ctl ctl-wide"><span>Display zoom <output>{zoom}×</output></span><input type="range" min={0.25} max={8} step={0.25} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" /></label>
      </div>
      <div className="ac-scale" aria-hidden="true">
        <div className="ac-zones"><i className="z0" style={{ width: `${100 / barMax}%` }} /><i className="z1" style={{ width: `${300 / barMax}%` }} /><i className="z2" /></div>
        <b style={{ left: `${Math.min(100, (a / barMax) * 100)}%` }} />
        <div className="ac-ticks"><span>0′</span><span style={{ left: `${100 / barMax}%` }}>1′</span><span style={{ left: `${400 / barMax}%` }}>4′</span><span style={{ left: "100%" }}>8′</span></div>
      </div>
      <ul className="ap-stats">
        <li><span>Screen pixel</span><strong>{p.toFixed(3)} mm</strong><em>{arcmin(p, dist).toFixed(2)}′ at {dist} mm</em></li>
        <li><span>Defect on screen</span><strong>{size.toFixed(2)} mm → {a.toFixed(1)}′</strong><em className={`ac-${v}`}>{VIS[v]}</em></li>
        <li><span>Zoom for 4′</span><strong>{need.toFixed(1)}×</strong><em>{need <= 1 ? "no zoom needed" : "show a zoomed ROI next to the overview"}</em></li>
      </ul>
      <div className="pg-readout"><span>′ = arcminute = 1/60 degree. Normal (20/20) vision resolves about 1′ for high-contrast detail in the centre of gaze; the 1′ and 4′ limits here are a rule of thumb.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
