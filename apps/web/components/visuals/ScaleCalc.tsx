"use client";

import { useState } from "react";
import { fmt, lengthMm, mmPerPixel } from "@/lib/scale-ops";

const WIDTHS = [640, 1280, 1920, 2448, 4096];

/** ScaleCalc: how many millimetres one pixel covers, and what a pixel count means in mm. */
export function ScaleCalc() {
  const [fov, setFov] = useState(1920);
  const [imgPx, setImgPx] = useState(1920);
  const [objPx, setObjPx] = useState(1200);
  const mpp = mmPerPixel(fov, imgPx);
  const len = lengthMm(Math.min(objPx, imgPx), fov, imgPx);

  return (
    <figure className="fig scalec">
      <div className="sc-ctl">
        <label className="ctl ctl-wide">
          <span>Field of view <output>{fov} mm</output></span>
          <input type="range" min={50} max={4000} step={10} value={fov} onChange={(e) => setFov(Number(e.target.value))} aria-label="Field of view width in millimetres" />
        </label>
        <div className="ctl">
          <span>Image width</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Image width in pixels">
            {WIDTHS.map((w) => (
              <button key={w} type="button" role="radio" aria-checked={imgPx === w} className={imgPx === w ? "is-on" : ""}
                onClick={() => { setImgPx(w); setObjPx((p) => Math.min(p, w)); }}>
                {w}
              </button>
            ))}
          </div>
        </div>
        <label className="ctl ctl-wide">
          <span>Object spans <output>{Math.min(objPx, imgPx)} px</output></span>
          <input type="range" min={1} max={imgPx} value={Math.min(objPx, imgPx)} onChange={(e) => setObjPx(Number(e.target.value))} aria-label="Object length in pixels" />
        </label>
      </div>
      <div className="sc-bar" aria-hidden="true">
        <span className="sc-obj" style={{ width: `${(Math.min(objPx, imgPx) / imgPx) * 100}%` }} />
      </div>
      <Equation3 a={`${fov} mm`} b={`${imgPx} px`} r={`${fmt(mpp, 3)} mm per pixel`} op="÷" />
      <Equation3 a={`${Math.min(objPx, imgPx)} px`} b={`${fmt(mpp, 3)} mm/px`} r={`${fmt(len, 1)} mm`} op="×" />
      <div className="pg-readout" aria-live="polite">
        <span>One pixel of error = <strong>±{fmt(mpp, 2)} mm</strong>. Same pixel count, different field of view → a different length.</span>
      </div>
      <figcaption>A simple model: flat object, camera looking straight at it, no lens distortion. Calibration (Module 41) handles the real case.</figcaption>
    </figure>
  );
}

function Equation3({ a, b, r, op }: { a: string; b: string; r: string; op: string }) {
  return (
    <div className="eq-row sc-eq">
      <span className="eq-term"><span className="eq-value">{a}</span></span>
      <span className="eq-op">{op}</span>
      <span className="eq-term"><span className="eq-value">{b}</span></span>
      <span className="eq-op">=</span>
      <span className="eq-term is-result"><span className="eq-value">{r}</span></span>
    </div>
  );
}
