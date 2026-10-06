"use client";

import { useState } from "react";

/** UncertaintyLab (Module 49.1): live, exact RSS (root-sum-of-squares) combination of
 *  several independent uncertainty sources -- the real GUM-style rule, contrasted with a
 *  naive direct sum. */
export function UncertaintyLab({ caption }: { caption?: string }) {
  const [u1, setU1] = useState(0.08);
  const [u2, setU2] = useState(0.015);
  const [u3, setU3] = useState(0.0);

  const rss = Math.sqrt(u1 ** 2 + u2 ** 2 + u3 ** 2);
  const naiveSum = u1 + u2 + u3;
  const maxBar = Math.max(naiveSum, rss, 0.001);

  return (
    <figure className="fig uncertaintylab">
      <label className="ctl ctl-wide"><span>Target tolerance contribution <output>{u1.toFixed(3)}mm</output></span>
        <input type="range" min={0} max={0.2} step={0.001} value={u1} onChange={(e) => setU1(Number(e.target.value))} aria-label="Target tolerance contribution" /></label>
      <label className="ctl ctl-wide"><span>Repeatability contribution <output>{u2.toFixed(3)}mm</output></span>
        <input type="range" min={0} max={0.2} step={0.001} value={u2} onChange={(e) => setU2(Number(e.target.value))} aria-label="Repeatability contribution" /></label>
      <label className="ctl ctl-wide"><span>Other (e.g. thermal drift) <output>{u3.toFixed(3)}mm</output></span>
        <input type="range" min={0} max={0.2} step={0.001} value={u3} onChange={(e) => setU3(Number(e.target.value))} aria-label="Other contribution" /></label>
      <ul className="ap-stats">
        <li><span>Naive sum (wrong)</span><strong>{naiveSum.toFixed(4)}mm</strong><em>overstates the real uncertainty</em></li>
        <li><span>RSS combination (real, correct)</span><strong style={{ color: "#2da44e" }}>{rss.toFixed(4)}mm</strong><em>sqrt(u1&sup2;+u2&sup2;+u3&sup2;)</em></li>
      </ul>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <div style={{ width: `${(naiveSum / maxBar) * 200}px`, height: "0.9rem", background: "#cf222e", borderRadius: "3px" }} />
        <span style={{ fontSize: "0.78rem" }}>naive sum</span>
      </div>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <div style={{ width: `${(rss / maxBar) * 200}px`, height: "0.9rem", background: "#2da44e", borderRadius: "3px" }} />
        <span style={{ fontSize: "0.78rem" }}>RSS (real)</span>
      </div>
      <div className="pg-readout"><span>Live, exact RSS combination of independent real uncertainty sources -- always smaller than the naive sum, because independent random errors partially cancel rather than always adding in the same direction.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
