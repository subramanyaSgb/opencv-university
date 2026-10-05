"use client";

import { useState } from "react";
import { blurSpot, project, relativeLight } from "@/lib/pinhole-ops";
import { fmt } from "@/lib/scale-ops";

/*
 * Side view of an ideal pinhole camera, drawn to scale (S px per unit, same scale on both axes,
 * so every ray is a true straight line). The object is centred on the optical axis:
 * its top (red) and bottom (blue) send rays through the pinhole and land swapped on the sensor.
 */
const S = 18;
const P = 400; // pinhole x in the drawing
const AY = 150; // optical axis y

type SvgProps = { f: number; X: number; Z: number; d?: number; labels?: boolean; object?: boolean; rays?: boolean };

function PinholeSvg({ f, X, Z, d, labels = true, object = true, rays = true }: SvgProps) {
  const ox = P - Z * S;
  const sx = P + f * S;
  const h = (X / 2) * S; // half object height
  const x = project(f, X, Z);
  const ih = (x / 2) * S; // half image height
  const hole = d !== undefined ? Math.max(2, d * S) : 3;
  const boxTop = 40, boxBot = 260;

  // Rays from a point (px, py) through both hole edges, extended to the sensor plane.
  const cone = (py: number) => {
    const at = (hy: number) => py + ((hy - py) * (sx - ox)) / (P - ox);
    const a = at(AY - hole / 2), b = at(AY + hole / 2);
    return `${ox},${py} ${P},${AY - hole / 2} ${sx},${a} ${sx},${b} ${P},${AY + hole / 2}`;
  };

  return (
    <svg viewBox="0 0 640 300" role="img"
      aria-label={`Pinhole camera side view: object of height ${X} at distance ${Z}, sensor ${f} behind the pinhole, inverted image of height ${fmt(x, 2)}`}>
      <defs>
        <marker id="ph-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker>
        <marker id="ph-tip-a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#e0473b" /></marker>
      </defs>
      <line x1="20" y1={AY} x2="630" y2={AY} className="op-axis" />
      {/* camera box with the pinhole in its front wall */}
      <rect x={P} y={boxTop} width={sx - P + 14} height={boxBot - boxTop} className="op-box" />
      <line x1={P} y1={boxTop} x2={P} y2={AY - hole / 2} className="op-wall" />
      <line x1={P} y1={AY + hole / 2} x2={P} y2={boxBot} className="op-wall" />
      <line x1={sx} y1={boxTop + 8} x2={sx} y2={boxBot - 8} className="op-sensor" />

      {object && rays && d !== undefined && (
        <>
          <polygon points={cone(AY - h)} className="op-cone-a" />
          <polygon points={cone(AY + h)} className="op-cone-b" />
        </>
      )}
      {object && rays && (
        <>
          <line x1={ox} y1={AY - h} x2={sx} y2={AY + ih} className="op-ray-a" />
          <line x1={ox} y1={AY + h} x2={sx} y2={AY - ih} className="op-ray-b" />
        </>
      )}
      {object && (
        <>
          {/* object: an upright arrow, red top, blue bottom */}
          <line x1={ox} y1={AY + h} x2={ox} y2={AY - h + 6} className="op-obj" />
          <path d={`M${ox - 8} ${AY - h + 10} L${ox} ${AY - h - 2} L${ox + 8} ${AY - h + 10} Z`} fill="#e0473b" />
          <circle cx={ox} cy={AY + h} r="5" fill="#2f63d6" />
          {/* image on the sensor: inverted */}
          <line x1={sx - 6} y1={AY - ih} x2={sx - 6} y2={AY + ih - 4} className="op-img" />
          <path d={`M${sx - 11} ${AY + ih - 6} L${sx - 6} ${AY + ih + 2} L${sx - 1} ${AY + ih - 6} Z`} fill="#e0473b" />
          <circle cx={sx - 6} cy={AY - ih} r="3.5" fill="#2f63d6" />
        </>
      )}

      {labels && (
        <>
          {object && <text x={ox} y={AY - h - 12} textAnchor="middle" className="ax-label sz-strong">object</text>}
          <text x={P - 6} y={boxTop - 8} textAnchor="end" className="ax-label sz-strong">pinhole</text>
          <text x={Math.min(sx + 60, 636)} y={boxTop - 8} textAnchor="end" className="ax-label sz-strong">sensor (image plane)</text>
          {object && (
            <>
              <line x1={ox} y1="282" x2={P} y2="282" className="ax-line" markerStart="url(#ph-a)" markerEnd="url(#ph-a)" />
              <text x={(ox + P) / 2} y="276" textAnchor="middle" className="ax-label">Z = {fmt(Z, 1)}</text>
            </>
          )}
          <line x1={P} y1="282" x2={sx} y2="282" className="ax-line" markerStart="url(#ph-a)" markerEnd="url(#ph-a)" />
          <text x={(P + sx) / 2} y="276" textAnchor="middle" className="ax-label">f = {fmt(f, 1)}</text>
        </>
      )}
    </svg>
  );
}

