"use client";

import { useMemo, useState } from "react";

const W = 480, H = 160, SECONDS = 40;

/** Nearest-timestamp frame matching: for each frame of A, the time difference to the
 *  closest frame of B. The same algorithm this chapter verified with NumPy. */
function syncErrors(fpsA: number, fpsB: number, phaseMs: number, seconds: number) {
  const nA = Math.floor(seconds * fpsA);
  const tA = Array.from({ length: nA }, (_, i) => (i / fpsA) * 1000);
  const nB = Math.floor(seconds * fpsB) + 2;
  const tB = Array.from({ length: nB }, (_, i) => phaseMs + (i / fpsB) * 1000);
  return tA.map((ta) => {
    let best = tB[0], bestDiff = Math.abs(tB[0] - ta);
    for (const tb of tB) {
      const d = Math.abs(tb - ta);
      if (d < bestDiff) { bestDiff = d; best = tb; }
    }
    return best - ta;
  });
}

/** SyncLab (Module 39.6): hardware trigger (zero error, always) vs free-running cameras
 *  matched by nearest timestamp -- the same real drift/sync-error algorithm this chapter
 *  verified with NumPy, run live here as fpsB/phase change. */
export function SyncLab({ caption }: { caption?: string }) {
  const [mode, setMode] = useState<"trigger" | "free">("free");
  const [fpsB, setFpsB] = useState(25.025);
  const [phase, setPhase] = useState(0);

  const errors = useMemo(() => (mode === "trigger" ? Array(1000).fill(0) : syncErrors(25, fpsB, phase, SECONDS)), [mode, fpsB, phase]);
  const maxAbs = Math.max(1, ...errors.map((e) => Math.abs(e)));
  const line = errors.map((e, i) => `${(i / Math.max(1, errors.length - 1)) * W},${H / 2 - (e / maxAbs) * (H / 2 - 10)}`).join(" ");
  const meanAbs = errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length;

  return (
    <figure className="fig synclab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Camera sync method</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Sync method">
            {([["trigger", "Hardware trigger (shared signal)"], ["free", "Free-running, matched by nearest timestamp"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={mode === k} className={mode === k ? "is-on" : ""} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Camera B's real fps (A is fixed at 25.000) <output>{fpsB.toFixed(3)}</output></span>
          <input type="range" min={24.9} max={25.1} step={0.005} value={fpsB} disabled={mode === "trigger"} onChange={(e) => setFpsB(Number(e.target.value))} aria-label="Camera B fps" />
        </label>
        <label className="ctl ctl-wide"><span>Starting phase offset <output>{phase} ms</output></span>
          <input type="range" min={0} max={20} value={phase} disabled={mode === "trigger"} onChange={(e) => setPhase(Number(e.target.value))} aria-label="Phase offset" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Sync error over 40 seconds">
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="ov-lim" />
        <polyline points={line} className="cl-buf" />
        <text x={2} y={12} className="ov-t">+{maxAbs.toFixed(1)} ms</text>
        <text x={2} y={H - 4} className="ov-t">-{maxAbs.toFixed(1)} ms</text>
        <text x={W / 2} y={H - 4} textAnchor="middle" className="ov-t">{SECONDS} s of free-running operation &rarr;</text>
      </svg>
      <ul className="ap-stats">
        <li><span>Mean |sync error|</span><strong>{meanAbs.toFixed(2)} ms</strong><em>{mode === "trigger" ? "always zero: every camera starts exposure on the same signal" : "grows with fps mismatch and elapsed time"}</em></li>
      </ul>
      <div className="pg-readout"><span>A real 0.1% fps mismatch (25.000 vs 25.025) drifts to about 40 ms of error after 40 real seconds -- this chapter's own verified NumPy result. Hardware trigger and PTP (Go deeper) avoid this drift entirely, by sharing one clock instead of matching two independent ones after the fact.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
