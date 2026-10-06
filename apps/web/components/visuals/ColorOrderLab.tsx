"use client";

import { useState } from "react";
import { CONSUMERS, fix, needSwap, perceived, PRODUCERS } from "@/lib/order-ops";

/** ColorOrderLab: pick where an array comes from and where it goes; see whether red stays red. */
export function ColorOrderLab({ caption }: { caption?: string }) {
  const [p, setP] = useState(1);
  const [c, setC] = useState(0);
  const from = PRODUCERS[p].order, to = CONSUMERS[c].expects;
  const [r, g, b] = perceived(from, to);
  const swap = needSwap(from, to);
  return (
    <figure className="fig colororderlab">
      <div className="co-cols">
        <div>
          <div className="vis-title">The array comes from</div>
          <div className="co-list" role="radiogroup" aria-label="Producer">
            {PRODUCERS.map((x, i) => <button key={x.k} type="button" role="radio" aria-checked={p === i} className={p === i ? "co-item is-on" : "co-item"} onClick={() => setP(i)}><span>{x.label}</span><b>{x.order}</b></button>)}
          </div>
        </div>
        <div>
          <div className="vis-title">… and goes to</div>
          <div className="co-list" role="radiogroup" aria-label="Consumer">
            {CONSUMERS.map((x, i) => <button key={x.k} type="button" role="radio" aria-checked={c === i} className={c === i ? "co-item is-on" : "co-item"} onClick={() => setC(i)}><span>{x.label}</span><b>{x.expects}</b></button>)}
          </div>
        </div>
      </div>
      <div className="co-result">
        <div className="co-sw" style={{ background: `rgb(${r},${g},${b})` }} aria-label={swap ? "a red object appears blue" : "a red object appears red"} role="img" />
        <div>
          <strong>{swap ? `${from} → expects ${to}: red and blue swapped` : `${from} → expects ${to}: colours correct`}</strong>
          <p>{fix(from, to)}</p>
        </div>
      </div>
      <div className="pg-readout"><span>The swatch shows how a pure red part (R = 220) ends up. Arrays carry no label saying "BGR" or "RGB": you must know where they came from.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
