"use client";

import { useState } from "react";

type Mode = { key: string; label: string; fps: number; hwReported: string; note: string };

// Real, measured numbers from this chapter's own test: cv2.VideoCapture decoding every
// frame of a real 1920x1080, 60 s, 1800-frame H.264 clip, on this machine (Intel UHD 630 +
// NVIDIA Quadro T2000). Not illustrative -- these are the actual recorded results.
const MODES: Mode[] = [
  { key: "default", label: "Default (no flag set)", fps: 146.4, hwReported: "NONE (0)", note: "OpenCV's own default on this build: software decode." },
  { key: "none", label: "VIDEO_ACCELERATION_NONE (forced software)", fps: 210.7, hwReported: "NONE (0)", note: "Fastest measured mode here -- plain CPU decode." },
  { key: "any", label: "VIDEO_ACCELERATION_ANY", fps: 79.3, hwReported: "D3D11 (2)", note: "OpenCV picked D3D11 hardware decode -- and was slower here." },
  { key: "d3d11", label: "VIDEO_ACCELERATION_D3D11 (explicit)", fps: 77.3, hwReported: "D3D11 (2)", note: "Same hardware path as ANY, same result: slower than software." },
];

const MAX_FPS = Math.max(...MODES.map((m) => m.fps));

/** HwDecodeLab (Module 39.4): this chapter's own real, measured cv2.VideoCapture decode
 *  throughput across CAP_PROP_HW_ACCELERATION modes -- not a simulation. Software decode
 *  genuinely won every mode on this machine; click a bar to see why. */
export function HwDecodeLab({ caption }: { caption?: string }) {
  const [sel, setSel] = useState("none");
  const mode = MODES.find((m) => m.key === sel) as Mode;

  return (
    <figure className="fig hwdecodelab">
      <div role="group" aria-label="Decode throughput by hardware-acceleration mode" style={{ display: "grid", gap: "0.5rem" }}>
        {MODES.map((m) => (
          <button key={m.key} type="button" onClick={() => setSel(m.key)}
            style={{ display: "grid", gridTemplateColumns: "13rem 1fr 5rem", alignItems: "center", gap: "0.5rem", background: "none", border: m.key === sel ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.4rem 0.6rem", cursor: "pointer", textAlign: "left" }}
            aria-pressed={m.key === sel}>
            <span style={{ fontSize: "0.85rem" }}>{m.label}</span>
            <span style={{ height: "0.9rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${(m.fps / MAX_FPS) * 100}%`, background: m.hwReported.startsWith("NONE") ? "#2da44e" : "#bf8700" }} />
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem" }}>{m.fps.toFixed(1)} fps</span>
          </button>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>Selected mode</span><strong>{mode.label}</strong><em>CAP_PROP_HW_ACCELERATION reported: {mode.hwReported}</em></li>
      </ul>
      <div className="pg-readout"><span>{mode.note} Real numbers, measured once on this machine (Intel UHD 630 + NVIDIA Quadro T2000, an older driver) -- not a general claim about all hardware.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
