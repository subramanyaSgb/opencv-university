"use client";

import { useState } from "react";

type Profile = { key: string; label: string; measured: boolean; note: string; has: Record<string, boolean> };

const BACKENDS = ["FFMPEG", "GSTREAMER", "MSMF", "DSHOW"] as const;

// Only "this-course" is a build this chapter actually measured (Section 3's real
// hasBackend() output). The others are typical/illustrative profiles for well-known
// kinds of OpenCV builds, clearly marked as such -- not individually re-tested here.
const PROFILES: Profile[] = [
  {
    key: "this-course",
    label: "This course's build (opencv-python-headless 4.13.0.92)",
    measured: true,
    note: "Measured directly in this chapter's Code section 2.",
    has: { FFMPEG: true, GSTREAMER: false, MSMF: false, DSHOW: true },
  },
  {
    key: "desktop",
    label: "A typical desktop opencv-python (non-headless) build",
    measured: false,
    note: "Illustrative/typical, not individually measured in this course -- always check hasBackend() on the actual machine.",
    has: { FFMPEG: true, GSTREAMER: false, MSMF: true, DSHOW: true },
  },
  {
    key: "gstreamer-enabled",
    label: "A GStreamer-enabled Linux build (e.g. compiled from source, or Jetson-specific)",
    measured: false,
    note: "Illustrative/typical, not individually measured in this course -- always check hasBackend() on the actual device.",
    has: { FFMPEG: true, GSTREAMER: true, MSMF: false, DSHOW: false },
  },
];

/** BackendLab (Module 39.3): hasBackend() is build-specific -- compare this course's own
 *  measured FFMPEG/GSTREAMER/MSMF/DSHOW availability against two illustrative profiles,
 *  reinforcing "check, don't assume" interactively. */
export function BackendLab({ caption }: { caption?: string }) {
  const [key, setKey] = useState("this-course");
  const profile = PROFILES.find((p) => p.key === key) as Profile;

  return (
    <figure className="fig backendlab">
      <div className="ctl ctl-full">
        <span>OpenCV build</span>
        <div className="seg seg-small" role="radiogroup" aria-label="Build profile">
          {PROFILES.map((p) => (
            <button key={p.key} type="button" role="radio" aria-checked={key === p.key} className={key === p.key ? "is-on" : ""} onClick={() => setKey(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="ap-stats">
        {BACKENDS.map((b) => (
          <li key={b}>
            <span>{b}</span>
            <strong style={{ color: profile.has[b] ? "#2da44e" : "#cf222e" }}>{profile.has[b] ? "available" : "not available"}</strong>
            <em>{b === "DSHOW" && profile.has[b] ? "built in, but camera-only -- can't open a file" : "hasBackend()"}</em>
          </li>
        ))}
      </ul>
      <div className="pg-readout"><span>{profile.measured ? "✅ " : "⚠️ "}{profile.note}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
