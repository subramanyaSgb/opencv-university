"use client";

import { useState } from "react";
import { advise } from "@/lib/install-ops";

/** InstallPicker: answer four questions, get the right OpenCV pip package and command. */
export function InstallPicker({ caption }: { caption?: string }) {
  const [gui, setGui] = useState(true);
  const [contrib, setContrib] = useState(false);
  const [cuda, setCuda] = useState(false);
  const [pin, setPin] = useState(true);
  const a = advise({ gui, contrib, cuda, version: pin ? "4.13.0.92" : "" });
  const q = (label: string, v: boolean, set: (b: boolean) => void, yes: string, no: string) => (
    <div className="ctl ctl-full">
      <span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {([[true, yes], [false, no]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
      </div>
    </div>
  );
  return (
    <figure className="fig installpicker">
      <div className="sc-ctl">
        {q("Do you need windows (cv2.imshow, trackbars)?", gui, setGui, "yes, a desktop", "no, server / Docker / notebook")}
        {q("Do you need contrib modules (ximgproc, xfeatures2d …)?", contrib, setContrib, "yes", "no")}
        {q("Do you need an NVIDIA GPU (cv2.cuda)?", cuda, setCuda, "yes", "no")}
        {q("Pin the exact version (recommended)?", pin, setPin, "yes, 4.13.0.92", "no, latest")}
      </div>
      <div className="ip-result">
        <div className="vis-title">Install</div>
        <code className="ip-cmd">{a.command}</code>
      </div>
      <ul className="ip-notes">{a.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
