"use client";

import { useState } from "react";
import { FUNCS, DTYPES, SHAPES, LAYOUTS, lookup, matType, needsCopy } from "@/lib/binding-ops";

function Seg<T extends string>({ label, items, value, set }: { label: string; items: readonly T[]; value: T; set: (v: T) => void }) {
  return (
    <div className="ctl ctl-full"><span>{label}</span>
      <div className="seg seg-small" role="radiogroup" aria-label={label}>
        {items.map((x) => <button key={x} type="button" role="radio" aria-checked={value === x} className={value === x ? "is-on" : ""} onClick={() => set(x)}>{x}</button>)}
      </div>
    </div>
  );
}

/** BindingLab: NumPy dtype × shape × memory layout → what cv2 does with it (recorded on OpenCV 4.13.0). */
export function BindingLab({ caption }: { caption?: string }) {
  const [fn, setFn] = useState<string>(FUNCS[1]);
  const [dt, setDt] = useState<string>("uint8");
  const [sh, setSh] = useState<string>(SHAPES[2]);
  const [ly, setLy] = useState<string>(LAYOUTS[0]);
  const r = lookup(fn, dt, sh, ly)!;
  const mt = matType(dt, sh);
  const inPlace = fn.startsWith("rectangle");
  const call = fn.startsWith("cvtColor") ? "cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)" : fn.startsWith("Gaussian") ? "cv2.GaussianBlur(a, (3, 3), 0)" : fn.startsWith("threshold") ? "cv2.threshold(a, 100, 255, cv2.THRESH_BINARY)[1]" : fn === "Canny" ? "cv2.Canny(a, 50, 150)" : "cv2.rectangle(a, (1, 1), (3, 3), 255, 1)";
  return (
    <figure className="fig bindinglab">
      <div className="sc-ctl">
        <Seg label="Function" items={FUNCS} value={fn as (typeof FUNCS)[number]} set={setFn} />
        <Seg label="dtype" items={DTYPES} value={dt as (typeof DTYPES)[number]} set={setDt} />
        <Seg label="shape" items={SHAPES} value={sh as (typeof SHAPES)[number]} set={setSh} />
        <Seg label="memory layout" items={LAYOUTS} value={ly as (typeof LAYOUTS)[number]} set={setLy} />
      </div>
      <pre className="bl-call"><code>{`a.shape = ${sh.replace("h", "6").replace("w", "8")}, a.dtype = ${dt}\nresult = ${call}`}</code></pre>
      <ul className="ap-stats">
        <li><span>Mat built by the binding</span><strong>{mt ? mt.name : "none"}</strong><em>{mt ? `type ${mt.number}${mt.converted ? " · int64 converted to int32 (a copy)" : ""}` : "bool has no Mat depth"}</em></li>
        <li><span>Memory</span><strong>{needsCopy(ly) ? (inPlace ? "cannot share" : "copied first") : "shared, no copy"}</strong><em>{needsCopy(ly) ? (inPlace ? "an output must be a Mat-compatible view" : "inputs with gaps between pixels are copied to a packed Mat") : "the Mat header points at the NumPy buffer"}</em></li>
        <li><span>Result</span><strong className={r.ok ? "bl-ok" : "bl-bad"}>{r.ok ? "works" : "cv2.error"}</strong><em>{r.ok ? r.result : "see below"}</em></li>
      </ul>
      {!r.ok && (
        <div className="bl-err" role="status">
          <code>cv2.error: OpenCV(4.13.0) … {r.error}</code>
          <p>{r.hint}</p>
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
