"use client";

import { useState } from "react";
import { budget, pipelined, sequential, type Stage } from "@/lib/budget-ops";

const COLORS = ["#1f6feb", "#8250df", "#2da44e", "#bf8700", "#cf222e"];
const START: Stage[] = [{ name: "capture + convert", ms: 4 }, { name: "preprocess", ms: 6 }, { name: "detect", ms: 18 }, { name: "measure", ms: 3 }, { name: "save / display", ms: 12 }];

/** BudgetLab: stage times vs the frame budget; sequential loop vs a pipeline of threads. */
export function BudgetLab({ caption }: { caption?: string }) {
  const [fps, setFps] = useState(30);
  const [st, setSt] = useState<Stage[]>(START);
  const b = budget(fps), s = sequential(st), p = pipelined(st);
  const scale = Math.max(s.latency, b) * 1.05;
  return (
    <figure className="fig budgetlab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Camera frame rate <output>{fps} fps</output></span><input type="range" min={5} max={120} value={fps} onChange={(e) => setFps(Number(e.target.value))} aria-label="Frame rate" /></label>
        {st.map((x, i) => (
          <label key={x.name} className="ctl ctl-wide"><span><i className="bu-dot" style={{ background: COLORS[i] }} /> {x.name} <output>{x.ms} ms</output></span>
            <input type="range" min={0} max={60} value={x.ms} onChange={(e) => setSt(st.map((y, k) => (k === i ? { ...y, ms: Number(e.target.value) } : y)))} aria-label={x.name} /></label>
        ))}
      </div>
      <div className="bu-bar" role="img" aria-label={`Stages add up to ${s.latency} ms; budget ${b.toFixed(1)} ms`}>
        {st.map((x, i) => <span key={x.name} style={{ width: `${(100 * x.ms) / scale}%`, background: COLORS[i] }} title={`${x.name}: ${x.ms} ms`} />)}
        <i className="bu-limit" style={{ left: `${(100 * b) / scale}%` }} />
      </div>
      <div className="gl-legend">Black line: the frame budget ({b.toFixed(1)} ms per frame at {fps} fps).</div>
      <ul className="ap-stats">
        <li><span>One loop, stages in a row</span><strong>{s.fps.toFixed(1)} fps</strong><em>latency {s.latency} ms · {s.latency <= b ? "fits the budget" : "too slow: frames are dropped or queue up"}</em></li>
        <li><span>Pipeline (one thread per stage)</span><strong>{p.fps === Infinity ? "∞" : p.fps.toFixed(1)} fps</strong><em>latency still {p.latency} ms · bottleneck: {p.bottleneck}</em></li>
      </ul>
      <div className="pg-readout"><span>Throughput (frames per second) and latency (time from capture to result) are different. A pipeline raises throughput to 1 / slowest stage, but every frame still takes the sum of all stages. Speed up the bottleneck first.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
