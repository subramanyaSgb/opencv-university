"use client";

import { useMemo, useState } from "react";
import { script, info, DEPTHS, makeType } from "@/lib/mat-ops";

const HUES: Record<string, string> = { A: "ml-a", B: "ml-b", C: "ml-c", R: "ml-r" };

/** MatLab: step through a C++ session with cv::Mat headers, shared buffers, ROI and reference counts; decode type numbers. */
export function MatLab({ caption }: { caption?: string }) {
  const steps = useMemo(() => script(), []);
  const [i, setI] = useState(0);
  const [depth, setDepth] = useState(0);
  const [cn, setCn] = useState(3);
  const st = steps[i].state;
  const d = DEPTHS[depth];
  return (
    <figure className="fig matlab">
      <div className="ml-nav">
        <button type="button" className="hl-reset" disabled={i === 0} onClick={() => setI(i - 1)}>◀ Back</button>
        <span className="ml-count">line {i + 1} of {steps.length}</span>
        <button type="button" className="hl-reset" disabled={i === steps.length - 1} onClick={() => setI(i + 1)}>Next ▶</button>
      </div>
      <ol className="ml-code">
        {steps.map((s, k) => (
          <li key={k} className={k === i ? "is-cur" : k > i ? "is-later" : ""}><button type="button" onClick={() => setI(k)}><code>{s.code}</code></button></li>
        ))}
      </ol>
      <div className="pg-readout" role="status"><span>{steps[i].note}</span></div>
      <div className="ml-mem">
        <div className="ml-col">
          <div className="vis-title">Headers (small: size, step, data pointer)</div>
          <ul className="ml-hdrs">
            {st.hdrs.map((h) => {
              const f = info(st, h.name);
              return (
                <li key={h.name} className={`${HUES[h.name]}${f.empty ? " is-empty" : ""}`}>
                  <strong>{h.name}</strong>
                  {f.empty ? <em>empty (no data)</em> : <em>→ {h.buf} · {h.rows} × {h.cols} · step {f.step} B · offset {f.offset} B · {f.continuous ? "continuous" : "not continuous"}</em>}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="ml-col">
          <div className="vis-title">Pixel buffers (big: the data)</div>
          {st.bufs.map((b) => {
            const users = st.hdrs.filter((h) => h.buf === b.id);
            return (
              <div key={b.id} className={`ml-buf${b.freed ? " is-freed" : ""}`}>
                <div className="ml-buf-h">{b.id} · {b.rows * b.cols} bytes · reference count <strong>{b.refs}</strong>{b.freed ? " · freed" : ""}</div>
                <div className="ml-grid" style={{ gridTemplateColumns: `repeat(${b.cols}, 2rem)` }}>
                  {b.data.map((v, k) => {
                    const r = Math.floor(k / b.cols), c = k % b.cols;
                    const inR = users.some((h) => h.name === "R" && r >= h.r0 && r < h.r0 + h.rows && c >= h.c0 && c < h.c0 + h.cols);
                    return <span key={k} className={`ml-cell${inR ? " in-roi" : ""}`}>{b.freed ? "" : v}</span>;
                  })}
                </div>
                <div className="ml-users">{users.length ? `used by ${users.map((u) => u.name).join(", ")}` : "no header uses it"}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Depth</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Depth">
            {DEPTHS.map((x, k) => <button key={x.name} type="button" role="radio" aria-checked={depth === k} className={depth === k ? "is-on" : ""} onClick={() => setDepth(k)}>{x.name}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Channels</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Channels">
            {[1, 2, 3, 4].map((c) => <button key={c} type="button" role="radio" aria-checked={cn === c} className={cn === c ? "is-on" : ""} onClick={() => setCn(c)}>{c}</button>)}
          </div>
        </div>
      </div>
      <ul className="ap-stats">
        <li><span>Type constant</span><strong>CV_{d.name}C{cn}</strong><em>number {makeType(d.code, cn)} = {d.code} + ({cn} − 1) · 8</em></li>
        <li><span>Bytes per pixel</span><strong>{d.bytes * cn}</strong><em>elemSize: {d.bytes} B × {cn} channel{cn > 1 ? "s" : ""}</em></li>
        <li><span>Row of 640 pixels</span><strong>{640 * d.bytes * cn} B</strong><em>step of a continuous 640-wide image</em></li>
      </ul>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