/** Static pinhole diagram (no controls). */
export function PinholeDiagram({ f = 8, X = 3, Z = 12, d, labels = true, object = true, caption }:
  { f?: number; X?: number; Z?: number; d?: number; labels?: boolean; object?: boolean; caption?: string }) {
  return (
    <figure className="vis sk op">
      <PinholeSvg f={f} X={X} Z={Z} d={d} labels={labels} object={object} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * PinholeLab: move the object, change its size and the box depth, and see x = f·X/Z.
 * With `hole`, a hole-size slider shows the trade-off: bigger hole = more light (∝ d²) but a bigger blur spot.
 */
export function PinholeLab({ hole = false, caption }: { hole?: boolean; caption?: string }) {
  const [Z, setZ] = useState(5);
  const [X, setX] = useState(2);
  const [f, setF] = useState(10);
  const [d, setD] = useState(0.5);
  const x = project(f, X, Z);
  const b = blurSpot(d, f, Z);

  return (
    <figure className="fig pinlab op">
      <div className="sc-ctl">
        <Slider label="Distance Z" value={Z} min={4} max={20} step={0.5} onChange={setZ} />
        <Slider label="Object height X" value={X} min={1} max={4} step={0.5} onChange={setX} />
        <Slider label="Box depth f" value={f} min={4} max={10} step={0.5} onChange={setF} />
        {hole && <Slider label="Hole diameter d" value={d} min={0.1} max={2} step={0.1} onChange={setD} />}
      </div>
      <div className="sk">
        <PinholeSvg f={f} X={X} Z={Z} d={hole ? d : undefined} />
      </div>
      <div className="eq-row sc-eq">
        <span className="eq-term"><span className="eq-value">x = f × X ÷ Z</span></span>
        <span className="eq-op">=</span>
        <span className="eq-term"><span className="eq-value">{fmt(f, 1)} × {fmt(X, 1)} ÷ {fmt(Z, 1)}</span></span>
        <span className="eq-op">=</span>
        <span className="eq-term is-result"><span className="eq-value">{fmt(x, 2)}</span></span>
      </div>
      <div className="pg-readout" aria-live="polite">
        {hole ? (
          <span>
            Hole <strong>{fmt(d, 1)}</strong>: light collected <strong>×{fmt(relativeLight(d, 1), 2)}</strong> (relative to a hole of 1),
            blur spot on the sensor <strong>{fmt(b, 2)}</strong> wide. The image is {fmt(x, 2)} tall, so the blur is{" "}
            <strong>{fmt((b / x) * 100, 0)}%</strong> of it.
          </span>
        ) : (
          <span>
            The image is <strong>upside down</strong> and <strong>{fmt(x, 2)}</strong> tall. Double Z and it halves; double f and it doubles.
          </span>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Slider({ label, value, min, max, step, onChange }:
  { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="ctl ctl-wide">
      <span>{label} <output>{fmt(value, 1)}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </label>
  );
}
