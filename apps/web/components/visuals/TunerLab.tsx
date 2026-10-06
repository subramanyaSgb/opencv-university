"use client";

import { useEffect, useRef, useState } from "react";
import { inRange, rectFromDrag } from "@/lib/roi-ops";

const W = 320, H = 200;

/** TunerLab: the classic OpenCV tuning tool in the browser: two "trackbars" for an inRange threshold,
 *  click to read a pixel, drag to measure an ROI's mean. */
export function TunerLab({ caption }: { caption?: string }) {
  const [lo, setLo] = useState(200);
  const [hi, setHi] = useState(255);
  const [showMask, setShowMask] = useState(true);
  const [pick, setPick] = useState<{ x: number; y: number; v: number } | null>(null);
  const [roi, setRoi] = useState<[number, number, number, number] | null>(null);
  const [roiMean, setRoiMean] = useState<number | null>(null);
  const gray = useRef<Uint8Array | null>(null);
  const out = useRef<HTMLCanvasElement>(null);
  const drag = useRef<[number, number] | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d"); if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, W, H).data;
      const g = new Uint8Array(W * H);
      for (let i = 0; i < g.length; i++) g[i] = d[4 * i + 1];
      gray.current = g; force((n) => n + 1);
    };
    img.src = "/images/sample-scene.png";
  }, []);

  const { mask, count } = gray.current ? inRange(gray.current, Math.min(lo, hi), Math.max(lo, hi)) : { mask: null, count: 0 };

  useEffect(() => {
    const ctx = out.current?.getContext("2d");
    const g = gray.current;
    if (!ctx || !g || !mask) return;
    const im = ctx.createImageData(W, H);
    for (let i = 0; i < g.length; i++) {
      const on = mask[i] > 0;
      const [r, gg, b] = showMask ? (on ? [255, 255, 255] : [0, 0, 0]) : on ? [Math.round(g[i] * 0.4 + 153), g[i], Math.round(g[i] * 0.4)] : [g[i], g[i], g[i]];
      im.data.set([r, gg, b, 255], 4 * i);
    }
    ctx.putImageData(im, 0, 0);
    if (roi) { ctx.strokeStyle = "#1f6feb"; ctx.lineWidth = 2; ctx.strokeRect(roi[0] + 0.5, roi[1] + 0.5, roi[2], roi[3]); }
    if (pick) { ctx.strokeStyle = "#cf222e"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pick.x - 6, pick.y); ctx.lineTo(pick.x + 6, pick.y); ctx.moveTo(pick.x, pick.y - 6); ctx.lineTo(pick.x, pick.y + 6); ctx.stroke(); }
  });

  const at = (e: React.PointerEvent): [number, number] => {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return [Math.min(W - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * W))), Math.min(H - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * H)))];
  };
  const down = (e: React.PointerEvent) => { drag.current = at(e); (e.target as Element).setPointerCapture?.(e.pointerId); };
  const up = (e: React.PointerEvent) => {
    const p0 = drag.current; drag.current = null;
    const g = gray.current; if (!p0 || !g) return;
    const p1 = at(e);
    const r = rectFromDrag(p0, [p1[0] + 1, p1[1] + 1], W, H);
    if (!r || (r[2] <= 2 && r[3] <= 2)) { setPick({ x: p1[0], y: p1[1], v: g[p1[1] * W + p1[0]] }); return; }
    setRoi(r);
    let s = 0;
    for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) s += g[y * W + x];
    setRoiMean(s / (r[2] * r[3]));
  };

  return (
    <figure className="fig tunerlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>lower <output>{lo}</output></span><input type="range" min={0} max={255} value={lo} onChange={(e) => setLo(Number(e.target.value))} aria-label="lower threshold" /></label>
        <label className="ctl ctl-wide"><span>upper <output>{hi}</output></span><input type="range" min={0} max={255} value={hi} onChange={(e) => setHi(Number(e.target.value))} aria-label="upper threshold" /></label>
        <label className="ctl"><input type="checkbox" checked={showMask} onChange={() => setShowMask(!showMask)} /> show the mask (else: highlight on the image)</label>
      </div>
      <canvas ref={out} width={W} height={H} className="sl-canvas tu-canvas" onPointerDown={down} onPointerUp={up} role="img" aria-label="Threshold result; click to read a pixel, drag to select a region" />
      <ul className="ap-stats">
        <li><span>cv2.inRange(gray, {Math.min(lo, hi)}, {Math.max(lo, hi)})</span><strong>{count} px</strong><em>{((100 * count) / (W * H)).toFixed(1)} % of the image</em></li>
        <li><span>Clicked pixel</span><strong>{pick ? `${pick.v}` : "–"}</strong><em>{pick ? `at (x=${pick.x}, y=${pick.y})` : "click the image"}</em></li>
        <li><span>Dragged ROI mean</span><strong>{roiMean !== null ? roiMean.toFixed(1) : "–"}</strong><em>{roi ? `x=${roi[0]} y=${roi[1]} w=${roi[2]} h=${roi[3]}` : "drag a rectangle"}</em></li>
      </ul>
      <div className="pg-readout"><span>This is what the chapter's OpenCV tool does with cv2.createTrackbar and cv2.setMouseCallback: move the sliders until only the bright disc is selected, then click and drag to read values.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
