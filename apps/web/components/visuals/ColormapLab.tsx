"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lut, lightness, monotonic, MAP_NAMES } from "@/lib/colormap-ops";
import { simulate, toLab, type Cvd } from "@/lib/cvd-ops";

const W = 240, H = 120;
/** A smooth synthetic height map (mm): a gentle slope, a broad bump and a small 0.05 mm dent. */
function field() {
  const f = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bump = Math.exp(-(((x - 150) / 45) ** 2 + ((y - 60) / 35) ** 2));
    const dent = -0.25 * Math.exp(-(((x - 70) / 6) ** 2 + ((y - 55) / 6) ** 2));
    f[y * W + x] = 0.35 * (x / W) + 0.6 * bump + dent;
  }
  let lo = Infinity, hi = -Infinity;
  f.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
  return Array.from(f, (v) => Math.round((255 * (v - lo)) / (hi - lo)));
}

/** ColormapLab: one height map in different colour maps; lightness profile, grey view and colour-blind view. */
export function ColormapLab({ caption }: { caption?: string }) {
  const [map, setMap] = useState<string>("jet");
  const [cvd, setCvd] = useState<Cvd>("normal");
  const [grey, setGrey] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);
  const data = useMemo(field, []);
  const L = useMemo(() => lightness(map, cvd), [map, cvd]);
  const mono = monotonic(L);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    const table = Array.from({ length: 256 }, (_, i) => {
      const c = simulate(lut(map, i), cvd);
      if (!grey) return c;
      const l = Math.round((toLab(c)[0] / 100) * 255);
      return [l, l, l];
    });
    data.forEach((v, i) => { const c = table[v]; img.data.set([c[0], c[1], c[2], 255], i * 4); });
    ctx.putImageData(img, 0, 0);
  }, [map, cvd, grey, data]);
  const path = L.map((v, i) => `${i ? "L" : "M"}${(i * 300) / 255},${(100 - v).toFixed(1)}`).join(" ");
  return (
    <figure className="fig colormaplab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Colour map</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Colour map">
            {MAP_NAMES.map((m) => <button key={m} type="button" role="radio" aria-checked={map === m} className={map === m ? "is-on" : ""} onClick={() => setMap(m)}>{m}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Viewer</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Viewer">
            {(["normal", "deuteranopia", "protanopia"] as Cvd[]).map((v) => <button key={v} type="button" role="radio" aria-checked={cvd === v} className={cvd === v ? "is-on" : ""} onClick={() => setCvd(v)}>{v === "normal" ? "normal vision" : v}</button>)}
          </div>
        </div>
        <div className="ctl"><button type="button" className="hl-reset" onClick={() => setGrey(!grey)}>{grey ? "Show colours" : "Show lightness only"}</button></div>
      </div>
      <canvas ref={ref} width={W} height={H} className="cm-canvas" aria-label={`Height map shown with the ${map} colour map`} role="img" />
      <div className="cm-bar" aria-hidden="true">{Array.from({ length: 64 }, (_, i) => { const c = simulate(lut(map, i * 4 + 2), cvd); return <i key={i} style={{ background: `rgb(${c.join(",")})` }} />; })}</div>
      <svg viewBox="0 0 300 100" className="cm-plot" role="img" aria-label="Lightness L* along the colour map from low to high values">
        <line x1="0" y1="100" x2="300" y2="0" className="cm-ideal" />
        <path d={path} className="cm-L" />
      </svg>
      <div className="gl-legend cm-legend"><span><i className="k1" /> L* along the map (0–100)</span><span><i className="k2" /> ideal: steady increase</span></div>
      <ul className="ap-stats">
        <li><span>Lightness</span><strong className={mono ? "cm-ok" : "cm-bad"}>{mono ? "monotonic" : "goes up and down"}</strong><em>{mono ? "higher value = lighter: order is readable even in grey" : "equal lightness at different heights: false edges and ambiguity"}</em></li>
        <li><span>L* range</span><strong>{Math.min(...L).toFixed(0)} – {Math.max(...L).toFixed(0)}</strong><em>start {L[0].toFixed(0)}, end {L[255].toFixed(0)}</em></li>
      </ul>
      <div className="pg-readout"><span>The height map is smooth except for a small dent on the left. Look for bands that are not in the data (jet, turbo) and check whether the dent stays visible.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
