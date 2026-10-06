"use client";

import { useMemo, useState } from "react";
import { bitrate, damaged, DEFAULT_SIZE, needed, pattern } from "@/lib/gop-ops";

const N = 36;

/** GopLab: I/P/B frame pattern, bitrate, and what a lost frame or a seek costs. */
export function GopLab({ caption }: { caption?: string }) {
  const [gop, setGop] = useState(12);
  const [b, setB] = useState(0);
  const [iKB, setIKB] = useState(100);
  const [fps, setFps] = useState(25);
  const [mode, setMode] = useState<"lose" | "seek">("lose");
  const [pick, setPick] = useState<number | null>(17);
  const types = useMemo(() => pattern(N, gop, b), [gop, b]);
  const marked = pick === null ? new Set<number>() : mode === "lose" ? damaged(types, pick) : needed(types, pick);
  const rate = bitrate(types, iKB, fps);
  const intra = bitrate(pattern(N, 1, 0), iKB, fps);
  return (
    <figure className="fig goplab">
      <div className="sc-ctl">
        <label className="ctl ctl-wide">
          <span>I-frame every <output>{gop}</output> frames</span>
          <input type="range" min={1} max={30} value={gop} onChange={(e) => setGop(Number(e.target.value))} aria-label="GOP length" />
        </label>
        <div className="ctl">
          <span>B-frames between anchors</span>
          <div className="seg seg-small" role="radiogroup" aria-label="B-frames">
            {[0, 1, 2].map((k) => <button key={k} type="button" role="radio" aria-checked={b === k} className={b === k ? "is-on" : ""} onClick={() => setB(k)}>{k}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide">
          <span>I-frame size <output>{iKB} kB</output></span>
          <input type="range" min={10} max={500} step={10} value={iKB} onChange={(e) => setIKB(Number(e.target.value))} aria-label="I-frame size in kB" />
        </label>
        <label className="ctl ctl-wide">
          <span>Frame rate <output>{fps} fps</output></span>
          <input type="range" min={1} max={60} value={fps} onChange={(e) => setFps(Number(e.target.value))} aria-label="Frames per second" />
        </label>
        <div className="ctl ctl-full">
          <span>Click a frame to</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Click action">
            {([["lose", "lose it (packet loss)"], ["seek", "jump to it (seek)"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={mode === k} className={mode === k ? "is-on" : ""} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="gl-strip" role="group" aria-label="Frames in display order">
        {types.map((t, i) => (
          <button key={i} type="button" className={`gl-frame gl-${t}${marked.has(i) ? (mode === "lose" ? " gl-bad" : " gl-need") : ""}${pick === i ? " gl-pick" : ""}`}
            onClick={() => setPick(pick === i ? null : i)} aria-label={`frame ${i}, ${t}-frame${marked.has(i) ? (mode === "lose" ? ", damaged" : ", must be decoded") : ""}`}>
            <span className="gl-bar" style={{ height: `${DEFAULT_SIZE[t] * 100}%` }} />
            <span className="gl-t">{t}</span>
          </button>
        ))}
      </div>
      <div className="gl-legend"><span className="gl-key gl-I">I</span> intra (a full picture) <span className="gl-key gl-P">P</span> from the previous I/P <span className="gl-key gl-B">B</span> from the previous and next I/P. Bar height = relative size.</div>
      <ul className="ap-stats">
        <li><span>Average bitrate</span><strong>{rate.toFixed(1)} Mbit/s</strong><em>all-intra: {intra.toFixed(1)} Mbit/s ({(intra / rate).toFixed(1)}× more)</em></li>
        <li><span>{mode === "lose" ? "Frames damaged" : "Frames to decode"}</span><strong>{pick === null ? "–" : marked.size}</strong><em>{pick === null ? "click a frame" : mode === "lose" ? `until the next I-frame (${(marked.size / fps).toFixed(2)} s of video)` : `to show frame ${pick}`}</em></li>
      </ul>
      <div className="pg-readout"><span>Assumed sizes: P = {DEFAULT_SIZE.P * 100} % and B = {DEFAULT_SIZE.B * 100} % of an I-frame. Real ratios depend on the encoder, the motion and the noise.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
