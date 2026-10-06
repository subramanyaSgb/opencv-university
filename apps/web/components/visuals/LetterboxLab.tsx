"use client";

import { useEffect, useRef, useState } from "react";
import { fitParams, fitStats, toNet, toImage, type Fit } from "@/lib/letterbox-ops";

const IW = 320, IH = 200;
const BOX = { x: 25, y: 50, w: 90, h: 90 }; // the red disc in sample-color.png
const FITS: { k: Fit; label: string; code: string }[] = [
  { k: "stretch", label: "stretch", code: "cv2.resize(img, (S, S))" },
  { k: "crop", label: "resize + center crop", code: "cv2.dnn.blobFromImage(img, 1/255, (S, S), swapRB=True, crop=True)" },
  { k: "letterbox", label: "letterbox (pad)", code: "params.paddingmode = cv2.dnn.DNN_PMODE_LETTERBOX; cv2.dnn.blobFromImageWithParams(img, params)" },
];

/** LetterboxLab (15.5): fit a 320 × 200 image into a square network input three ways; see distortion, cut-off and padding, and map a box back. */
export function LetterboxLab({ src = "/images/sample-color.png", caption }: { src?: string; caption?: string }) {
  const [fit, setFit] = useState<Fit>("letterbox");
  const [size, setSize] = useState(224);
  const ref = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => { const i = new Image(); i.onload = () => setImg(i); i.src = src; }, [src]);
  const p = fitParams(IW, IH, size, fit), st = fitStats(IW, IH, size, fit), nb = toNet(BOX, p), back = toImage(nb, p);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx || !img) return;
    ctx.fillStyle = "#727272"; ctx.fillRect(0, 0, size, size); // letterbox padding value (114 is common in YOLO-style pipelines)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, size, size); ctx.clip();
    ctx.drawImage(img, p.ox, p.oy, IW * p.sx, IH * p.sy);
    ctx.restore();
    ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = Math.max(1, size / 160);
    ctx.strokeRect(nb.x, nb.y, nb.w, nb.h);
  }, [img, size, fit, p.ox, p.oy, p.sx, p.sy, nb.x, nb.y, nb.w, nb.h]);
  const r = (v: number) => (Math.round(v * 10) / 10).toString();
  return (
    <figure className="fig letterboxlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Fit</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Fit">
            {FITS.map((f) => <button key={f.k} type="button" role="radio" aria-checked={fit === f.k} className={fit === f.k ? "is-on" : ""} onClick={() => setFit(f.k)}>{f.label}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Input size S</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Input size">
            {[224, 320, 640].map((s) => <button key={s} type="button" role="radio" aria-checked={size === s} className={size === s ? "is-on" : ""} onClick={() => setSize(s)}>{s} × {s}</button>)}
          </div>
        </div>
      </div>
      <div className="lx-grid">
        <canvas ref={ref} width={size} height={size} className="lx-img" role="img" aria-label="Network input" />
        <div className="lx-info">
          <p><b>Scale</b> x {p.sx.toFixed(3)}, y {p.sy.toFixed(3)} {st.aspect !== 1 && <span className="lx-bad">(shapes distorted ×{st.aspect.toFixed(2)})</span>}</p>
          <p><b>Offset</b> ({r(p.ox)}, {r(p.oy)}) px</p>
          <p><b>Padding</b> {(100 * st.padding).toFixed(1)} % of the input · <b>cut off</b> {(100 * st.cut).toFixed(1)} % of the image</p>
          <p><b>Disc box</b> image ({BOX.x}, {BOX.y}, {BOX.w}, {BOX.h}) → input ({r(nb.x)}, {r(nb.y)}, {r(nb.w)}, {r(nb.h)}) → back ({r(back.x)}, {r(back.y)}, {r(back.w)}, {r(back.h)})</p>
          <pre className="lx-code"><code>{FITS.find((f) => f.k === fit)!.code}</code></pre>
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
