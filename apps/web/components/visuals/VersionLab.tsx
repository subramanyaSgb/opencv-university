"use client";

import { useState } from "react";
import { FEATURES, status, summary, type Status } from "@/lib/version-ops";

const LABEL: Record<Status, string> = { ok: "works", contrib: "needs contrib", check: "works, check", missing: "missing" };

/** VersionLab: tick what your code uses; see what changes when moving from 4.13 to 5.0 (main or contrib package). */
export function VersionLab({ caption }: { caption?: string }) {
  const [used, setUsed] = useState<string[]>(["core", "calib", "ml", "dnn"]);
  const [target, setTarget] = useState<"4.13" | "5.0">("5.0");
  const [contrib, setContrib] = useState(false);
  const s = summary(used, target, contrib);
  const pkg = `opencv-${contrib ? "contrib-" : ""}python-headless==${target === "4.13" ? "4.13.0.92" : "5.0.0.93"}`;
  return (
    <figure className="fig versionlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Upgrade to</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Target version">
            {(["4.13", "5.0"] as const).map((v) => <button key={v} type="button" role="radio" aria-checked={target === v} className={target === v ? "is-on" : ""} onClick={() => setTarget(v)}>{v}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Package</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Package">
            {([[false, "main"], [true, "contrib"]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={contrib === k} className={contrib === k ? "is-on" : ""} onClick={() => setContrib(k)}>{l}</button>)}
          </div>
        </div>
      </div>
      <div className="vs-pkg"><code>pip install {pkg}</code></div>
      <ul className="vs-list">
        {FEATURES.map((f) => {
          const on = used.includes(f.key);
          const st = status(f, target, contrib);
          return (
            <li key={f.key} className={on ? "is-used" : ""}>
              <label><input type="checkbox" checked={on} onChange={() => setUsed(on ? used.filter((k) => k !== f.key) : [...used, f.key])} /> {f.label}</label>
              {on && <span className={`vs-st vs-${st}`}>{LABEL[st]}</span>}
              {on && st !== "ok" && <em>{f.note}</em>}
            </li>
          );
        })}
      </ul>
      <ul className="ap-stats">
        <li><span>Works unchanged</span><strong>{s.ok}</strong><em>of {used.length} features you use</em></li>
        <li><span>Needs the contrib package</span><strong className={s.contrib ? "bl-bad" : ""}>{s.contrib}</strong><em>moved out of the main modules</em></li>
        <li><span>Works, but re-test</span><strong>{s.check}</strong><em>new defaults or build requirements</em></li>
      </ul>
      <div className="pg-readout"><span>Recorded by importing the pip wheels 4.13.0.92 and 5.0.0.93 (main and contrib) and checking each feature. Your code may use more; always run your tests on the new version.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
