"use client";

import { useEffect, useRef, useState } from "react";
import { gauss, rng } from "@/lib/sensor-ops";
import { shading, srgbDecode, srgbEncode } from "@/lib/isp-ops";

const STEPS = [
  { key: "black", label: "Black level" },
  { key: "shading", label: "Lens shading" },
  { key: "wb", label: "White balance" },
  { key: "gamma", label: "Gamma (sRGB)" },
  { key: "denoise", label: "Noise reduction" },
  { key: "sharpen", label: "Sharpening" },
] as const;
type Key = (typeof STEPS)[number]["key"];
const SENS = [0.55, 1.0, 0.7];
const BLACK = 16 / 255;

/** IspLab: turn the camera's processing steps on and off and see the image change. */
export function IspLab({ caption }: { caption?: string }) {
  const [on, setOn] = useState<Record<Key, boolean>>({ black: true, shading: true, wb: true, gamma: true, denoise: false, sharpen: false });
  const canvas = useRef<HTMLCanvasElement>(null);
  const raw = useRef<{ d: Float32Array; w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const src = ctx.getImageData(0, 0, img.width, img.height).data;
      const w = img.width, h = img.height, d = new Float32Array(w * h * 3), r = rng(28);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const r2 = ((x - w / 2) ** 2 + (y - h / 2) ** 2) / ((w / 2) ** 2 + (h / 2) ** 2);
        for (let ch = 0; ch < 3; ch++) {
          const lin = srgbDecode(src[(y * w + x) * 4 + ch] / 255);
          d[(y * w + x) * 3 + ch] = lin * SENS[ch] * shading(r2) + BLACK + 0.006 * gauss(r);
        }
      }
      raw.current = { d, w, h };
      setReady(true);
    };
    img.src = "/images/sample-color.png";
  }, []);

  useEffect(() => {
    const cv = canvas.current, s = raw.current;
    if (!cv || !s || !ready) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { w, h } = s;
    let a = Float32Array.from(s.d);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const r2 = ((x - w / 2) ** 2 + (y - h / 2) ** 2) / ((w / 2) ** 2 + (h / 2) ** 2);
      for (let ch = 0; ch < 3; ch++) {
        const i = (y * w + x) * 3 + ch;
        let v = a[i];
        if (on.black) v -= BLACK;
        if (on.shading) v /= shading(r2);
        if (on.wb) v /= SENS[ch];
        a[i] = v;
      }
    }
    const box = (src: Float32Array) => {
      const o = new Float32Array(src.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let ch = 0; ch < 3; ch++) {
        let sum = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const yy = Math.min(h - 1, Math.max(0, y + dy)), xx = Math.min(w - 1, Math.max(0, x + dx));
          sum += src[(yy * w + xx) * 3 + ch]; n++;
        }
        o[(y * w + x) * 3 + ch] = sum / n;
      }
      return o;
    };
    if (on.gamma) for (let i = 0; i < a.length; i++) a[i] = srgbEncode(Math.max(0, a[i]));
    if (on.denoise) a = box(a);
    if (on.sharpen) { const b = box(a); for (let i = 0; i < a.length; i++) a[i] = a[i] + 1.2 * (a[i] - b[i]); }
    const out = ctx.createImageData(w, h);
    for (let p = 0, q = 0; p < a.length; p += 3, q += 4) {
      out.data[q] = Math.round(Math.min(1, Math.max(0, a[p])) * 255);
      out.data[q + 1] = Math.round(Math.min(1, Math.max(0, a[p + 1])) * 255);
      out.data[q + 2] = Math.round(Math.min(1, Math.max(0, a[p + 2])) * 255);
      out.data[q + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, on]);

  return (
    <figure className="fig isplab">
      <div className="isp-steps" role="group" aria-label="ISP steps">
        <span className="isp-raw">Raw sensor data</span>
        {STEPS.map((s) => (
          <label key={s.key} className={on[s.key] ? "isp-step is-on" : "isp-step"}>
            <input type="checkbox" checked={on[s.key]} onChange={() => setOn({ ...on, [s.key]: !on[s.key] })} />
            {s.label}
          </label>
        ))}
        <span className="isp-raw">Image you receive</span>
      </div>
      <canvas ref={canvas} width={320} height={200} className="sl-canvas" role="img" aria-label="Simulated camera output with the chosen processing steps" />
      <div className="pg-readout"><span>Turn all steps off to see roughly what the sensor delivers: dark, green-tinted, darker corners, slightly noisy. (Demosaicing, 2.7, is assumed done.)</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
