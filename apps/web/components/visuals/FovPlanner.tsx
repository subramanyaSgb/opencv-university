"use client";

import { useState } from "react";
import { planLenses, sensorWidth } from "@/lib/fov-ops";
import { fmt } from "@/lib/scale-ops";

const CAMERAS = [
  { px: 1920, pitch: 0.00586, name: "1920 px · 5.86 µm" },
  { px: 2448, pitch: 0.00345, name: "2448 px · 3.45 µm" },
  { px: 4096, pitch: 0.00345, name: "4096 px · 3.45 µm" },
];

/** FovPlanner: from a requirement (FOV, smallest feature, working distance) to a camera and lens choice. */
export function FovPlanner({ caption }: { caption?: string }) {
  const [needFov, setNeedFov] = useState(550);
  const [feature, setFeature] = useState(1);
  const [ppf, setPpf] = useState(3);
  const [wd, setWd] = useState(1500);
  const [cam, setCam] = useState(1);
  const c = CAMERAS[cam];
  const needMmpp = feature / ppf;
  const needPx = needFov / needMmpp;
  const opts = planLenses(c.px, c.pitch, wd, needFov, feature, ppf);
  const best = opts.filter((o) => o.ok).sort((a, b) => b.featurePx - a.featurePx)[0];

  return (
    <figure className="fig fovplan op">
      <div className="sc-ctl">
        <Num label="Area to cover (width)" unit="mm" value={needFov} min={50} max={3000} step={10} onChange={setNeedFov} />
        <Num label="Smallest feature" unit="mm" value={feature} min={0.1} max={20} step={0.1} onChange={setFeature} />
        <div className="ctl">
          <span>Pixels on the feature</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Pixels across the smallest feature">
            {[2, 3, 5].map((v) => <button key={v} type="button" role="radio" aria-checked={ppf === v} className={ppf === v ? "is-on" : ""} onClick={() => setPpf(v)}>{v}</button>)}
          </div>
        </div>
        <Num label="Working distance" unit="mm" value={wd} min={200} max={6000} step={50} onChange={setWd} />
        <div className="ctl ctl-full">
          <span>Camera</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Camera">
            {CAMERAS.map((k, i) => <button key={k.name} type="button" role="radio" aria-checked={cam === i} className={cam === i ? "is-on" : ""} onClick={() => setCam(i)}>{k.name}</button>)}
          </div>
        </div>
      </div>
      <div className="eq-row sc-eq">
        <span className="eq-term"><span className="eq-value">{fmt(feature, 2)} mm ÷ {ppf} px</span></span>
        <span className="eq-op">=</span>
        <span className="eq-term is-result"><span className="eq-value">≤ {fmt(needMmpp, 3)} mm/px</span></span>
        <span className="eq-op">→</span>
        <span className={needPx <= c.px ? "eq-term is-result" : "eq-term fp-bad"}><span className="eq-value">≥ {fmt(needPx, 0)} px across</span></span>
      </div>
      <div className="fp-wrap"><table className="fp-table">
        <thead><tr><th>Lens</th><th>FOV width</th><th>mm / px</th><th>Feature</th><th></th></tr></thead>
        <tbody>
          {opts.map((o) => (
            <tr key={o.f} className={o.ok ? (best && best.f === o.f ? "is-best" : "is-ok") : ""}>
              <td>{o.f} mm</td><td>{fmt(o.fov, 0)} mm</td><td>{fmt(o.mmpp, 3)}</td><td>{fmt(o.featurePx, 1)} px</td>
              <td>{o.ok ? "✓" : o.fov < needFov ? "FOV too small" : "too coarse"}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <div className="pg-readout" aria-live="polite">
        <span>
          Sensor {fmt(sensorWidth(c.px, c.pitch), 2)} mm wide.{" "}
          {best ? <>Choose the <strong>{best.f} mm</strong> lens: {fmt(best.fov, 0)} mm wide, the feature covers <strong>{fmt(best.featurePx, 1)} px</strong>.</>
            : needPx > c.px ? <><strong>This camera has too few pixels</strong> ({c.px} &lt; {fmt(needPx, 0)}). Use more pixels, a smaller area, or several cameras.</>
            : <><strong>No standard lens fits at this distance.</strong> Change the working distance until one does.</>}
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Num({ label, unit, value, min, max, step, onChange }: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="ctl ctl-wide">
      <span>{label} <output>{fmt(value, 1)} {unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={`${label} in ${unit}`} />
    </label>
  );
}
