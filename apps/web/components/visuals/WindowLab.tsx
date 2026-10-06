"use client";

import { useMemo, useState } from "react";
import { useGrays, GrayView, rect, both, Seg, Slider, type Paint } from "./lab-kit";

const SRC = "/images/sample-board.png";
const TPL = { x0: 25, y0: 22, w: 31, h: 27 };          // the reference chip, same as 32.1-32.4

/** WindowLab (Module 37.1): the sliding-window search itself -- "grid" mode shows every window position
 *  a multi-scale search would visit; "raw" mode runs the chip template (32.1) as a live NCC "classifier"
 *  and shows every raw match above a threshold, before any non-max suppression (37.4). */
export function WindowLab({ caption }: { caption?: string }) {
  const g = useGrays([SRC])?.[0];
  const [mode, setMode] = useState<"grid" | "raw">("grid");
  const [scale, setScale] = useState(1.0);
  const [stride, setStride] = useState(16);
  const [thresh, setThresh] = useState(0.7);

  const grid = useMemo(() => {
    if (!g) return null;
    const w = Math.round(TPL.w * scale), h = Math.round(TPL.h * scale);
    const boxes: { x: number; y: number }[] = [];
    for (let y = 0; y + h <= g.h; y += stride) for (let x = 0; x + w <= g.w; x += stride) boxes.push({ x, y });
    return { w, h, boxes };
  }, [g, scale, stride]);

  const raw = useMemo(() => {
    if (!g || mode !== "raw") return null;
    const { d, w: W, h: H } = g;
    const { w: tw, h: th } = TPL;
    const tpl: number[] = [];
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) tpl.push(d[(TPL.y0 + y) * W + (TPL.x0 + x)]);
    const tMean = tpl.reduce((a, b) => a + b, 0) / tpl.length;
    const tCent = tpl.map((v) => v - tMean);
    const tNorm = Math.sqrt(tCent.reduce((a, b) => a + b * b, 0));
    const hits: { x: number; y: number; score: number }[] = [];
    // NCC at every position (O(positions * template size), fine at this image size)
    for (let y = 0; y + th <= H; y += 1) {
      for (let x = 0; x + tw <= W; x += 1) {
        let wsum = 0;
        for (let j = 0; j < th; j++) for (let i = 0; i < tw; i++) wsum += d[(y + j) * W + (x + i)];
        const wMean = wsum / tpl.length;
        let num = 0, wss = 0;
        for (let j = 0; j < th; j++) {
          for (let i = 0; i < tw; i++) {
            const wv = d[(y + j) * W + (x + i)] - wMean;
            num += wv * tCent[j * tw + i];
            wss += wv * wv;
          }
        }
        const denom = Math.sqrt(wss) * tNorm;
        const score = denom > 1e-6 ? num / denom : 0;
        if (score >= thresh) hits.push({ x, y, score });
      }
    }
    return { w: tw, h: th, hits };
  }, [g, mode, thresh]);

  if (!g) return <p>Loading…</p>;

  let overlay: Paint;
  if (mode === "grid" && grid) {
    overlay = both(...grid.boxes.map((b) => rect(b.x, b.y, grid.w, grid.h, "rgba(58,160,255,0.55)", 1)));
  } else if (mode === "raw" && raw) {
    overlay = both(...raw.hits.map((h) => rect(h.x, h.y, raw.w, raw.h, "#e0393e", 1)));
  } else {
    overlay = () => {};
  }

  return (
    <figure className="fig lklab">
      <Seg label="View" opts={[["grid", "Window grid"], ["raw", "Raw matches (before NMS)"]]} v={mode} set={(m) => setMode(m as "grid" | "raw")} />
      {mode === "grid" && (
        <>
          <Slider label="Window scale" v={scale} set={setScale} min={0.5} max={2} step={0.1} show={`${scale.toFixed(1)}x (${Math.round(TPL.w * scale)}x${Math.round(TPL.h * scale)} px)`} />
          <Slider label="Stride" v={stride} set={setStride} min={4} max={32} step={4} unit=" px" />
        </>
      )}
      {mode === "raw" && <Slider label="NCC threshold" v={thresh} set={setThresh} min={0.5} max={0.95} step={0.05} />}
      <GrayView d={g.d} w={g.w} h={g.h} scale={2} overlay={overlay} label={`${g.w}x${g.h}`} />
      <p className="lk-read">
        {mode === "grid" && grid && <>Window size {grid.w}x{grid.h} px, stride {stride} px: <b>{grid.boxes.length}</b> window positions at this one scale alone.</>}
        {mode === "raw" && raw && <>NCC ≥ {thresh.toFixed(2)}: <b>{raw.hits.length}</b> raw matching windows, most of them clustered tightly around the true chips — exactly the problem non-max suppression (37.4) solves.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
