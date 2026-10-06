"use client";

import { useEffect, useState } from "react";
import { useGrays, GrayView, rect, both } from "./lab-kit";

type Cell = { x: number; y: number; score: number };
type Data = { imageSize: [number, number]; winSize: [number, number]; stride: number; grid: Cell[]; wholeImageResizedScore: number };

/** HogSvmLab (Module 37.3): the real HOG+SVM decision score (cv2.HOGDescriptor +
 *  getDefaultPeopleDetector) scanned over sample-synth-pedestrian.png, precomputed
 *  (scripts/gen_hogsvm_data.py). Click a cell to read its exact score; none cross the real
 *  detection threshold (0), but the least-negative cell still sits near the figure. */
export function HogSvmLab({ caption }: { caption?: string }) {
  const g = useGrays(["/images/sample-synth-pedestrian.png"])?.[0];
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState<Cell | null>(null);

  useEffect(() => {
    fetch("/data/hogsvm-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!g || !data) return <p>Loading…</p>;
  const scores = data.grid.map((c) => c.score);
  const lo = Math.min(...scores), hi = Math.max(...scores);
  const [winW, winH] = data.winSize;

  const overlay = both(
    ...data.grid.map((c) => {
      const t = (c.score - lo) / (hi - lo || 1);
      const colour = `rgba(${Math.round(255 * (1 - t))},${Math.round(80 + 100 * t)},${Math.round(255 * t)},0.22)`;
      return rect(c.x, c.y, data.stride, data.stride, colour, 0);
    }),
    sel ? rect(sel.x, sel.y, winW, winH, "#111", 2) : undefined,
  );

  const pick = (px: number, py: number) => {
    const cell = data.grid.reduce((best, c) => (Math.hypot(c.x - px, c.y - py) < Math.hypot(best.x - px, best.y - py) ? c : best));
    setSel(cell);
  };

  return (
    <figure className="fig lklab">
      <GrayView d={g.d} w={g.w} h={g.h} scale={1.3} overlay={overlay} onPick={pick}
        label={`${g.w}x${g.h}; each cell = one ${winW}x${winH} window's real HOG+SVM score (blue = less negative). Click to read one.`} />
      <p className="lk-read">
        Whole image resized to {winW}x{winH} and scored directly: <b>{data.wholeImageResizedScore}</b>.
        Best single window in the scan: <b>{Math.max(...scores).toFixed(4)}</b>. Worst: <b>{Math.min(...scores).toFixed(4)}</b>.
        All below the real detection threshold of 0 — this silhouette has the right shape but none of the clothing-texture gradient statistics the real detector was trained on.
        {sel && <> Selected window at ({sel.x}, {sel.y}): score <b>{sel.score}</b>.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
