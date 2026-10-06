"use client";

import { useState } from "react";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function poisson(lambda: number, rand: () => number) {
  // Knuth's algorithm -- fine for the small lambda values used here
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rand(); } while (p > L);
  return k - 1;
}

/** ShotNoiseLab (Module 48.4): live, exact Poisson shot-noise simulation -- signal level,
 *  brightening gain, and frame-averaging count, showing which actually change SNR. */
export function ShotNoiseLab({ caption }: { caption?: string }) {
  const [signal, setSignal] = useState(20);
  const [gain, setGain] = useState(5);
  const [nFrames, setNFrames] = useState(1);

  const N_SAMPLES = 800;
  const rand = mulberry32(signal * 1000 + nFrames);
  let sumSq = 0;
  for (let i = 0; i < N_SAMPLES; i++) {
    let acc = 0;
    for (let f = 0; f < nFrames; f++) acc += poisson(signal, rand);
    const avg = acc / nFrames;
    sumSq += (avg - signal) ** 2;
  }
  const std = Math.sqrt(sumSq / N_SAMPLES);
  const snrBase = signal / std;
  const brightenedStd = std * gain;
  const snrBrightened = (signal * gain) / brightenedStd;

  return (
    <figure className="fig shotnoiselab">
      <label className="ctl ctl-wide"><span>True signal level <output>{signal}</output></span>
        <input type="range" min={2} max={200} step={1} value={signal} onChange={(e) => setSignal(Number(e.target.value))} aria-label="Signal level" /></label>
      <label className="ctl ctl-wide"><span>Brightening gain <output>{gain}x</output></span>
        <input type="range" min={1} max={20} step={1} value={gain} onChange={(e) => setGain(Number(e.target.value))} aria-label="Brightening gain" /></label>
      <label className="ctl ctl-wide"><span>Frames averaged <output>{nFrames}</output></span>
        <input type="range" min={1} max={64} step={1} value={nFrames} onChange={(e) => setNFrames(Number(e.target.value))} aria-label="Frames averaged" /></label>
      <ul className="ap-stats">
        <li><span>SNR (before brightening)</span><strong>{snrBase.toFixed(2)}</strong><em>sqrt({signal})&asymp;{Math.sqrt(signal).toFixed(2)}</em></li>
        <li><span>SNR after {gain}x brightening</span><strong style={{ color: Math.abs(snrBrightened - snrBase) < 0.01 ? "#2da44e" : "#cf222e" }}>{snrBrightened.toFixed(2)}</strong><em>unchanged, always</em></li>
      </ul>
      <div className="pg-readout"><span>Live, exact Poisson simulation. Drag the gain slider and watch SNR stay exactly the same; drag the frame count instead and watch it genuinely improve.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
