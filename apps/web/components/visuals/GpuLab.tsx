"use client";

import { useState } from "react";
import { offload } from "@/lib/gpu-ops";

const BW = [
  { v: 3, l: "3 GB/s (PCIe 3.0 x4)" },
  { v: 12, l: "12 GB/s (PCIe 3.0 x16)" },
  { v: 25, l: "25 GB/s (PCIe 4.0 x16)" },
];

/** GpuLab: CPU time vs GPU time including upload and download; how many chained operations pay for the transfers. */
export function GpuLab({ caption, integrated = false }: { caption?: string; integrated?: boolean }) {
  const buses = integrated ? [...BW, { v: Infinity, l: "integrated GPU (shared memory)" }] : BW;
  const [mp, setMp] = useState(5);
  const [ch, setCh] = useState(3);
  const [bw, setBw] = useState(12);
  const [cpuMs, setCpuMs] = useState(2);
  const [sp, setSp] = useState(10);
  const [ops, setOps] = useState(1);
  const [small, setSmall] = useState(false);
  const r = offload({ mp, channels: ch, bw, cpuMs, speedup: sp, ops, smallResult: small });
  const max = Math.max(r.cpu, r.gpu, 0.001);
  const pct = (x: number) => `${(100 * x) / max}%`;
  return (
    <figure className="fig gpulab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Image <output>{mp} MP</output></span><input type="range" min={0.3} max={20} step={0.1} value={mp} onChange={(e) => setMp(Number(e.target.value))} aria-label="Megapixels" /></label>
        <label className="ctl ctl-wide"><span>CPU time per operation <output>{cpuMs} ms</output></span><input type="range" min={0.1} max={30} step={0.1} value={cpuMs} onChange={(e) => setCpuMs(Number(e.target.value))} aria-label="CPU ms per op" /></label>
        <label className="ctl ctl-wide"><span>GPU speed-up of the operation <output>{sp}×</output></span><input type="range" min={1} max={50} value={sp} onChange={(e) => setSp(Number(e.target.value))} aria-label="GPU speed-up" /></label>
        <label className="ctl ctl-wide"><span>Operations chained on the GPU <output>{ops}</output></span><input type="range" min={1} max={12} value={ops} onChange={(e) => setOps(Number(e.target.value))} aria-label="Chained operations" /></label>
        <div className="ctl ctl-full"><span>Channels</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Channels">
            {[1, 3].map((c) => <button key={c} type="button" role="radio" aria-checked={ch === c} className={ch === c ? "is-on" : ""} onClick={() => setCh(c)}>{c === 1 ? "mono" : "colour"}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Bus</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Bus bandwidth">
            {buses.map((b) => <button key={b.v} type="button" role="radio" aria-checked={bw === b.v} className={bw === b.v ? "is-on" : ""} onClick={() => setBw(b.v)}>{b.l}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Back to the CPU</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Result size">
            {([[false, "the full image"], [true, "a small result"]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={small === k} className={small === k ? "is-on" : ""} onClick={() => setSmall(k)}>{l}</button>)}
          </div>
        </div>
      </div>
      <div className="gp-bars" aria-hidden="true">
        <div className="gp-row"><span>CPU</span><div className="gp-track"><i className="gp-cpu" style={{ width: pct(r.cpu) }} /></div><b>{r.cpu.toFixed(2)} ms</b></div>
        <div className="gp-row"><span>GPU</span><div className="gp-track">
          <i className="gp-up" style={{ width: pct(r.up) }} /><i className="gp-k" style={{ width: pct(r.compute) }} /><i className="gp-down" style={{ width: pct(r.down) }} />
        </div><b>{r.gpu.toFixed(2)} ms</b></div>
      </div>
      <div className="gl-legend gp-legend"><span><i className="gp-cpu" /> CPU work</span><span><i className="gp-up" /> upload</span><span><i className="gp-k" /> GPU kernels</span><span><i className="gp-down" /> download</span></div>
      <ul className="ap-stats">
        <li><span>Transfers</span><strong>{(r.up + r.down).toFixed(2)} ms</strong><em>upload {r.up.toFixed(2)} + download {r.down.toFixed(2)}</em></li>
        <li><span>Winner</span><strong className={r.gpu < r.cpu ? "gp-win" : ""}>{r.gpu < r.cpu ? `GPU, ${r.ratio.toFixed(1)}× faster` : `CPU, ${(1 / r.ratio).toFixed(1)}× faster`}</strong><em>for {ops} chained operation{ops > 1 ? "s" : ""}</em></li>
        <li><span>Break-even</span><strong>{Number.isFinite(r.breakEven) ? `${r.breakEven} op${r.breakEven > 1 ? "s" : ""}` : "never"}</strong><em>operations needed before the GPU pays for its transfers</em></li>
      </ul>
      <div className="pg-readout"><span>Each GPU operation also costs a fixed 0.05 ms here (launch and synchronisation). Keep data on the GPU across several operations and bring back only what you need.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
