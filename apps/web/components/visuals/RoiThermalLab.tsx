"use client";

import { useState } from "react";

const SIGMA = 5.670374419e-8;
const T_HOT = 400.0, T_BG = 300.0;

function apparentTempMix(f: number, tHot: number, tBg: number) {
  const W = f * SIGMA * tHot ** 4 + (1 - f) * SIGMA * tBg ** 4;
  return (W / SIGMA) ** 0.25;
}

/** RoiThermalLab (Module 46.5): live, exact radiance-mixing model for an ROI partly
 *  covering a hot target -- the real fill-factor error for a MEAN statistic, contrasted
 *  live with a MAX statistic computed over a simulated pixel grid where the hot target
 *  occupies exactly one full pixel. */
export function RoiThermalLab({ caption }: { caption?: string }) {
  const [fill, setFill] = useState(0.3);
  const [roiPixels, setRoiPixels] = useState(64);

  const appMean = apparentTempMix(fill, T_HOT, T_BG);
  const errMean = T_HOT - appMean;

  // MAX-vs-MEAN demo: hot target = exactly 1 full pixel of roiPixels, rest at T_BG
  const meanOfGrid = (T_HOT + (roiPixels - 1) * T_BG) / roiPixels;
  const errMeanGrid = T_HOT - meanOfGrid;

  return (
    <figure className="fig roithermallab">
      <label className="ctl ctl-wide"><span>Hot target's fraction of the measurement ROI <output>{(fill * 100).toFixed(0)}%</output></span>
        <input type="range" min={0.01} max={1} step={0.01} value={fill} onChange={(e) => setFill(Number(e.target.value))} aria-label="Fill fraction" /></label>
      <ul className="ap-stats">
        <li><span>True hot target temperature</span><strong>{T_HOT - 273.15}&deg;C</strong></li>
        <li><span>Apparent (MEAN, mixed) reading</span><strong style={{ color: errMean > 10 ? "#cf222e" : "#2da44e" }}>{(appMean - 273.15).toFixed(2)}&deg;C</strong><em>error {errMean.toFixed(2)}K</em></li>
      </ul>
      <label className="ctl ctl-wide"><span>ROI size (hot target = exactly 1 full pixel) <output>{roiPixels} px</output></span>
        <input type="range" min={4} max={256} step={1} value={roiPixels} onChange={(e) => setRoiPixels(Number(e.target.value))} aria-label="ROI pixel count" /></label>
      <ul className="ap-stats">
        <li><span>ROI MAX (same ROI)</span><strong style={{ color: "#2da44e" }}>{(T_HOT - 273.15).toFixed(1)}&deg;C</strong><em>error 0.00K, always</em></li>
        <li><span>ROI MEAN (same ROI)</span><strong style={{ color: errMeanGrid > 10 ? "#cf222e" : "#2da44e" }}>{(meanOfGrid - 273.15).toFixed(2)}&deg;C</strong><em>error {errMeanGrid.toFixed(2)}K</em></li>
      </ul>
      <div className="pg-readout"><span>Live, exact radiance mixing. Shrink the fill fraction (top) and watch the MEAN reading collapse toward the background; grow the ROI size (bottom) with the hot target fixed at exactly 1 pixel, and watch MAX stay exact while MEAN keeps getting diluted.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
