"use client";

import { useState } from "react";

// Reorder delay is REAL, measured in this chapter (ffprobe DTS vs PTS, 25 fps clip):
// bf=0 -> 0 ms, bf=1 -> 40 ms, bf=2 -> 80 ms (= bf x frame period, exactly).
const REORDER_MS: Record<string, number> = { "0": 0, "1": 40, "2": 80 };
// Decode throughput is REAL, measured in 39.4 on the same machine (1080p/60s clip).
const DECODE_FPS: Record<string, number> = { software: 210.7, hardware: 77.3 };

const STAGE_COLOR = ["#1f6feb", "#bf8700", "#8250df", "#2da44e"];

/** LatencyBudgetLab (Module 39.5): stacks a real encoder reorder delay (this chapter) and a
 *  real decode time (39.4) with two illustrative, slider-driven stages (network/jitter buffer,
 *  application processing) into one total end-to-end latency, against a target budget. */
export function LatencyBudgetLab({ caption }: { caption?: string }) {
  const [bf, setBf] = useState("1");
  const [decode, setDecode] = useState<"software" | "hardware">("software");
  const [network, setNetwork] = useState(60);
  const [processing, setProcessing] = useState(50);
  const [target, setTarget] = useState(500);

  const reorder = REORDER_MS[bf];
  const decodeMs = 1000 / DECODE_FPS[decode];
  const stages = [
    { label: "Encoder reorder delay (real, measured)", ms: reorder },
    { label: `Decode (real, 39.4: ${decode})`, ms: decodeMs },
    { label: "Network / jitter buffer (illustrative)", ms: network },
    { label: "Application processing (illustrative)", ms: processing },
  ];
  const total = stages.reduce((s, x) => s + x.ms, 0);
  const maxScale = Math.max(target, total) * 1.1;

  return (
    <figure className="fig latencylab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>B-frames per GOP (reorder delay -- real, measured)</span>
          <div className="seg seg-small" role="radiogroup" aria-label="B-frames">
            {["0", "1", "2"].map((k) => (
              <button key={k} type="button" role="radio" aria-checked={bf === k} className={bf === k ? "is-on" : ""} onClick={() => setBf(k)}>{k} ({REORDER_MS[k]} ms)</button>
            ))}
          </div>
        </div>
        <div className="ctl ctl-full">
          <span>Decode mode (real fps, from 39.4)</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Decode mode">
            {(["software", "hardware"] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={decode === k} className={decode === k ? "is-on" : ""} onClick={() => setDecode(k)}>{k} ({DECODE_FPS[k]} fps)</button>
            ))}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Network / jitter buffer (illustrative) <output>{network} ms</output></span>
          <input type="range" min={0} max={300} value={network} onChange={(e) => setNetwork(Number(e.target.value))} aria-label="Network latency" />
        </label>
        <label className="ctl ctl-wide"><span>Application processing (illustrative) <output>{processing} ms</output></span>
          <input type="range" min={0} max={300} value={processing} onChange={(e) => setProcessing(Number(e.target.value))} aria-label="Processing time" />
        </label>
        <label className="ctl ctl-wide"><span>Target budget <output>{target} ms</output></span>
          <input type="range" min={100} max={1000} step={50} value={target} onChange={(e) => setTarget(Number(e.target.value))} aria-label="Target latency budget" />
        </label>
      </div>
      <div style={{ display: "flex", height: "2.2rem", width: "100%", border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden" }} role="img" aria-label="Stacked latency by stage">
        {stages.map((s, i) => (
          <div key={s.label} style={{ width: `${(s.ms / maxScale) * 100}%`, background: STAGE_COLOR[i] }} title={`${s.label}: ${s.ms.toFixed(1)} ms`} />
        ))}
      </div>
      <div style={{ position: "relative", height: "0.6rem" }}>
        <div style={{ position: "absolute", left: `${(target / maxScale) * 100}%`, top: 0, bottom: 0, width: "2px", background: "#cf222e" }} title={`target: ${target} ms`} />
      </div>
      <ul className="ap-stats">
        <li><span>Total latency</span><strong style={{ color: total <= target ? "#2da44e" : "#cf222e" }}>{total.toFixed(1)} ms</strong><em>{total <= target ? "within budget" : "over budget"} (target {target} ms, red line above)</em></li>
      </ul>
      <div className="gl-legend">
        {stages.map((s, i) => <span key={s.label}><span className="gl-key" style={{ background: STAGE_COLOR[i] }}>&nbsp;</span> {s.label.split(" (")[0]}</span>)}
      </div>
      <div className="pg-readout"><span>Reorder delay and decode time are this course&apos;s own real, measured numbers; network and processing are illustrative sliders, since they depend entirely on your own network and code.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
