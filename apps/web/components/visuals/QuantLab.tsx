"use client";

import { useEffect, useRef, useState } from "react";
import { rng } from "@/lib/sensor-ops";

const W = 320, H = 200;

/** QuantLab: fewer bits → fewer gray levels → banding; dithering trades banding for fine noise. */
export function QuantLab({ caption }: { caption?: string }) {
  const [bits, setBits] = useState(3);
  const [dither, setDither] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = useRef<Uint8ClampedArray | null>(null);
  const [ready, setReady] = useState(false);
  const levels = 2 ** bits;
  const step = 255 / (levels - 1);

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
    img.src = "/images/sample-scene.png";
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"), s = src.current;
    if (!ctx || !s || !ready) return;
    const out = ctx.createImageData(W, H), r = rng(32);
    const q = (v: number) => Math.round(Math.max(0, Math.min(levels - 1, v / step + (dither ? r() - 0.5 : 0)))) * step;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (y < 60) {
        const v = q((x / (W - 1)) * 255);
        out.data[i] = out.data[i + 1] = out.data[i + 2] = Math.round(v);
      } else {
        const sy = Math.min(H - 1, Math.round(((y - 60) / (H - 60)) * H));
        const j = (sy * W + x) * 4;
        const g = 0.299 * s[j] + 0.587 * s[j + 1] + 0.114 * s[j + 2];
        out.data[i] = out.data[i + 1] = out.data[i + 2] = Math.round(q(g));
      }
      out.data[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, bits, dither, levels, step]);

  return (
    <figure className="fig quantlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Bits per pixel</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Bits per pixel">
            {[1, 2, 3, 4, 5, 6, 8].map((b) => <button key={b} type="button" role="radio" aria-checked={bits === b} className={bits === b ? "is-on" : ""} onClick={() => setBits(b)}>{b}</button>)}
          </div>
        </div>
        <label className="ctl"><input type="checkbox" checked={dither} onChange={() => setDither(!dither)} /> Dither (add ±½ step of noise before rounding)</label>
      </div>
      <canvas ref={canvas} width={W} height={H} className="sl-canvas" role="img" aria-label={`A gray ramp and a scene quantized to ${bits} bits`} />
      <ul className="ap-stats">
        <li><span>Levels</span><strong>{levels}</strong><em>2^{bits}</em></li>
        <li><span>Step</span><strong>{step.toFixed(step < 2 ? 2 : 1)}</strong><em>in 0–255 units</em></li>
        <li><span>Max rounding error</span><strong>±{(step / 2).toFixed(step < 2 ? 2 : 1)}</strong><em>half a step</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite"><span>{bits <= 4 ? "Few levels: smooth areas turn into visible bands (posterization). " : bits < 8 ? "The bands are getting hard to see. " : "256 levels: smooth to the eye. "}{dither ? "Dithering breaks the bands into fine noise; averaged, it follows the true ramp." : ""}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
