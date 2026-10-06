"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { homography, affine, type P } from "@/lib/homography-ops";
import { warp } from "@/lib/warp-ops";

const W = 320, H = 200, OW = 240, OH = 120;
const TRUE: P[] = [[70, 40], [270, 62], [255, 170], [52, 140]];
const START: P[] = [[75, 48], [262, 60], [248, 162], [58, 132]];
const NAMES = ["top-left", "top-right", "bottom-right", "bottom-left"];

function useBgr(src: string) {
  const [d, setD] = useState<Uint8Array | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 3);
      for (let i = 0; i < W * H; i++) { out[3 * i] = p[4 * i]; out[3 * i + 1] = p[4 * i + 1]; out[3 * i + 2] = p[4 * i + 2]; }
      setD(out);
    };
    img.src = src;
  }, [src]);
  return d;
}

/** RectifyLab (16.3): drag the four corners of the tilted label; a homography (or, for comparison, an affine from three corners) warps it to a 240 × 120 rectangle. */
export function RectifyLab({ caption }: { caption?: string }) {
  const img = useBgr("/images/sample-label-tilted.png");
  const [pts, setPts] = useState<P[]>(START);
  const [model, setModel] = useState<"homography" | "affine">("homography");
  const [drag, setDrag] = useState<number | null>(null);
  const dst: P[] = [[0, 0], [OW, 0], [OW, OH], [0, OH]];
  const M = useMemo(() => {
    try { return model === "homography" ? homography(pts, dst) : affine(pts.slice(0, 3), dst.slice(0, 3)); } catch { return null; }
  }, [pts, model]); // eslint-disable-line react-hooks/exhaustive-deps
  const out = useMemo(() => (img && M ? warp(img, W, H, 3, M, OW, OH, "linear", 90) : null), [img, M]);
  const inRef = useRef<HTMLCanvasElement>(null), outRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = inRef.current?.getContext("2d"); if (!ctx || !img) return;
    const im = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) im.data.set([img[3 * i], img[3 * i + 1], img[3 * i + 2], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
    ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 1.5; ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
    pts.forEach(([x, y], i) => { ctx.fillStyle = i === drag ? "#ffcc00" : "#ff00ff"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); });
  }, [img, pts, drag]);
  useEffect(() => {
    const ctx = outRef.current?.getContext("2d"); if (!ctx || !out) return;
    const im = ctx.createImageData(OW, OH);
    for (let i = 0; i < OW * OH; i++) im.data.set([out[3 * i], out[3 * i + 1], out[3 * i + 2], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
  }, [out]);
  const pos = (e: React.PointerEvent<HTMLCanvasElement>): P => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.max(0, Math.min(W, ((e.clientX - r.left) * W) / r.width)), Math.max(0, Math.min(H, ((e.clientY - r.top) * H) / r.height))];
  };
  const err = Math.max(...pts.map((p, i) => Math.hypot(p[0] - TRUE[i][0], p[1] - TRUE[i][1])));
  const f = (v: number) => (Math.abs(v) < 1e-4 ? "0" : Math.abs(v) < 0.01 ? v.toExponential(2) : v.toFixed(3));
  return (
    <figure className="fig rectifylab">
      <div className="ctl ctl-full"><span>Model</span>
        <div className="seg seg-small" role="radiogroup" aria-label="Model">
          {(["homography", "affine"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={model === m} className={model === m ? "is-on" : ""} onClick={() => setModel(m)}>{m === "homography" ? "perspective (4 corners)" : "affine (first 3 corners)"}</button>)}
        </div>
      </div>
      <div className="rf-grid">
        <div>
          <canvas ref={inRef} width={W} height={H} className="rf-img" role="img" aria-label="Tilted label with draggable corners"
            onPointerDown={(e) => { const p = pos(e); let best = 0, bd = 1e9; pts.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = i; } }); if (bd < 25) { setDrag(best); e.currentTarget.setPointerCapture(e.pointerId); } }}
            onPointerMove={(e) => { if (drag === null) return; const p = pos(e); setPts((o) => o.map((q, i) => (i === drag ? p : q))); }}
            onPointerUp={() => setDrag(null)} />
          <p className="rf-cap">Drag the magenta corners onto the label's corners ({NAMES.join(", ")}). Largest corner error: {err.toFixed(1)} px</p>
          <button type="button" className="hl-reset" onClick={() => setPts(TRUE)}>Snap to the true corners</button>
        </div>
        <div>
          <canvas ref={outRef} width={OW} height={OH} className="rf-out" role="img" aria-label="Rectified label" />
          <p className="rf-cap">Output 240 × 120 (cv2.warpPerspective)</p>
          {M && <pre className="rf-mat"><code>{M.map((r) => `[${r.map(f).join(", ")}]`).join("\n")}</code></pre>}
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
