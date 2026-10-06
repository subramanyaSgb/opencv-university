"use client";

import { useEffect, useRef, useState } from "react";
import { FULL_WELL, QE, electrons, gauss, noiseElectrons, poisson, rng, snr, toDN } from "@/lib/sensor-ops";
import { fmt } from "@/lib/scale-ops";

const LIGHT = [50, 150, 500, 1500, 5000, 16000, 30000]; // photons reaching a white pixel per exposure

/**
 * SensorLab: set the light and the gain; see a simulated 8-bit image with shot and read noise,
 * and the numbers behind it. The test chart's white areas receive the chosen photon count.
 */
export function SensorLab({ caption }: { caption?: string }) {
  const [li, setLi] = useState(5);
  const [gain, setGain] = useState(1);
  const [read, setRead] = useState(6);
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = useRef<Uint8ClampedArray | null>(null);
  const [ready, setReady] = useState(false);
  const photons = LIGHT[li];
  const eWhite = electrons(photons);
  const eGray = eWhite * (128 / 255);
  const dnGray = Math.min(255, toDN(eGray, gain));
  const sat = toDN(Math.min(eWhite, FULL_WELL), gain) >= 255 || eWhite > FULL_WELL;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      src.current = ctx.getImageData(0, 0, img.width, img.height).data;
      setReady(true);
    };
    img.src = "/images/sample-pinhole-scene.png";
  }, []);

  useEffect(() => {
    const cv = canvas.current, s = src.current;
    if (!cv || !s || !ready) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const out = ctx.createImageData(cv.width, cv.height);
    const r = rng(1234);
    for (let i = 0; i < s.length; i += 4) {
      const e = Math.min(FULL_WELL, poisson((s[i] / 255) * photons * QE, r)) + read * gauss(r);
      const dn = Math.max(0, Math.min(255, Math.round(toDN(e, gain))));
      out.data[i] = out.data[i + 1] = out.data[i + 2] = dn;
      out.data[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, photons, gain, read]);

  return (
    <figure className="fig sensorlab op">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Light on white</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Photons per exposure on a white pixel">
            {LIGHT.map((v, k) => <button key={v} type="button" role="radio" aria-checked={li === k} className={li === k ? "is-on" : ""} onClick={() => setLi(k)}>{v.toLocaleString("en")}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full">
          <span>Gain</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Gain">
            {[1, 2, 4, 8, 16, 32].map((v) => <button key={v} type="button" role="radio" aria-checked={gain === v} className={gain === v ? "is-on" : ""} onClick={() => setGain(v)}>×{v}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide">
          <span>Read noise <output>{read} e⁻</output></span>
          <input type="range" min={1} max={30} step={1} value={read} onChange={(e) => setRead(Number(e.target.value))} aria-label="Read noise in electrons" />
        </label>
      </div>
      <canvas ref={canvas} width={320} height={200} className="sl-canvas" role="img" aria-label="Simulated 8-bit camera image of the test chart with shot noise and read noise" />
      <ul className="ap-stats">
        <li><span>Mid-gray pixel</span><strong>{fmt(eGray, 0)} e⁻</strong><em>{fmt(dnGray, 0)} DN</em></li>
        <li><span>Noise</span><strong>±{fmt(noiseElectrons(eGray, read), 1)} e⁻</strong><em>shot ±{fmt(Math.sqrt(eGray), 1)}, read ±{read}</em></li>
        <li><span>SNR (mid-gray)</span><strong>{fmt(snr(eGray, read), 1)}</strong><em>gain does not change it</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite">
        <span>
          {sat ? <><strong>Saturated:</strong> the white areas hit 255 and lose detail. </> : null}
          {photons < 1000 && gain >= 8 ? <><strong>Dark image brightened by gain:</strong> it looks bright, but the noise was amplified too. </> : null}
          More light raises the SNR; gain only scales the numbers.
        </span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
