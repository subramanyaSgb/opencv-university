"use client";

import { useEffect, useRef, useState } from "react";
import { alongRes, crossRes, dataRate, lineRateForSquare } from "@/lib/linescan-ops";
import { fmt } from "@/lib/scale-ops";

const W = 320, H = 200;

/** LineScanLab: speed and line rate decide whether the scanned image is stretched, square or squashed. */
export function LineScanLab({ caption }: { caption?: string }) {
  const [speed, setSpeed] = useState(1);
  const [rate, setRate] = useState(1); // kHz
  const [encoder, setEncoder] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = useRef<Uint8ClampedArray | null>(null);
  const [ready, setReady] = useState(false);
  const fov = 320, px = 320; // 1 mm per pixel across, to keep the numbers simple
  const cross = crossRes(fov, px);
  const effRate = encoder ? lineRateForSquare(speed, cross) : rate * 1000;
  const along = alongRes(speed, effRate);
  const ratio = along / cross;

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
    img.src = "/images/sample-pinhole-scene.png";
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"), s = src.current;
    if (!ctx || !s || !ready) return;
    const out = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const ty = Math.floor(y * ratio);
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const v = ty < H ? s[(ty * W + x) * 4] : 245;
        out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
        out.data[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, ratio]);

  const verdict = Math.abs(ratio - 1) < 0.03 ? "Square pixels: the image has the right proportions." : ratio > 1 ? `Squashed ${fmt(ratio, 2)}×: the object moves more than one pixel per line, so detail along the motion is lost.` : `Stretched ${fmt(1 / ratio, 2)}×: the camera takes several lines per pixel of travel.`;

  return (
    <figure className="fig linescanlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide">
          <span>Conveyor speed <output>{fmt(speed, 1)} m/s</output></span>
          <input type="range" min={0.2} max={4} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Conveyor speed in metres per second" />
        </label>
        <label className="ctl ctl-wide">
          <span>Line rate <output>{encoder ? fmt(effRate / 1000, 2) : fmt(rate, 1)} kHz</output></span>
          <input type="range" min={0.2} max={4} step={0.1} value={rate} disabled={encoder} onChange={(e) => setRate(Number(e.target.value))} aria-label="Line rate in kilohertz" />
        </label>
        <label className="ctl"><input type="checkbox" checked={encoder} onChange={() => setEncoder(!encoder)} /> Encoder triggering (one line per 1 mm of travel)</label>
      </div>
      <canvas ref={canvas} width={W} height={H} className="sl-canvas" role="img" aria-label={`Scanned image: ${verdict}`} />
      <ul className="ap-stats">
        <li><span>Across</span><strong>{fmt(cross, 2)} mm/px</strong><em>{fov} mm over {px} px</em></li>
        <li><span>Along</span><strong>{fmt(along, 2)} mm/line</strong><em>speed ÷ line rate</em></li>
        <li><span>Data</span><strong>{fmt(dataRate(px, effRate) / 1e6, 2)} MB/s</strong><em>8-bit</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite"><span>{verdict}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
