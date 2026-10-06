"use client";

import { useState } from "react";

const ROWS = 6, COLS = 8;

/** CoordLab: click one pixel to see every way of naming it; click a second to get an ROI slice and rectangle. */
export function CoordLab({ caption }: { caption?: string }) {
  const [a, setA] = useState<[number, number]>([1, 2]);
  const [b, setB] = useState<[number, number] | null>([3, 5]);
  const [next, setNext] = useState<"a" | "b">("a");
  const r0 = b ? Math.min(a[0], b[0]) : a[0], r1 = b ? Math.max(a[0], b[0]) : a[0];
  const c0 = b ? Math.min(a[1], b[1]) : a[1], c1 = b ? Math.max(a[1], b[1]) : a[1];
  const inRoi = (r: number, c: number) => b !== null && r >= r0 && r <= r1 && c >= c0 && c <= c1;

  const click = (r: number, c: number) => {
    if (next === "a") { setA([r, c]); setB(null); setNext("b"); }
    else { setB([r, c]); setNext("a"); }
  };

  return (
    <figure className="fig coordlab">
      <div className="cdl-row">
        <div className="cdl-wrap">
          <div className="cdl-xlab" aria-hidden="true">{Array.from({ length: COLS }, (_, c) => <span key={c}>{c}</span>)}</div>
          <div className="cdl-body">
            <div className="cdl-ylab" aria-hidden="true">{Array.from({ length: ROWS }, (_, r) => <span key={r}>{r}</span>)}</div>
            <div className="cdl-grid" role="grid" aria-label="8 by 6 pixel grid">
              {Array.from({ length: ROWS * COLS }, (_, k) => {
                const r = Math.floor(k / COLS), c = k % COLS;
                const isA = r === a[0] && c === a[1], isB = b !== null && r === b[0] && c === b[1];
                return <button key={k} type="button" aria-label={`row ${r}, column ${c}`} onClick={() => click(r, c)}
                  className={`cdl-cell${inRoi(r, c) ? " in-roi" : ""}${isA || isB ? " is-pick" : ""}`}>{r * COLS + c}</button>;
              })}
            </div>
          </div>
          <div className="fl-cap">x (columns) →, y (rows) ↓. Numbers are flat indices.</div>
        </div>
        <table className="fp-table cdl-tab">
          <tbody>
            <tr><td>NumPy</td><td>img[{a[0]}, {a[1]}]</td></tr>
            <tr><td>OpenCV point</td><td>(x={a[1]}, y={a[0]})</td></tr>
            <tr><td>Flat index</td><td>{a[0]} × {COLS} + {a[1]} = {a[0] * COLS + a[1]}</td></tr>
            {b && <>
              <tr><td>ROI slice</td><td>img[{r0}:{r1 + 1}, {c0}:{c1 + 1}]</td></tr>
              <tr><td>ROI shape</td><td>({r1 - r0 + 1}, {c1 - c0 + 1})</td></tr>
              <tr><td>cv2.rectangle</td><td>({c0}, {r0}), ({c1}, {r1})</td></tr>
              <tr><td>Rect (x, y, w, h)</td><td>({c0}, {r0}, {c1 - c0 + 1}, {r1 - r0 + 1})</td></tr>
            </>}
          </tbody>
        </table>
      </div>
      <div className="pg-readout" aria-live="polite"><span>{next === "b" ? "Click a second pixel to make a region (ROI)." : "Click a pixel to start again."} Note the slice ends are one past the last row and column.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
