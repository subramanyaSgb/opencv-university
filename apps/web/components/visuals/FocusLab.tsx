"use client";

import { useState } from "react";
import { blurCircle, fovWidth, imageDistance } from "@/lib/lens-ops";
import { fmt } from "@/lib/scale-ops";

const N = 2.8; // f-number, fixed here (Chapter 2.3 varies it)
const PIXEL_MM = 0.00345; // 3.45 µm pixels, a common industrial pixel size
const AY = 130, LX = 260, H = 70; // axis y, lens x, half aperture in the drawing

/* Side view of a thin lens: an on-axis object point, the cone of light through the lens, the point
   where it converges, and where the sensor actually is. The image side is stretched so that tiny
   millimetre differences are visible: not to scale. */
function FocusSvg({ f, objectMm, focusMm }: { f: number; objectMm: number; focusMm: number }) {
  const sOut = imageDistance(f, focusMm); // where the sensor is
  const sObj = imageDistance(f, objectMm); // where this object's sharp image forms
  const uS = sOut - f, uO = sObj - f;
  const umax = Math.max(uS, uO) * 1.08 || 1;
  const xs = 330 + (250 * uS) / umax;
  const xo = 330 + (250 * uO) / umax;
  const yAt = (x: number, sign: number) => AY + sign * H * (1 - (x - LX) / (xo - LX));
  const half = Math.abs(H * (1 - (xs - LX) / (xo - LX)));
  const sharp = half < 1.5;
  const end = Math.max(xs, xo);

  return (
    <svg viewBox="0 0 640 270" role="img"
      aria-label={`Lens side view: object at ${fmt(objectMm / 1000, 1)} m, focus set for ${fmt(focusMm / 1000, 1)} m. ${sharp ? "The light converges on the sensor: sharp." : "The light converges off the sensor and spreads into a blur circle."}`}>
      <line x1="20" y1={AY} x2="630" y2={AY} className="op-axis" />
      {[-1, 1].map((sg) => (
        <g key={sg}>
          <line x1="40" y1={AY} x2={LX} y2={AY + sg * H} className="op-ray-a" />
          <line x1={LX} y1={AY + sg * H} x2={xs < xo ? xs : end} y2={yAt(xs < xo ? xs : end, sg)} className="op-ray-a" />
          {xs < xo && <line x1={xs} y1={yAt(xs, sg)} x2={xo} y2={AY} className="op-ray-a op-dash" />}
        </g>
      ))}
      <ellipse cx={LX} cy={AY} rx="11" ry={H + 6} className="op-lens" />
      <circle cx="40" cy={AY} r="5" fill="#e0473b" />
      <circle cx={xo} cy={AY} r="3.5" className="ax-dot" />
      <line x1={xs} y1={AY - 100} x2={xs} y2={AY + 100} className="op-sensor" />
      {!sharp && <line x1={xs} y1={AY - half} x2={xs} y2={AY + half} className="op-blur" />}
      <text x="10" y={AY + 26} className="ax-label sz-strong">object point</text>
      <text x={LX} y="24" textAnchor="middle" className="ax-label sz-strong">lens</text>
      <text x={Math.min(xs, 600)} y="20" textAnchor="middle" className="ax-label sz-strong">sensor</text>
      <text x={xo} y={AY + 40} textAnchor="middle" className="ax-label">{sharp ? "" : "rays meet here"}</text>
      <text x="630" y="262" textAnchor="end" className="ax-origin">image side stretched: not to scale</text>
    </svg>
  );
}

