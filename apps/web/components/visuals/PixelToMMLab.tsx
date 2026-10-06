"use client";

import { useEffect, useState } from "react";

type Result = { height: number; naive_mm: number; correct_mm: number };
type Data = { true_length: number; scale_mm_per_px: number; results: Result[] };

/** PixelToMMLab (Module 41.6): real naive-fixed-scale vs full-calibrated (undistort +
 *  ray-plane intersection at the real known height) pixel-to-mm conversion, precomputed by
 *  scripts/gen_pixel2mm_data.py, for a real 100mm part at various heights off the
 *  calibration plane (2.4's "height trap"). */
export function PixelToMMLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [height, setHeight] = useState(-30);

  useEffect(() => {
    fetch("/data/pixel2mm-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;

  const current = data.results.reduce((best, r) => (Math.abs(r.height - height) < Math.abs(best.height - height) ? r : best));
  const naiveErr = current.naive_mm - data.true_length;

  return (
    <figure className="fig pixeltomm">
      <label className="ctl ctl-wide"><span>Part height off the calibration plane <output>{height} mm</output></span>
        <input type="range" min={-60} max={60} step={10} value={height} onChange={(e) => setHeight(Number(e.target.value))} aria-label="Part height" />
      </label>
      <ul className="ap-stats">
        <li><span>True length</span><strong>{data.true_length.toFixed(1)} mm</strong></li>
        <li><span>Naive (fixed scale, 2.4)</span><strong style={{ color: Math.abs(naiveErr) > 1 ? "#cf222e" : "#2da44e" }}>{current.naive_mm.toFixed(2)} mm</strong><em>{naiveErr >= 0 ? "+" : ""}{naiveErr.toFixed(2)} mm error</em></li>
        <li><span>Calibrated (undistort + ray-plane at known height)</span><strong style={{ color: "#2da44e" }}>{current.correct_mm.toFixed(4)} mm</strong><em>exact, given the real height</em></li>
      </ul>
      <div className="pg-readout"><span>Real cv2.undistortPoints + ray-plane intersection, precomputed. The naive single-scale reading (2.4) drifts by a real, measured amount as the part's real height changes; the calibrated method stays exact, because it is told the real height rather than assuming the calibration plane's.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
