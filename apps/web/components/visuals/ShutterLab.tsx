"use client";

import { useEffect, useRef, useState } from "react";
import { bandingDepth, rowFlicker } from "@/lib/shutter-ops";
import { fmt } from "@/lib/scale-ops";

const W = 320, H = 200;
const LINE = 75e-6; // seconds per row in this demo (200 rows → 15 ms readout)
const EXPOSURES = [1, 2.5, 5, 10, 20]; // ms

/** ShutterLab: global vs rolling shutter on moving bars, with optional mains flicker. */
export function ShutterLab({ caption }: { caption?: string }) {
  const [rolling, setRolling] = useState(true);
  const [speed, setSpeed] = useState(4); // px per ms
  const [mains, setMains] = useState(50);
  const [ei, setEi] = useState(1);
  const [frame, setFrame] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const exp = EXPOSURES[ei] / 1000;
  const f = mains ? 2 * mains : 0;
  const t0Frame = frame * (1 / 30);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const t = t0Frame + (rolling ? y * LINE : 0);
      const shift = speed * 1000 * (rolling ? y * LINE : 0);
      const g = f ? rowFlicker(t, exp, f, 0.3) : 1;
      for (let x = 0; x < W; x++) {
        const xs = (((x - shift - frame * 7) % 80) + 80) % 80;
        const base = xs < 26 ? 210 : 40;
        const v = Math.max(0, Math.min(255, Math.round(base * 0.75 * g)));
        const i = (y * W + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [rolling, speed, f, exp, t0Frame, frame]);

  const skew = rolling ? speed * 1000 * H * LINE : 0;
  const band = f && rolling ? bandingDepth(exp, f, 0.3, H, LINE) : 0;
  const frameGain = f && !rolling ? rowFlicker(t0Frame, exp, f, 0.3) : 1;

  return (
    <figure className="fig shutterlab">
      <div className="sc-ctl">
        <Seg label="Shutter" options={["Global", "Rolling"]} value={rolling ? "Rolling" : "Global"} onChange={(v) => setRolling(v === "Rolling")} />
        <Seg label="Lamp" options={["Steady", "50 Hz mains", "60 Hz mains"]} value={mains === 0 ? "Steady" : `${mains} Hz mains`} onChange={(v) => setMains(v === "Steady" ? 0 : v.startsWith("50") ? 50 : 60)} />
        <Seg label="Exposure" options={EXPOSURES.map((e) => `${e} ms`)} value={`${EXPOSURES[ei]} ms`} onChange={(v) => setEi(EXPOSURES.indexOf(Number(v.replace(" ms", ""))))} />
        <label className="ctl ctl-wide">
          <span>Bar speed <output>{speed} px/ms</output></span>
          <input type="range" min={0} max={10} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Bar speed in pixels per millisecond" />
        </label>
        <button type="button" className="btn" onClick={() => setFrame(frame + 1)}>Next frame ▸</button>
      </div>
      <canvas ref={canvas} width={W} height={H} className="sl-canvas" role="img" aria-label={`${rolling ? "Rolling" : "Global"} shutter image of moving bars${f ? ` under ${mains} Hz lighting` : ""}`} />
      <ul className="ap-stats">
        <li><span>Skew (top to bottom)</span><strong>{fmt(skew, 0)} px</strong><em>{rolling ? "rows read 15 ms apart" : "all rows at once"}</em></li>
        <li><span>Banding</span><strong>{fmt(band * 100, 0)} %</strong><em>{f ? `${f} Hz light flicker` : "steady light"}</em></li>
        <li><span>Frame brightness</span><strong>×{fmt(frameGain, 2)}</strong><em>frame {frame} (30 fps)</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite">
        <span>
          {rolling && speed > 0 ? "Rolling shutter: lower rows are exposed later, so moving bars lean. " : ""}
          {f && rolling && band > 0.02 ? "The light changes while the rows are exposed one after another: horizontal bands. " : ""}
          {f && !rolling ? "Global shutter: no bands, but the whole frame's brightness changes from frame to frame. " : ""}
          {f && EXPOSURES[ei] % (1000 / f) === 0 ? `${EXPOSURES[ei]} ms is a whole number of flicker periods, so the flicker cancels.` : ""}
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Seg({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="ctl ctl-full">
      <span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} className={value === o ? "is-on" : ""} onClick={() => onChange(o)}>{o}</button>)}
      </div>
    </div>
  );
}
