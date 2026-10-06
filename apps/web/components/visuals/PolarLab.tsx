"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { unwrapPolar } from "@/lib/warp-ops";

const S = 240, AB = 720, RB = 110;

function useGray(src: string) {
  const [d, setD] = useState<Uint8Array | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = S; c.height = S;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, S, S).data, out = new Uint8Array(S * S);
      for (let i = 0; i < out.length; i++) out[i] = p[4 * i];
      setD(out);
    };
    img.src = src;
  }, [src]);
  return d;
}

/** PolarLab (16.5): unwrap text printed around a ring into a straight strip (cv2.warpPolar); move the centre off to see the strip wave, switch to log-polar. */
export function PolarLab({ caption }: { caption?: string }) {
  const img = useGray("/images/sample-ring-text.png");
  const [dx, setDx] = useState(0), [dy, setDy] = useState(0), [log, setLog] = useState(false);
  const strip = useMemo(() => (img ? unwrapPolar(img, S, S, 120 + dx, 120 + dy, 110, AB, RB, log) : null), [img, dx, dy, log]);
  const inRef = useRef<HTMLCanvasElement>(null), outRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = inRef.current?.getContext("2d"); if (!ctx || !img) return;
    const im = ctx.createImageData(S, S);
    for (let i = 0; i < S * S; i++) im.data.set([img[i], img[i], img[i], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
    ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(120 + dx, 120 + dy, 110, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(120 + dx - 6, 120 + dy); ctx.lineTo(126 + dx, 120 + dy); ctx.moveTo(120 + dx, 114 + dy); ctx.lineTo(120 + dx, 126 + dy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(120 + dx, 120 + dy); ctx.lineTo(230 + dx, 120 + dy); ctx.stroke(); // angle 0
  }, [img, dx, dy]);
  useEffect(() => {
    const ctx = outRef.current?.getContext("2d"); if (!ctx || !strip) return;
    const im = ctx.createImageData(AB, RB);
    for (let i = 0; i < AB * RB; i++) im.data.set([strip[i], strip[i], strip[i], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
  }, [strip]);
  const sl = (label: string, v: number, set: (n: number) => void) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v} px</output></span><input type="range" min={-15} max={15} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  return (
    <figure className="fig polarlab">
      <div className="pz-grid">
        <canvas ref={inRef} width={S} height={S} className="pz-in" role="img" aria-label="Ring with text and the unwrapping circle" />
        <div className="sc-ctl">
          {sl("centre error x", dx, setDx)}
          {sl("centre error y", dy, setDy)}
          <div className="ctl ctl-full"><span>Radius axis</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Radius axis">
              {[false, true].map((v) => <button key={String(v)} type="button" role="radio" aria-checked={log === v} className={log === v ? "is-on" : ""} onClick={() => setLog(v)}>{v ? "log-polar" : "linear"}</button>)}
            </div>
          </div>
          <pre className="pz-code"><code>{`u = cv2.warpPolar(img, (${RB}, ${AB}), (${120 + dx}, ${120 + dy}), 110,\n                  cv2.WARP_POLAR_${log ? "LOG" : "LINEAR"} + cv2.INTER_LINEAR)\nstrip = cv2.rotate(u, cv2.ROTATE_90_COUNTERCLOCKWISE)`}</code></pre>
        </div>
      </div>
      <div className="pz-strip"><canvas ref={outRef} width={AB} height={RB} className="pz-out" role="img" aria-label="Unwrapped strip" /></div>
      <p className="pz-cap">Unwrapped: left to right = angle, clockwise from the magenta line (0° to 360°); top = outer radius 110 px, bottom = centre.</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