/** Static focus diagram. */
export function FocusDiagram({ f = 25, objectM = 2, focusM = 2, caption }: { f?: number; objectM?: number; focusM?: number; caption?: string }) {
  return (
    <figure className="vis sk op">
      <FocusSvg f={f} objectMm={objectM * 1000} focusMm={focusM * 1000} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** FocusLab: set the focus distance, move the object, and see the blur circle in µm and pixels. */
export function FocusLab({ caption }: { caption?: string }) {
  const [f, setF] = useState(25);
  const [focusM, setFocusM] = useState(2);
  const [objM, setObjM] = useState(5);
  const D = f / N;
  const sensor = imageDistance(f, focusM * 1000);
  const sharpAt = imageDistance(f, objM * 1000);
  const c = blurCircle(D, sensor, sharpAt);
  const px = c / PIXEL_MM;
  const sigma = Math.min(px / 4, 14);

  return (
    <figure className="fig focuslab op">
      <div className="sc-ctl">
        <div className="ctl">
          <span>Lens</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Focal length">
            {[12, 25, 50].map((v) => (
              <button key={v} type="button" role="radio" aria-checked={f === v} className={f === v ? "is-on" : ""} onClick={() => setF(v)}>{v} mm</button>
            ))}
          </div>
        </div>
        <Slider label="Focus set for" unit="m" value={focusM} onChange={setFocusM} />
        <Slider label="Object at" unit="m" value={objM} onChange={setObjM} />
      </div>
      <div className="sk"><FocusSvg f={f} objectMm={objM * 1000} focusMm={focusM * 1000} /></div>
      <div className="fl-row">
        <div className="fl-spot" aria-hidden="true">
          <span className="fl-dot" style={{ width: `${Math.max(4, Math.min(px, 90))}px`, height: `${Math.max(4, Math.min(px, 90))}px` }} />
          <span className="fl-cap">the point on the sensor</span>
        </div>
        <div className="fl-prev">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/sample-pinhole-scene.png" width={320} height={200} alt="Test chart with the current amount of defocus blur (approximate preview)" style={{ filter: `blur(${fmt(sigma, 2)}px)` }} />
          <span className="fl-cap">approximate preview</span>
        </div>
      </div>
      <div className="pg-readout" aria-live="polite">
        <span>
          Sharp image forms <strong>{fmt(sharpAt, 3)} mm</strong> behind the lens; the sensor is at <strong>{fmt(sensor, 3)} mm</strong>.
          Blur circle <strong>{fmt(c * 1000, 1)} µm</strong> ≈ <strong>{fmt(px, 1)} pixels</strong>
          {px < 1 ? " — sharp." : px < 2 ? " — about one pixel: still looks sharp." : " — visible blur."}
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * LensFov: choose a lens, sensor and working distance, and see whether the object fits and how
 * many millimetres each pixel covers.
 */
export function LensFov({ objectMm = 2000, objectName = "slab", imagePx = 2448, caption }:
  { objectMm?: number; objectName?: string; imagePx?: number; caption?: string }) {
  const SENSORS = [{ w: 6.4, name: '1/2"' }, { w: 8.8, name: '2/3"' }, { w: 14.1, name: '1.1"' }];
  const [f, setF] = useState(25);
  const [sw, setSw] = useState(8.8);
  const [wdM, setWdM] = useState(4.5);
  const fov = fovWidth(wdM * 1000, sw, f);
  const fits = fov >= objectMm;
  const scale = 540 / Math.max(fov, objectMm);
  const fovPx = fov * scale, objPx = objectMm * scale;
  const cx = 320;

  return (
    <figure className="fig lensfov op">
      <div className="sc-ctl">
        <div className="ctl">
          <span>Lens</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Focal length">
            {[8, 12, 16, 25, 35, 50].map((v) => (
              <button key={v} type="button" role="radio" aria-checked={f === v} className={f === v ? "is-on" : ""} onClick={() => setF(v)}>{v}</button>
            ))}
          </div>
        </div>
        <div className="ctl">
          <span>Sensor</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Sensor width">
            {SENSORS.map((s) => (
              <button key={s.w} type="button" role="radio" aria-checked={sw === s.w} className={sw === s.w ? "is-on" : ""} onClick={() => setSw(s.w)}>{s.name} · {s.w} mm</button>
            ))}
          </div>
        </div>
        <Slider label="Working distance" unit="m" value={wdM} onChange={setWdM} />
      </div>
      <div className="sk">
        <svg viewBox="0 0 640 230" role="img" aria-label={`Field of view ${fmt(fov, 0)} mm wide versus a ${objectMm} mm ${objectName}`}>
          <rect x={cx - 26} y="8" width="52" height="30" rx="5" className="sk-cam" />
          <path d={`M${cx} 38 L${cx - fovPx / 2} 170 L${cx + fovPx / 2} 170 Z`} className="sk-fov" />
          <line x1={cx} y1="38" x2={cx - fovPx / 2} y2="170" className="ax-guide" />
          <line x1={cx} y1="38" x2={cx + fovPx / 2} y2="170" className="ax-guide" />
          <rect x={cx - objPx / 2} y="172" width={objPx} height="22" rx="3" fill="url(#lf-steel)" />
          <defs><linearGradient id="lf-steel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b8c0c8" /><stop offset="1" stopColor="#7d8791" /></linearGradient></defs>
          <text x={cx} y="188" textAnchor="middle" className="sk-name" style={{ fontSize: 12 }}>{objectName.toUpperCase()} {objectMm} mm</text>
          <line x1={cx - fovPx / 2} y1="212" x2={cx + fovPx / 2} y2="212" className={fits ? "lf-ok" : "lf-bad"} />
          <text x={cx} y="228" textAnchor="middle" className="ax-label sz-strong">field of view {fmt(fov, 0)} mm</text>
          <text x={cx + 34} y="28" className="ax-label">WD {fmt(wdM, 1)} m · {f} mm lens</text>
        </svg>
      </div>
      <div className="pg-readout" aria-live="polite">
        <span>
          {fits ? <><strong>Whole {objectName} visible.</strong> </> : <><strong>Only {fmt((fov / objectMm) * 100, 0)}% of the {objectName} visible.</strong> </>}
          With {imagePx} pixels across, one pixel covers <strong>{fmt(fov / imagePx, 2)} mm</strong>. Shorter lens → wider view, but fewer pixels on the object.
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Slider({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="ctl ctl-wide">
      <span>{label} <output>{fmt(value, 1)} {unit}</output></span>
      <input type="range" min={0.5} max={10} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={`${label} in ${unit}`} />
    </label>
  );
}
