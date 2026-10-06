"use client";

import { useState } from "react";
import { frameBytes, linkBytesPerSec } from "@/lib/size-ops";
import { fmt } from "@/lib/scale-ops";

const RES = [[640, 480], [1920, 1080], [2448, 2048], [4096, 3000], [5472, 3648]];
const LINKS = [{ name: "GigE", bps: 1e9 }, { name: "2.5GigE", bps: 2.5e9 }, { name: "5GigE", bps: 5e9 }, { name: "10GigE", bps: 10e9 }];

/** SizeCalc: resolution, channels, bit depth and frame rate → bytes per frame, data rate, link load and storage. */
export function SizeCalc({ caption }: { caption?: string }) {
  const [ri, setRi] = useState(2);
  const [ch, setCh] = useState(1);
  const [bits, setBits] = useState(8);
  const [fps, setFps] = useState(10);
  const [li, setLi] = useState(0);
  const [w, h] = RES[ri];
  const fb = frameBytes(w, h, ch, bits);
  const rate = fb * fps;
  const cap = linkBytesPerSec(LINKS[li].bps);
  const load = rate / cap;

  return (
    <figure className="fig sizecalc">
      <div className="sc-ctl">
        <Seg label="Resolution" options={RES.map(([a, b]) => `${a} × ${b}`)} value={ri} onChange={setRi} />
        <Seg label="Channels" options={["1 (mono)", "3 (colour)"]} value={ch === 1 ? 0 : 1} onChange={(k) => setCh(k ? 3 : 1)} />
        <Seg label="Bit depth" options={["8", "10", "12", "16"]} value={[8, 10, 12, 16].indexOf(bits)} onChange={(k) => setBits([8, 10, 12, 16][k])} />
        <Seg label="Link" options={LINKS.map((l) => l.name)} value={li} onChange={setLi} />
        <label className="ctl ctl-wide">
          <span>Frame rate <output>{fps} fps</output></span>
          <input type="range" min={1} max={120} step={1} value={fps} onChange={(e) => setFps(Number(e.target.value))} aria-label="Frames per second" />
        </label>
      </div>
      <ul className="ap-stats">
        <li><span>Per frame</span><strong>{fmt(fb / 1e6, 2)} MB</strong><em>{w} × {h} × {ch} × {bits <= 8 ? 1 : 2} B</em></li>
        <li><span>Data rate</span><strong>{fmt(rate / 1e6, 0)} MB/s</strong><em>{fps} fps</em></li>
        <li><span>Link load</span><strong className={load > 1 ? "sz-over" : ""}>{fmt(load * 100, 0)} %</strong><em>of ≈ {Math.floor(cap / 1e6)} MB/s</em></li>
        <li><span>Storage</span><strong>{fmt((rate * 3600) / 1e9, 0)} GB/h</strong><em>{fmt((rate * 86400) / 1e12, 2)} TB/day</em></li>
      </ul>
      <div className="sz-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, load * 100)}%` }} className={load > 1 ? "is-over" : load > 0.8 ? "is-high" : ""} /></div>
      <div className="pg-readout" aria-live="polite"><span>{load > 1 ? <><strong>Too much for this link.</strong> Lower the frame rate, use a region of interest, 8 bits, mono, or a faster link.</> : load > 0.8 ? "Close to the link's limit: frames may be dropped under load." : "Fits comfortably."} Uncompressed sizes; the link payload assumes about 90 % of the raw bit rate.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Seg({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (k: number) => void }) {
  return (
    <div className="ctl ctl-full">
      <span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {options.map((o, k) => <button key={o} type="button" role="radio" aria-checked={value === k} className={value === k ? "is-on" : ""} onClick={() => onChange(k)}>{o}</button>)}
      </div>
    </div>
  );
}
