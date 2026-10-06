"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resizeGray } from "@/lib/warp-ops";

type M = "nearest" | "linear" | "cubic" | "area";

function useGray(src: string) {
  const [g, setG] = useState<{ d: Uint8Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Uint8Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = Math.round(0.299 * p[4 * i] + 0.587 * p[4 * i + 1] + 0.114 * p[4 * i + 2]);
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

function Panel({ d, w, h, label, profileRow }: { d: ArrayLike<number>; w: number; h: number; label: string; profileRow?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) im.data.set([d[i], d[i], d[i], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
  }, [d, w, h]);
  const prof = profileRow !== undefined ? Array.from({ length: w }, (_, x) => `${x ? "L" : "M"}${x},${(52 - (48 * d[profileRow * w + x]) / 255).toFixed(1)}`).join(" ") : null;
  return (
    <figure className="it-panel">
      <canvas ref={ref} width={w} height={h} className="it-img" role="img" aria-label={label} />
      {prof && <svg viewBox={`0 0 ${w} 56`} preserveAspectRatio="none" className="it-prof" aria-hidden="true"><line x1={0} x2={w} y1={4} y2={4} /><line x1={0} x2={w} y1={52} y2={52} /><path d={prof} /></svg>}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/** InterpLab (16.4): enlarge a small crop with nearest, bilinear and bicubic (with a row profile), or shrink a zone plate with nearest, bilinear and area. */
export function InterpLab({ initial = "up", caption }: { initial?: "up" | "down"; caption?: string }) {
  const label = useGray("/images/sample-label-rectified.png"), zone = useGray("/images/sample-zoneplate.png");
  const [mode, setMode] = useState<"up" | "down">(initial);
  const [k, setK] = useState(mode === "up" ? 6 : 4);
  const crop = useMemo(() => {
    if (!label) return null;
    const cw = 40, ch = 24, x0 = 70, y0 = 80, d = new Uint8Array(cw * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) d[y * cw + x] = label.d[(y0 + y) * label.w + x0 + x];
    return { d, w: cw, h: ch };
  }, [label]);
  const methods: M[] = mode === "up" ? ["nearest", "linear", "cubic"] : ["nearest", "linear", "area"];
  const res = useMemo(() => {
    if (mode === "up" && crop) return methods.map((m) => ({ m, d: resizeGray(crop.d, crop.w, crop.h, crop.w * k, crop.h * k, m), w: crop.w * k, h: crop.h * k }));
    if (mode === "down" && zone) {
      const sw = Math.round(zone.w / k), sh = Math.round(zone.h / k);
      return methods.map((m) => { const small = resizeGray(zone.d, zone.w, zone.h, sw, sh, m); return { m, d: resizeGray(small, sw, sh, zone.w, zone.h, "nearest"), w: zone.w, h: zone.h }; });
    }
    return null;
  }, [mode, k, crop, zone]); // eslint-disable-line react-hooks/exhaustive-deps
  const flag = { nearest: "INTER_NEAREST", linear: "INTER_LINEAR", cubic: "INTER_CUBIC", area: "INTER_AREA" };
  return (
    <figure className="fig interplab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Task</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Task">
            {(["up", "down"] as const).map((x) => <button key={x} type="button" role="radio" aria-checked={mode === x} className={mode === x ? "is-on" : ""} onClick={() => { setMode(x); setK(x === "up" ? 6 : 4); }}>{x === "up" ? "enlarge a 40 × 24 crop" : "shrink a zone plate"}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>{mode === "up" ? "Enlarge by" : "Shrink by"} <output>{k}×</output></span><input type="range" min={2} max={mode === "up" ? 8 : 8} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Factor" /></label>
      </div>
      {res && <div className="it-grid">{res.map((r) => <Panel key={r.m} d={r.d} w={r.w} h={r.h} label={`${r.m} (cv2.${flag[r.m]})${mode === "down" ? ", shown enlarged" : ""}`} profileRow={mode === "up" ? Math.round(r.h * 0.45) : undefined} />)}</div>}
      {mode === "up" && <p className="it-note">The curve under each image is one row through the letters: steps (nearest), straight ramps (linear), and ramps with small over- and undershoots (cubic).</p>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
