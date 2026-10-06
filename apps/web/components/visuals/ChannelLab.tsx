"use client";

import { useEffect, useRef, useState } from "react";

const W = 320, H = 200;
const NAMES = ["B", "G", "R"] as const;

/** ChannelLab: switch channels on and off, or view one channel as a gray image; click to read B, G, R. */
export function ChannelLab({ caption }: { caption?: string }) {
  const [on, setOn] = useState([true, true, true]); // B, G, R
  const [single, setSingle] = useState<number | null>(null);
  const [pick, setPick] = useState<[number, number]>([90, 70]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = useRef<Uint8ClampedArray | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      src.current = ctx.getImageData(0, 0, W, H).data;
      setReady(true);
    };
    img.src = "/images/sample-color.png";
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"), s = src.current;
    if (!ctx || !s || !ready) return;
    const out = ctx.createImageData(W, H);
    for (let p = 0; p < W * H * 4; p += 4) {
      const bgr = [s[p + 2], s[p + 1], s[p]];
      if (single !== null) {
        out.data[p] = out.data[p + 1] = out.data[p + 2] = bgr[single];
      } else {
        out.data[p] = on[2] ? bgr[2] : 0; // R
        out.data[p + 1] = on[1] ? bgr[1] : 0; // G
        out.data[p + 2] = on[0] ? bgr[0] : 0; // B
      }
      out.data[p + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.strokeRect(pick[1] - 4, pick[0] - 4, 9, 9);
  }, [ready, on, single, pick]);

  const s = src.current;
  const px = s && ready ? (() => { const i = (pick[0] * W + pick[1]) * 4; return [s[i + 2], s[i + 1], s[i]]; })() : [0, 0, 0];

  return (
    <figure className="fig channellab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Colour view</span>
          {NAMES.map((n, k) => (
            <label key={n} className={on[k] && single === null ? "isp-step is-on" : "isp-step"}>
              <input type="checkbox" checked={on[k]} onChange={() => { setSingle(null); setOn(on.map((v, i) => (i === k ? !v : v))); }} /> {n}
            </label>
          ))}
        </div>
        <div className="ctl ctl-full">
          <span>One channel as gray</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Show one channel">
            {NAMES.map((n, k) => <button key={n} type="button" role="radio" aria-checked={single === k} className={single === k ? "is-on" : ""} onClick={() => setSingle(single === k ? null : k)}>{n}</button>)}
          </div>
        </div>
      </div>
      <canvas ref={canvas} width={W} height={H} className="sl-canvas cl-canvas" role="img" aria-label="The colour sample image with the chosen channels"
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPick([Math.min(H - 1, Math.floor(((e.clientY - r.top) / r.height) * H)), Math.min(W - 1, Math.floor(((e.clientX - r.left) / r.width) * W))]); }} />
      <div className="pg-readout" aria-live="polite">
        <span>Pixel (row {pick[0]}, col {pick[1]}): <strong>B {px[0]}, G {px[1]}, R {px[2]}</strong>. {single !== null ? `Showing channel ${NAMES[single]} alone: bright where that colour is strong.` : "Click the image to read a pixel."}</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
