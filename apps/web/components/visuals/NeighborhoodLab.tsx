"use client";

import { useState } from "react";
import { inkFor } from "@/lib/pixel-ops";
import { applyAt, applyNb, isInterior, window3, type Grid, type NbOp } from "@/lib/neighborhood-ops";

/**
 * NeighborhoodLab: tap any pixel to see its 3 × 3 window and how the output pixel is computed.
 * Mean = cv2.blur (3, 3); Median = cv2.medianBlur(…, 3). Border rules match OpenCV.
 */
export function NeighborhoodLab({ values, caption }: { values: Grid; caption?: string }) {
  const [op, setOp] = useState<NbOp>("mean");
  const [sel, setSel] = useState<[number, number]>([Math.floor(values.length / 2), Math.floor(values[0].length / 2)]);
  const out = applyNb(values, op);
  const [r, c] = sel;
  const win = window3(values, r, c, op);
  const inWin = (rr: number, cc: number) => Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1;
  const sum = win.reduce((a, b) => a + b, 0);
  const sorted = [...win].sort((a, b) => a - b);

  const grid = (g: Grid, which: "in" | "out") => (
    <div className="nl-grid" style={{ ["--cols" as string]: g[0].length }}>
      {g.map((row, rr) =>
        row.map((v, cc) => {
          const isSel = rr === r && cc === c;
          const cls = `nl-cell${which === "in" && inWin(rr, cc) ? " in-win" : ""}${isSel ? " is-sel" : ""}`;
          return which === "in" ? (
            <button key={`${rr}-${cc}`} type="button" className={cls} style={{ background: `rgb(${v},${v},${v})`, color: inkFor(v) }}
              aria-label={`row ${rr}, column ${cc}, value ${v}`} onClick={() => setSel([rr, cc])}>
              {v}
            </button>
          ) : (
            <span key={`${rr}-${cc}`} className={cls} style={{ background: `rgb(${v},${v},${v})`, color: inkFor(v) }}>{v}</span>
          );
        }),
      )}
    </div>
  );

  return (
    <figure className="fig nlab">
      <div className="fig-controls">
        <div className="seg" role="radiogroup" aria-label="Neighbourhood operation">
          {(["mean", "median"] as NbOp[]).map((o) => (
            <button key={o} type="button" role="radio" aria-checked={op === o} className={op === o ? "is-on" : ""} onClick={() => setOp(o)}>
              {o === "mean" ? "Mean (cv2.blur)" : "Median (cv2.medianBlur)"}
            </button>
          ))}
        </div>
      </div>
      <div className="pg-panels has-output">
        <div className="pg-panel"><div className="pg-title">Input: tap a pixel</div>{grid(values, "in")}</div>
        <div className="pg-arrow" aria-hidden="true"><span className="pg-formula">3 × 3 {op}</span><span className="pg-arrow-glyph">→</span></div>
        <div className="pg-panel"><div className="pg-title">Output</div>{grid(out, "out")}</div>
      </div>
      <div className="pg-readout" aria-live="polite">
        {op === "mean" ? (
          <span>
            Window sum {sum} ÷ 9 = {(sum / 9).toFixed(2)} → <strong>{applyAt(values, r, c, op)}</strong>
          </span>
        ) : (
          <span>
            Sorted window: {sorted.map((v, i) => (i === 4 ? <strong key={i}>[{v}] </strong> : `${v} `))}→ middle value <strong>{applyAt(values, r, c, op)}</strong>
          </span>
        )}
        {!isInterior(values, r, c) && <span className="nl-note">Edge pixel: the window reaches outside the image, so OpenCV fills it in from the pixels near the edge.</span>}
      </div>
      <figcaption>{caption ?? "Each output pixel depends on 9 input pixels: the one at the same place and its 8 neighbours."}</figcaption>
    </figure>
  );
}
