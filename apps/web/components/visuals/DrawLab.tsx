"use client";

import { useEffect, useRef, useState } from "react";
import { circle, line8, rect, type Px } from "@/lib/draw-ops";

const GW = 32, GH = 20, Z = 14;
type Shape = "line" | "rectangle" | "circle";

/** DrawLab: OpenCV drawing on a tiny zoomed image: pixel-exact LINE_8 lines vs anti-aliased drawing, outline vs filled. */
export function DrawLab({ caption }: { caption?: string }) {
  const [shape, setShape] = useState<Shape>("line");
  const [aa, setAa] = useState(false);
  const [filled, setFilled] = useState(false);
  const [x1, setX1] = useState(27);
  const [y1, setY1] = useState(15);
  const ref = useRef<HTMLCanvasElement>(null);
  const p0: Px = [3, 3], p1: Px = [x1, y1];
  const r = Math.max(1, Math.round(Math.hypot(x1 - 10, y1 - 10)));

  useEffect(() => {
    const out = ref.current?.getContext("2d");
    if (!out) return;
    // draw at native size into a small canvas
    const small = document.createElement("canvas"); small.width = GW; small.height = GH;
    const s = small.getContext("2d"); if (!s) return;
    s.fillStyle = "#283039"; s.fillRect(0, 0, GW, GH);
    s.fillStyle = s.strokeStyle = "#ffc83c";
    if (aa) {
      s.lineWidth = 1;
      s.beginPath();
      if (shape === "line") { s.moveTo(p0[0] + 0.5, p0[1] + 0.5); s.lineTo(p1[0] + 0.5, p1[1] + 0.5); s.stroke(); }
      if (shape === "rectangle") { if (filled) s.fillRect(p0[0], p0[1], p1[0] - p0[0] + 1, p1[1] - p0[1] + 1); else s.strokeRect(p0[0] + 0.5, p0[1] + 0.5, p1[0] - p0[0], p1[1] - p0[1]); }
      if (shape === "circle") { s.arc(10.5, 10.5, r, 0, 2 * Math.PI); if (filled) s.fill(); else s.stroke(); }
    } else {
      const px = shape === "line" ? line8(p0, p1) : shape === "rectangle" ? rect(p0, p1, filled ? -1 : 1) : circle([10, 10], r, filled ? -1 : 1);
      px.forEach(([x, y]) => { if (x >= 0 && y >= 0 && x < GW && y < GH) s.fillRect(x, y, 1, 1); });
    }
    out.imageSmoothingEnabled = false;
    out.clearRect(0, 0, GW * Z, GH * Z);
    out.drawImage(small, 0, 0, GW * Z, GH * Z);
    out.strokeStyle = "rgba(255,255,255,0.08)";
    for (let x = 0; x <= GW; x++) { out.beginPath(); out.moveTo(x * Z, 0); out.lineTo(x * Z, GH * Z); out.stroke(); }
    for (let y = 0; y <= GH; y++) { out.beginPath(); out.moveTo(0, y * Z); out.lineTo(GW * Z, y * Z); out.stroke(); }
  }, [shape, aa, filled, x1, y1, r]);

  const lt = aa ? "cv2.LINE_AA" : "cv2.LINE_8";
  const th = filled && shape !== "line" ? "-1" : "1";
  const code = shape === "line" ? `cv2.line(img, (3, 3), (${x1}, ${y1}), (60, 200, 255), 1, ${lt})`
    : shape === "rectangle" ? `cv2.rectangle(img, (3, 3), (${x1}, ${y1}), (60, 200, 255), ${th}, ${lt})`
    : `cv2.circle(img, (10, 10), ${r}, (60, 200, 255), ${th}, ${lt})`;
  return (
    <figure className="fig drawlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Shape</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Shape">
            {(["line", "rectangle", "circle"] as Shape[]).map((k) => <button key={k} type="button" role="radio" aria-checked={shape === k} className={shape === k ? "is-on" : ""} onClick={() => setShape(k)}>{k}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>lineType</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Line type">
            {([[false, "LINE_8 (pixel steps)"], [true, "LINE_AA (anti-aliased)"]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={aa === k} className={aa === k ? "is-on" : ""} onClick={() => setAa(k)}>{l}</button>)}
          </div>
        </div>
        {shape !== "line" && <label className="ctl"><input type="checkbox" checked={filled} onChange={() => setFilled(!filled)} /> thickness = −1 (filled)</label>}
        <label className="ctl ctl-wide"><span>{shape === "circle" ? "Radius point x" : "End point x"} <output>{x1}</output></span><input type="range" min={0} max={GW - 1} value={x1} onChange={(e) => setX1(Number(e.target.value))} aria-label="x" /></label>
        <label className="ctl ctl-wide"><span>{shape === "circle" ? "Radius point y" : "End point y"} <output>{y1}</output></span><input type="range" min={0} max={GH - 1} value={y1} onChange={(e) => setY1(Number(e.target.value))} aria-label="y" /></label>
      </div>
      <div className="dr-wrap"><canvas ref={ref} width={GW * Z} height={GH * Z} className="dr-canvas" role="img" aria-label={`A ${shape} drawn on a 32 by 20 pixel image, enlarged`} /></div>
      <code className="ip-cmd">{code}</code>
      <div className="pg-readout"><span>A 32 × 20 image enlarged 14×. LINE_8 lines are exactly what OpenCV draws; anti-aliased drawing is rendered by your browser and looks like OpenCV's LINE_AA (partly lit edge pixels).</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
