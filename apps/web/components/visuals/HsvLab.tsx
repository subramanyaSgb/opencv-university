"use client";

import { useState } from "react";
import { bgrToHsv8, hsv8ToBgr, type Trip } from "@/lib/hsv-ops";

const css = (b: Trip) => `rgb(${b[2]},${b[1]},${b[0]})`;

/** HsvLab: OpenCV HSV sliders (H 0–179), shading changes only V, and how unstable hue gets at low saturation. */
export function HsvLab({ caption }: { caption?: string }) {
  const [h, setH] = useState(15);
  const [s, setS] = useState(215);
  const [v, setV] = useState(230);
  const [shade, setShade] = useState(0.5);
  const bgr = hsv8ToBgr([h, s, v]);
  const dark = bgr.map((x) => Math.round(x * shade)) as Trip;
  const hd = bgrToHsv8(dark);
  // hue spread when each channel is off by ±3 (sensor noise)
  const hues: number[] = [];
  for (const db of [-3, 3]) for (const dg of [-3, 3]) for (const dr of [-3, 3]) {
    const n = [bgr[0] + db, bgr[1] + dg, bgr[2] + dr].map((x) => Math.min(255, Math.max(0, x))) as Trip;
    hues.push(bgrToHsv8(n)[0]);
  }
  const circ = (a: number, b: number) => Math.min(Math.abs(a - b), 180 - Math.abs(a - b));
  const spread = Math.max(...hues.map((a) => Math.max(...hues.map((b) => circ(a, b)))));
  return (
    <figure className="fig hsvlab">
      <div className="hv-strip" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => <i key={i} style={{ background: css(hsv8ToBgr([i * 3, 255, 255])) }} />)}
        <b style={{ left: `${(h / 180) * 100}%` }} />
      </div>
      <div className="hv-scale"><span>0</span><span>30 yellow</span><span>60 green</span><span>90 cyan</span><span>120 blue</span><span>150 magenta</span><span>179</span></div>
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>H (hue) <output>{h}</output></span><input type="range" min={0} max={179} value={h} onChange={(e) => setH(Number(e.target.value))} aria-label="Hue" /></label>
        <label className="ctl ctl-wide"><span>S (saturation) <output>{s}</output></span><input type="range" min={0} max={255} value={s} onChange={(e) => setS(Number(e.target.value))} aria-label="Saturation" /></label>
        <label className="ctl ctl-wide"><span>V (value) <output>{v}</output></span><input type="range" min={0} max={255} value={v} onChange={(e) => setV(Number(e.target.value))} aria-label="Value" /></label>
        <label className="ctl ctl-wide"><span>Shadow: light × <output>{shade.toFixed(2)}</output></span><input type="range" min={0.1} max={1} step={0.05} value={shade} onChange={(e) => setShade(Number(e.target.value))} aria-label="Shadow factor" /></label>
      </div>
      <div className="ch-row hv-row">
        <div className="ch-sw"><i style={{ background: css(bgr) }} /><span>lit: BGR ({bgr.join(", ")})</span></div>
        <div className="ch-sw"><i style={{ background: css(dark) }} /><span>in shadow: BGR ({dark.join(", ")})</span></div>
      </div>
      <ul className="ap-stats">
        <li><span>HSV in shadow</span><strong>({hd.join(", ")})</strong><em>lit: ({h}, {s}, {v}) · mostly V changes</em></li>
        <li><span>Hue noise (±3 per channel)</span><strong className={spread > 8 ? "hv-bad" : "hv-ok"}>± {Math.ceil(spread / 2)} H units</strong><em>{spread > 8 ? "low saturation or darkness: hue is unreliable" : "hue is stable here"}</em></li>
        <li><span>Hue in degrees</span><strong>{h * 2}°</strong><em>OpenCV stores degrees / 2 in 8-bit images</em></li>
      </ul>
      <div className="pg-readout"><span>Red sits at both ends of the hue range (0 and 179): a red detector needs two ranges. Try S below 40 or V below 40 and watch the hue noise grow.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
