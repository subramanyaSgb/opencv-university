"use client";

import { useState } from "react";
import { simulate } from "@/lib/capture-sim";

const W = 480, H = 150, SECONDS = 5;

/** CaptureLab: camera frame rate vs processing time; buffered reading vs always taking the newest frame. */
export function CaptureLab({ caption }: { caption?: string }) {
  const [fps, setFps] = useState(25);
  const [proc, setProc] = useState(80);
  const [buf, setBuf] = useState(4);
  const a = simulate(fps, proc, buf, "buffer", SECONDS);
  const b = simulate(fps, proc, buf, "latest", SECONDS);
  const maxL = Math.max(a.maxLatency, b.maxLatency, 1);
  const line = (lat: number[]) => lat.map((l, i) => `${(i / Math.max(1, lat.length - 1)) * W},${H - (l / maxL) * (H - 10)}`).join(" ");
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, unit: string) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v} {unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  const slow = proc > 1000 / fps;
  return (
    <figure className="fig capturelab">
      <div className="sc-ctl">
        {sl("Camera frame rate", fps, setFps, 5, 60, 1, "fps")}
        {sl("Processing time per frame", proc, setProc, 5, 200, 5, "ms")}
        {sl("Driver / stream buffer", buf, setBuf, 1, 10, 1, "frames")}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} className="cl-svg" role="img" aria-label="Latency of each processed frame for the two strategies">
        <line x1={0} x2={W} y1={H} y2={H} className="ov-lim" />
        <polyline points={line(a.latency)} className="cl-buf" />
        <polyline points={line(b.latency)} className="cl-new" />
        <text x={2} y={12} className="ov-t">{maxL.toFixed(0)} ms</text>
        <text x={W / 2} y={H + 13} textAnchor="middle" className="ov-t">processed frames over {SECONDS} s →</text>
      </svg>
      <div className="gl-legend"><span className="by-k" style={{ background: "#cf222e" }} /> plain read() loop (buffer) <span className="by-k" style={{ background: "#2da44e" }} /> reader thread keeps the newest frame</div>
      <ul className="ap-stats">
        <li><span>Frame period / processing</span><strong>{(1000 / fps).toFixed(0)} / {proc} ms</strong><em>{slow ? "processing is slower than the camera" : "processing keeps up"}</em></li>
        <li><span>read() loop</span><strong>{a.meanLatency.toFixed(0)} ms</strong><em>mean latency, max {a.maxLatency.toFixed(0)} ms, {a.dropped} frames dropped</em></li>
        <li><span>newest-frame thread</span><strong>{b.meanLatency.toFixed(0)} ms</strong><em>mean latency, max {b.maxLatency.toFixed(0)} ms, {b.dropped} frames skipped</em></li>
      </ul>
      <div className="pg-readout"><span>Latency = time from capture to the end of processing. When processing is slower than the camera, a plain loop works on old frames from the buffer; reading in a separate thread and processing only the newest frame keeps the system reacting to the present (it skips frames instead).</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
