"use client";

import { useEffect, useState } from "react";

type Circle = { radius: number; shape: string; area: number; telea_psnr: number; ns_psnr: number };
type Data = { circles: Circle[]; scratch: { area: number; telea_psnr: number; ns_psnr: number } };

/** InpaintLab (Module 48.2): real cv2.inpaint (TELEA and NS) PSNR results (precomputed by
 *  scripts/gen_inpaint_data.py) vs circular hole size, plus a real shape-vs-area comparison
 *  against a thin scratch of similar or larger area. */
export function InpaintLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/data/inpaint-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const maxPsnr = Math.max(...data.circles.map((c) => c.telea_psnr), data.scratch.telea_psnr);

  return (
    <figure className="fig inpaintlab">
      <div role="group" aria-label="Circular hole size vs PSNR" style={{ display: "grid", gap: "0.3rem" }}>
        {data.circles.map((c) => (
          <div key={c.radius} style={{ display: "grid", gridTemplateColumns: "6rem 1fr 5rem", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem" }}>r={c.radius}px ({c.area}px&sup2;)</span>
            <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
              <span style={{ position: "absolute", display: "block", height: "100%", width: `${(c.telea_psnr / maxPsnr) * 100}%`, background: "#1f6feb" }} />
              <span style={{ position: "absolute", display: "block", height: "40%", top: "30%", width: `${(c.ns_psnr / maxPsnr) * 100}%`, background: "#cf222e" }} />
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.76rem" }}>{c.telea_psnr}dB</span>
          </div>
        ))}
      </div>
      <div className="gl-legend">
        <span className="by-k" style={{ background: "#1f6feb" }} /> TELEA PSNR
        <span className="by-k" style={{ background: "#cf222e" }} /> NS PSNR
      </div>
      <ul className="ap-stats">
        <li><span>Compact blob (r=15px, {data.circles[2].area}px&sup2;)</span><strong>{data.circles[2].telea_psnr}dB</strong></li>
        <li><span>Thin scratch ({data.scratch.area}px&sup2;, larger area)</span><strong style={{ color: "#2da44e" }}>{data.scratch.telea_psnr}dB</strong><em>better, despite more pixels</em></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.inpaint, precomputed. PSNR falls steadily as the hole grows; the thin scratch -- despite a larger real area than the compact blob -- reconstructs better, because every scratch pixel sits close to valid neighbours.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
