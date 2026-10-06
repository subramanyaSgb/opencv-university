"use client";

import { useState } from "react";
import { heapAfter, frameBytes } from "@/lib/jsmem-ops";

const SIZES = [
  { l: "320 × 240", w: 320, h: 240 },
  { l: "640 × 480", w: 640, h: 480 },
  { l: "1280 × 720", w: 1280, h: 720 },
];

/** JsMemLab: OpenCV.js Mats live in the WebAssembly heap; forget mat.delete() and memory grows every frame. */
export function JsMemLab({ caption }: { caption?: string }) {
  const [si, setSi] = useState(1);
  const [mats, setMats] = useState(3);
  const [del, setDel] = useState(false);
  const [sec, setSec] = useState(10);
  const fps = 30;
  const p = { ...SIZES[si], channels: 4, matsPerFrame: mats, deleted: del, fps, heapLimitMB: 2048 };
  const r = heapAfter(p, sec * fps);
  const pct = Math.min(100, (r.usedMB / p.heapLimitMB) * 100);
  return (
    <figure className="fig jsmemlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Video frame (RGBA)</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Frame size">
            {SIZES.map((s, i) => <button key={s.l} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{s.l}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>New Mats per frame <output>{mats}</output></span><input type="range" min={1} max={8} value={mats} onChange={(e) => setMats(Number(e.target.value))} aria-label="Mats per frame" /></label>
        <label className="ctl ctl-wide"><span>Running for <output>{sec} s</output></span><input type="range" min={1} max={120} value={sec} onChange={(e) => setSec(Number(e.target.value))} aria-label="Seconds" /></label>
        <div className="ctl ctl-full"><span>After each frame</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Delete Mats">
            {([[false, "forget delete()"], [true, "call mat.delete()"]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={del === k} className={del === k ? "is-on" : ""} onClick={() => setDel(k)}>{l}</button>)}
          </div>
        </div>
      </div>
      <div className="jm-heap" aria-hidden="true"><i className={r.over ? "is-over" : ""} style={{ width: `${pct}%` }} /></div>
      <div className="jm-scale"><span>0</span><span>WebAssembly heap limit (here 2 GB)</span></div>
      <ul className="ap-stats">
        <li><span>Per frame</span><strong>{(frameBytes(p) / 1048576).toFixed(1)} MB</strong><em>{mats} × {p.w} × {p.h} × 4 bytes</em></li>
        <li><span>Heap after {sec} s at {fps} fps</span><strong className={r.over ? "bl-bad" : ""}>{r.over ? "out of memory" : `${r.usedMB.toFixed(0)} MB`}</strong><em>{del ? "flat: the same memory is reused" : "grows every frame"}</em></li>
        <li><span>Tab crashes after</span><strong>{Number.isFinite(r.secondsToLimit) ? `${r.secondsToLimit.toFixed(0)} s` : "never"}</strong><em>{Number.isFinite(r.framesToLimit) ? `${r.framesToLimit} frames` : "memory is released"}</em></li>
      </ul>
      <div className="pg-readout"><span>JavaScript's garbage collector does not see the pixel memory of a cv.Mat: it lives in the WebAssembly heap. Every Mat you create must be deleted.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
