"use client";

import { useMemo, useState } from "react";
import { damaged, pattern } from "@/lib/gop-ops";

const N = 36;

/** Deterministic pseudo-random loss pattern (seeded), so the same slider value always
 *  shows the same frames lost -- illustrative only, not measured network data (the real,
 *  measured loopback RTP numbers are in the chapter's Code section). */
function lostFrames(n: number, ratePercent: number, seed: number): Set<number> {
  const out = new Set<number>();
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    if ((s % 1000) / 1000 < ratePercent / 100) out.add(i);
  }
  return out;
}

/** RtspLab (Module 39.2): illustrative UDP-vs-TCP-interleaved RTSP transport --
 *  packet loss damaging frames until the next I-frame (UDP) vs no loss but more
 *  latency (TCP interleaved), reusing 4.5's GOP damage model (lib/gop-ops.ts). */
export function RtspLab({ caption }: { caption?: string }) {
  const [transport, setTransport] = useState<"udp" | "tcp">("udp");
  const [gop, setGop] = useState(12);
  const [lossRate, setLossRate] = useState(4);

  const types = useMemo(() => pattern(N, gop, 0), [gop]);
  const lost = useMemo(() => (transport === "udp" ? lostFrames(N, lossRate, 7) : new Set<number>()), [transport, lossRate]);
  const damagedSet = useMemo(() => {
    const all = new Set<number>();
    lost.forEach((i) => damaged(types, i).forEach((j) => all.add(j)));
    return all;
  }, [lost, types]);

  const usable = N - damagedSet.size;
  const latencyMs = transport === "udp" ? 40 : 180;

  return (
    <figure className="fig rtsplab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Transport (what RTSP's SETUP negotiates)</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Transport">
            {([["udp", "RTP over UDP"], ["tcp", "RTP interleaved over TCP"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={transport === k} className={transport === k ? "is-on" : ""} onClick={() => setTransport(k)}>{l}</button>
            ))}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>I-frame every <output>{gop}</output> frames</span>
          <input type="range" min={1} max={30} value={gop} onChange={(e) => setGop(Number(e.target.value))} aria-label="GOP length" />
        </label>
        <label className="ctl ctl-wide"><span>Simulated packet loss <output>{transport === "udp" ? `${lossRate}%` : "0% (reliable)"}</output></span>
          <input type="range" min={0} max={20} value={lossRate} disabled={transport === "tcp"} onChange={(e) => setLossRate(Number(e.target.value))} aria-label="Packet loss rate" />
        </label>
      </div>
      <div className="gl-strip" role="group" aria-label="Frames in display order">
        {types.map((t, i) => (
          <div key={i} className={`gl-frame gl-${t}${damagedSet.has(i) ? " gl-bad" : ""}${lost.has(i) ? " gl-lost" : ""}`}
            aria-label={`frame ${i}, ${t}-frame${lost.has(i) ? ", packet lost" : damagedSet.has(i) ? ", damaged by an earlier loss" : ""}`}>
            <span className="gl-t">{t}</span>
          </div>
        ))}
      </div>
      <div className="gl-legend"><span className="gl-key gl-I">I</span> intra <span className="gl-key gl-P">P</span> predicted <span style={{ outline: "2px dashed #cf222e", outlineOffset: "-2px", padding: "0 0.3rem" }}>dashed</span> packet lost <span className="gl-bad" style={{ padding: "0 0.3rem" }}>pink</span> damaged as a result</div>
      <ul className="ap-stats">
        <li><span>Usable frames</span><strong>{usable} / {N}</strong><em>{damagedSet.size === 0 ? "no damage" : `${damagedSet.size} damaged until the next I-frame`}</em></li>
        <li><span>Typical added latency</span><strong>~{latencyMs} ms</strong><em>{transport === "udp" ? "low -- drops a late packet rather than waiting for it" : "higher -- TCP retransmits and waits, in order"}</em></li>
      </ul>
      <div className="pg-readout"><span>Loss pattern and the latency figures are illustrative, not measured. This chapter&apos;s own Code section measures a real loopback RTP/UDP stream instead, where loopback has effectively zero loss.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
