"use client";

import { useEffect, useRef, useState } from "react";
import { blurPx, maxExposureUs, travelMm } from "@/lib/motion-ops";
import { FULL_WELL, gauss, poisson, rng, snr } from "@/lib/sensor-ops";
import { fmt } from "@/lib/scale-ops";

const EXPOSURES = [20, 50, 100, 200, 500, 1000, 2000, 5000]; // µs
const RATE = 4_000_000; // electrons per second on a white pixel (illustrative)
const READ = 6;

/** MotionLab: speed, exposure and scale → motion blur in pixels, brightness and noise in a simulated frame. */
export function MotionLab({ caption }: { caption?: string }) {
  const [speed, setSpeed] = useState(2);
  const [ei, setEi] = useState(5);
  const [mmpp, setMmpp] = useState(0.5);
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = useRef<{ d: Uint8ClampedArray; w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);
  const t = EXPOSURES[ei];
  const blur = blurPx(speed, t, mmpp);
  const eWhite = RATE * t * 1e-6;
  const eGray = Math.min(eWhite * 0.5, FULL_WELL);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      src.current = { d: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height };
      setReady(true);
    };
    img.src = "/images/sample-pinhole-scene.png";
  }, []);

  useEffect(() => {
    const cv = canvas.current, s = src.current;
    if (!cv || !s || !ready) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { d, w, h } = s;
    const L = Math.max(1, Math.min(120, Math.round(blur)));
    const out = ctx.createImageData(w, h);
    const r = rng(99);
    const pre = new Float64Array(w + 1);
    const lo = Math.floor((L - 1) / 2), hi = L - 1 - lo;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) pre[x + 1] = pre[x] + d[(row + x) * 4];
      for (let x = 0; x < w; x++) {
        // during the exposure this pixel sees the scene positions x-lo … x+hi (clamped at the borders)
        const a0 = Math.max(0, x - lo), a1 = Math.min(w, x + hi + 1);
        const mean = (pre[a1] - pre[a0]) / (a1 - a0);
        const e = Math.min(FULL_WELL, poisson((mean / 255) * eWhite, r)) + READ * gauss(r);
        const dn = Math.max(0, Math.min(255, Math.round((e / FULL_WELL) * 255)));
        const i = (row + x) * 4;
        out.data[i] = out.data[i + 1] = out.data[i + 2] = dn;
        out.data[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, blur, eWhite]);

  return (
    <figure className="fig motionlab op">
      <div className="sc-ctl">
        <label className="ctl ctl-wide">
          <span>Speed <output>{fmt(speed, 1)} m/s</output></span>
          <input type="range" min={0.1} max={15} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Object speed in metres per second" />
        </label>
        <label className="ctl ctl-wide">
          <span>Scale <output>{fmt(mmpp, 2)} mm/px</output></span>
          <input type="range" min={0.05} max={2} step={0.05} value={mmpp} onChange={(e) => setMmpp(Number(e.target.value))} aria-label="Millimetres per pixel" />
        </label>
        <div className="ctl ctl-full">
          <span>Exposure</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Exposure time">
            {EXPOSURES.map((v, k) => <button key={v} type="button" role="radio" aria-checked={ei === k} className={ei === k ? "is-on" : ""} onClick={() => setEi(k)}>{v >= 1000 ? `${v / 1000} ms` : `${v} µs`}</button>)}
          </div>
        </div>
      </div>
      <canvas ref={canvas} width={320} height={200} className="sl-canvas" role="img" aria-label={`Simulated frame of the chart moving right: ${fmt(blur, 1)} pixels of motion blur`} />
      <ul className="ap-stats">
        <li><span>Travel during exposure</span><strong>{fmt(travelMm(speed, t), 2)} mm</strong><em>{fmt(blur, 1)} px of blur</em></li>
        <li><span>Mid-gray signal</span><strong>{fmt(eGray, 0)} e⁻</strong><em>SNR {fmt(snr(eGray, READ), 1)}</em></li>
        <li><span>Exposure for ≤ 1 px blur</span><strong>≤ {fmt(maxExposureUs(speed, mmpp, 1), 0)} µs</strong><em>at this speed and scale</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite">
        <span>
          {blur > 1.5 ? <><strong>Motion blur:</strong> edges along the motion smear over {fmt(blur, 0)} px. </> : <><strong>Sharp enough</strong> for this scale. </>}
          {eWhite >= FULL_WELL ? <><strong>White areas saturate.</strong> </> : eGray < 600 ? <><strong>Too little light:</strong> noisy and dark. </> : null}
          Shorter exposure stops motion but collects less light.
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
