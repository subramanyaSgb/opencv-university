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
function gaussian(rand: () => number) {
  const u1 = rand(), u2 = rand();
  return Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
}

const W = 40, H = 30;
function buildClean() {
  const img: number[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    img.push(Math.max(0, Math.min(255, 128 + 60 * Math.sin(x / 3) + 40 * Math.cos(y / 2.5))));
  }
  return img;
}
const CLEAN = buildClean();

function psnr(a: number[], b: number[]) {
  const mse = a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.length;
  return mse > 0 ? 10 * Math.log10((255 ** 2) / mse) : Infinity;
}
function boxBlur(img: number[], w: number, h: number, r: number) {
  const out = new Array(img.length).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0, n = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < h && xx >= 0 && xx < w) { sum += img[yy * w + xx]; n++; }
    }
    out[y * w + x] = sum / n;
  }
  return out;
}
function ssimApprox(a: number[], b: number[]) {
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  const mu1 = boxBlur(a, W, H, 2), mu2 = boxBlur(b, W, H, 2);
  const aa = a.map((v) => v * v), bb = b.map((v) => v * v), ab = a.map((v, i) => v * b[i]);
  const s1 = boxBlur(aa, W, H, 2), s2 = boxBlur(bb, W, H, 2), s12 = boxBlur(ab, W, H, 2);
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const sig1 = s1[i] - mu1[i] ** 2, sig2 = s2[i] - mu2[i] ** 2, sig12 = s12[i] - mu1[i] * mu2[i];
    total += ((2 * mu1[i] * mu2[i] + C1) * (2 * sig12 + C2)) / ((mu1[i] ** 2 + mu2[i] ** 2 + C1) * (sig1 + sig2 + C2));
  }
  return total / a.length;
}

/** SsimLab (Module 50.1): live, approximate PSNR vs SSIM -- a noise-strength slider and a
 *  DC-shift slider, both calibrated to the same MSE, showing SSIM diverge from PSNR exactly
 *  as the chapter's own real Python result found. */
export function SsimLab({ caption }: { caption?: string }) {
  const [mode, setMode] = useState<"noise" | "shift">("noise");
  const [strength, setStrength] = useState(10);

  const rand = mulberry32(Math.round(strength * 97) + (mode === "noise" ? 1 : 2));
  const distorted = mode === "noise"
    ? CLEAN.map((v) => Math.max(0, Math.min(255, v + strength * gaussian(rand))))
    : CLEAN.map((v) => Math.max(0, Math.min(255, v + strength)));

  const p = psnr(CLEAN, distorted);
  const s = ssimApprox(CLEAN, distorted);

  return (
    <figure className="fig ssimlab">
      <div role="group" aria-label="Distortion type" style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" onClick={() => setMode("noise")} style={{ background: "none", border: mode === "noise" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>Additive noise</button>
        <button type="button" onClick={() => setMode("shift")} style={{ background: "none", border: mode === "shift" ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>DC brightness shift</button>
      </div>
      <label className="ctl ctl-wide"><span>Strength <output>{strength}</output></span>
        <input type="range" min={1} max={30} step={1} value={strength} onChange={(e) => setStrength(Number(e.target.value))} aria-label="Distortion strength" /></label>
      <ul className="ap-stats">
        <li><span>PSNR</span><strong>{Number.isFinite(p) ? `${p.toFixed(2)}dB` : "inf"}</strong></li>
        <li><span>SSIM (approx.)</span><strong style={{ color: s > 0.9 ? "#2da44e" : s > 0.6 ? "#d4a72c" : "#cf222e" }}>{s.toFixed(4)}</strong></li>
      </ul>
      <div className="pg-readout"><span>Live, approximate PSNR/SSIM on a small synthetic test pattern. At the same strength, additive noise and a DC shift give similar PSNR but very different SSIM -- exactly this chapter's own real, verified Python result.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
