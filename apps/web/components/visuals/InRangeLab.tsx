"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scene, inRangeHsv, tally, OBJECTS, W, H } from "@/lib/inrange-ops";

const PRESETS = [
  { l: "orange", h: [10, 22] },
  { l: "red (no wrap)", h: [0, 8] },
  { l: "red (wraps)", h: [170, 8] },
  { l: "green", h: [45, 80] },
];

/** InRangeLab: tune an HSV range on a shaded scene with caps, cardboard and a highlight; see the mask and per-object hits. */
export function InRangeLab({ caption }: { caption?: string }) {
  const { bgr, id } = useMemo(scene, []);
  const [hLo, setHLo] = useState(10);
  const [hHi, setHHi] = useState(22);
  const [sMin, setSMin] = useState(120);
  const [vMin, setVMin] = useState(50);
  const [view, setView] = useState<"image" | "mask" | "overlay">("overlay");
  const ref = useRef<HTMLCanvasElement>(null);
  const mask = useMemo(() => inRangeHsv(bgr, hLo, hHi, sMin, vMin), [bgr, hLo, hHi, sMin, vMin]);
  const { hit, tot } = tally(mask, id);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const b = bgr[3 * i], g = bgr[3 * i + 1], r = bgr[3 * i + 2], m = mask[i];
      const px = view === "mask" ? [m, m, m] : view === "overlay" ? (m ? [255, 0, 255] : [r * 0.45, g * 0.45, b * 0.45]) : [r, g, b];
      img.data.set([px[0], px[1], px[2], 255], 4 * i);
    }
    ctx.putImageData(img, 0, 0);
  }, [bgr, mask, view]);
  const sl = (label: string, v: number, set: (n: number) => void, max: number) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={0} max={max} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  return (
    <figure className="fig inrangelab">
      <canvas ref={ref} width={W} height={H} className="ir-canvas" role="img" aria-label="Scene with the detected pixels" />
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Show</span>
          <div className="seg seg-small" role="radiogroup" aria-label="View">
            {(["image", "mask", "overlay"] as const).map((v) => <button key={v} type="button" role="radio" aria-checked={view === v} className={view === v ? "is-on" : ""} onClick={() => setView(v)}>{v}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Preset</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Preset">
            {PRESETS.map((p) => <button key={p.l} type="button" role="radio" aria-checked={hLo === p.h[0] && hHi === p.h[1]} className={hLo === p.h[0] && hHi === p.h[1] ? "is-on" : ""} onClick={() => { setHLo(p.h[0]); setHHi(p.h[1]); }}>{p.l}</button>)}
          </div>
        </div>
        {sl("H low", hLo, setHLo, 179)}
        {sl("H high", hHi, setHHi, 179)}
        {sl("S min", sMin, setSMin, 255)}
        {sl("V min", vMin, setVMin, 255)}
      </div>
      <ul className="ir-hits">
        {[...OBJECTS.map((o) => ({ id: o.id, name: o.name, bgr: o.bgr })), { id: 0, name: "belt (background)", bgr: [118, 120, 122] }].map((o) => {
          const pct = (100 * (hit.get(o.id) ?? 0)) / (tot.get(o.id) ?? 1);
          return <li key={o.id}><i style={{ background: `rgb(${o.bgr[2]},${o.bgr[1]},${o.bgr[0]})` }} /><span>{o.name}</span><b style={{ width: `${pct}%` }} /><em>{pct.toFixed(0)} %</em></li>;
        })}
      </ul>
      <div className="pg-readout"><span>{hLo > hHi ? `Hue wraps: ${hLo}–179 and 0–${hHi} (two inRange calls combined with bitwise_or).` : `cv2.inRange(hsv, (${hLo}, ${sMin}, ${vMin}), (${hHi}, 255, 255))`}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
