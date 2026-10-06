"use client";

import { useState } from "react";
import { STAGES, memory } from "@/lib/graph-ops";

const SIZES = [
  { l: "640 × 480", w: 640, h: 480 },
  { l: "2448 × 2048 (5 MP)", w: 2448, h: 2048 },
  { l: "8192 × 4096 (line scan block)", w: 8192, h: 4096 },
];
const mb = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(1)} kB`);

/** GraphLab: build an inspection graph from stages; compare eager memory with G-API Fluid line buffers; show the code. */
export function GraphLab({ caption }: { caption?: string }) {
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(STAGES.map((s) => [s.key, true])));
  const [si, setSi] = useState(1);
  const active = STAGES.filter((s) => on[s.key]);
  const { w, h } = SIZES[si];
  const m = memory(active, w, h);
  const max = Math.max(m.eager, m.fluid, 1);
  const vars = active.map((s, i) => `g${i + 1}`);
  const code = [
    "k3 = np.ones((3, 3), np.uint8)",
    "g_ref, g_test = cv2.GMat(), cv2.GMat()",
    ...active.map((s, i) => {
      const src = i === 0 ? "g_ref, g_test" : vars[i - 1];
      const extra = s.key === "blur" ? ", (5, 5)" : s.key === "thr" ? ", cv2.GScalar(40), cv2.GScalar(255), cv2.THRESH_BINARY" : s.key === "erode" || s.key === "dilate" ? ", k3" : "";
      const first = i === 0 && s.key !== "diff" ? "g_ref" : src;
      return `${vars[i]} = ${s.gapi}(${first}${extra})`;
    }),
    `comp = cv2.GComputation(cv2.GIn(g_ref, g_test), cv2.GOut(${vars[vars.length - 1] ?? "g_ref"}))`,
  ];
  return (
    <figure className="fig graphlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Stages</span>
          <div className="gr-stages">
            {STAGES.map((s) => (
              <label key={s.key} className={`gr-chip${on[s.key] ? " is-on" : ""}`}>
                <input type="checkbox" checked={on[s.key]} onChange={() => setOn({ ...on, [s.key]: !on[s.key] })} /> {s.label}
              </label>
            ))}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Image</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Image size">
            {SIZES.map((s, i) => <button key={s.l} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{s.l}</button>)}
          </div>
        </div>
      </div>
      <ol className="gr-graph" aria-label="Graph">
        <li className="gr-node gr-in">ref, test</li>
        {active.map((s) => <li key={s.key} className={`gr-node${s.reduce ? " gr-red" : ""}`}><span>{s.label}</span><em>{s.rows > 1 ? `needs ${s.rows} lines` : "1 line"}</em></li>)}
      </ol>
      <div className="gp-bars" aria-hidden="true">
        <div className="gp-row"><span>Eager</span><div className="gp-track"><i className="gr-e" style={{ width: `${(100 * m.eager) / max}%` }} /></div><b>{mb(m.eager)}</b></div>
        <div className="gp-row"><span>Fluid</span><div className="gp-track"><i className="gr-f" style={{ width: `${Math.max(0.5, (100 * m.fluid) / max)}%` }} /></div><b>{mb(m.fluid)}</b></div>
      </div>
      <ul className="ap-stats">
        <li><span>Intermediate images (eager)</span><strong>{m.intermediates}</strong><em>each {mb(w * h)}, written to and read back from memory</em></li>
        <li><span>Fluid line buffers</span><strong>{mb(m.fluid)}</strong><em>{m.eager > 0 ? `${(m.eager / Math.max(m.fluid, 1)).toFixed(0)}× less memory for intermediates` : "nothing to save"}</em></li>
      </ul>
      <pre className="bl-call"><code>{code.join("\n")}</code></pre>
      <div className="pg-readout"><span>Simplified model: 8-bit, 1 channel; each stage keeps a window of as many input lines as its kernel is tall. Real buffers add borders and alignment.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
