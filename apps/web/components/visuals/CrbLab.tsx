"use client";

import { useState } from "react";

const A = 100, SIGMA = 1.5;

function edgeDerivative(x: number, x0: number) {
  return (A / (SIGMA * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - x0) ** 2) / (2 * SIGMA ** 2));
}

/** CrbLab (Module 49.2): live, exact Cramer-Rao bound for sub-pixel edge localization --
 *  drag the noise level and watch the real theoretical floor change, with this chapter's
 *  own measured naive and MLE estimator results shown for comparison. */
export function CrbLab({ caption }: { caption?: string }) {
  const [noiseStd, setNoiseStd] = useState(3.0);

  const xs = Array.from({ length: 21 }, (_, i) => i - 10);
  const fisher = xs.reduce((sum, x) => sum + edgeDerivative(x, 0.3) ** 2, 0) / noiseStd ** 2;
  const crb = Math.sqrt(1 / fisher);

  // this chapter's own measured ratios at noise_std=3.0, held fixed as reference lines
  const naiveAtRef = 0.3827, mleAtRef = 0.0690;
  const refCrb = 0.0692;
  const naiveScaled = naiveAtRef * (crb / refCrb);
  const mleScaled = mleAtRef * (crb / refCrb);

  return (
    <figure className="fig crblab">
      <label className="ctl ctl-wide"><span>Noise std <output>{noiseStd.toFixed(1)}</output></span>
        <input type="range" min={0.5} max={10} step={0.1} value={noiseStd} onChange={(e) => setNoiseStd(Number(e.target.value))} aria-label="Noise std" /></label>
      <ul className="ap-stats">
        <li><span>Cramer-Rao bound (theoretical floor)</span><strong>{crb.toFixed(4)}px</strong></li>
        <li><span>Naive estimator (this chapter's own real result, scaled)</span><strong style={{ color: "#cf222e" }}>{naiveScaled.toFixed(4)}px</strong><em>{(naiveScaled / crb).toFixed(2)}x the bound</em></li>
        <li><span>MLE model-fit estimator (this chapter's own real result, scaled)</span><strong style={{ color: "#2da44e" }}>{mleScaled.toFixed(4)}px</strong><em>{(mleScaled / crb).toFixed(2)}x the bound</em></li>
      </ul>
      <div className="pg-readout"><span>Live, exact Cramer-Rao bound (Fisher information for a Gaussian-blurred edge). The naive and MLE comparison lines use this chapter's own real, measured ratios (5.532x and 0.998x) scaled to the current noise level.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
