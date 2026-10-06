"use client";

import { useEffect, useRef, useState } from "react";

const W = 320, H = 200;
const STEPS = [8, 16, 32, 64, 160, 320];

/** SamplingLab: sample the test chart with fewer pixels and see what survives; smoothing cannot bring detail back. */
export function SamplingLab({ caption }: { caption?: string }) {
  const [si, setSi] = useState(3);
  const [smooth, setSmooth] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = useRef<Uint8ClampedArray | null>(null);
  const [ready, setReady] = useState(false);
  const n = STEPS[si];
  const m = Math.max(1, Math.round((n * H) / W));

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
    // 1. sample: each of the n × m pixels is the average of the scene area it covers
    const small = new Float32Array(n * m);
    for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
      const x0 = Math.floor((i * W) / n), x1 = Math.floor(((i + 1) * W) / n);
      const y0 = Math.floor((j * H) / m), y1 = Math.floor(((j + 1) * H) / m);
      let sum = 0, cnt = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { sum += s[(y * W + x) * 4]; cnt++; }
      small[j * n + i] = sum / Math.max(1, cnt);
    }
    // 2. display at full size: blocks (nearest) or smoothed (bilinear)
    const out = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v: number;
      if (!smooth) v = small[Math.min(m - 1, Math.floor((y * m) / H)) * n + Math.min(n - 1, Math.floor((x * n) / W))];
      else {
        const fx = Math.max(0, Math.min(n - 1, ((x + 0.5) * n) / W - 0.5)), fy = Math.max(0, Math.min(m - 1, ((y + 0.5) * m) / H - 0.5));
        const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(n - 1, x0 + 1), y1 = Math.min(m - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
        const p = (xx: number, yy: number) => small[yy * n + xx];
        v = (1 - ay) * ((1 - ax) * p(x0, y0) + ax * p(x1, y0)) + ay * ((1 - ax) * p(x0, y1) + ax * p(x1, y1));
      }
      const i = (y * W + x) * 4;
      out.data[i] = out.data[i + 1] = out.data[i + 2] = Math.round(v);
      out.data[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, n, m, smooth]);

  return (
    <figure className="fig samplinglab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Pixels across</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Number of pixels across">
            {STEPS.map((v, k) => <button key={v} type="button" role="radio" aria-checked={si === k} className={si === k ? "is-on" : ""} onClick={() => setSi(k)}>{v}</button>)}
          </div>
        </div>
        <label className="ctl"><input type="checkbox" checked={smooth} onChange={() => setSmooth(!smooth)} /> Smooth the display (bilinear)</label>
      </div>
      <canvas ref={canvas} width={W} height={H} className="sl-canvas" role="img" aria-label={`The test chart sampled with ${n} by ${m} pixels`} />
      <div className="pg-readout" aria-live="polite">
        <span><strong>{n} × {m} = {(n * m).toLocaleString("en")} pixels</strong> ({((n * m) / (W * H) * 100).toFixed(n * m < 3200 ? 1 : 0)} % of the original). {smooth ? "Smoothing hides the blocks but cannot bring back bars that were lost." : "Each block is one pixel: the average of the scene it covers."}</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
