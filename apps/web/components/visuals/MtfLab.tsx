"use client";

import { useMemo, useState } from "react";
import { analyticGaussianMtf, lsfFromEsf, mtf50, mtfAt, sampleEsf } from "@/lib/mtf-ops";

const BIN = 0.1;
const FREQS = Array.from({ length: 41 }, (_, i) => i * 0.01);
const W = 480, H = 160;

/** MtfLab (50.4): the real slanted-edge pipeline -- ESF -> LSF -> |DFT| -- for a known Gaussian
 *  PSF (std sigma), checked live against the closed-form MTF, exp(-2 pi^2 sigma^2 f^2). The
 *  chapter's own Code section runs the same relationship on real pixels (cv2.GaussianBlur, a
 *  tilted edge, binning); this lab lets sigma move and shows measured vs analytic tracking exactly. */
export function MtfLab({ caption }: { caption?: string }) {
  const [sigma, setSigma] = useState(1.2);

  const { measured, analytic, f50 } = useMemo(() => {
    const esf = sampleEsf(sigma, BIN);
    const lsf = lsfFromEsf(esf, BIN);
    const measured = mtfAt(lsf, BIN, FREQS);
    const analytic = FREQS.map((f) => analyticGaussianMtf(f, sigma));
    return { measured, analytic, f50: mtf50(sigma) };
  }, [sigma]);

  const X = (f: number) => (f / 0.4) * W;
  const Y = (v: number) => H - 14 - Math.max(0, Math.min(1, v)) * (H - 24);

  return (
    <figure className="fig mtflab">
      <label className="ctl ctl-wide">
        <span>PSF blur σ (pixels) <output>{sigma.toFixed(1)}</output></span>
        <input type="range" min={0.4} max={2.8} step={0.1} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} aria-label="PSF sigma" />
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className="cl-svg" role="img" aria-label="Measured vs analytic MTF">
        <line x1={0} x2={W} y1={Y(0.5)} y2={Y(0.5)} className="dv-zero" />
        <line x1={X(f50)} x2={X(f50)} y1={0} y2={H} className="dv-mark" />
        <polyline fill="none" stroke="#8250df" strokeWidth={4} opacity={0.35}
          points={FREQS.map((f, i) => `${X(f)},${Y(analytic[i])}`).join(" ")} />
        <polyline fill="none" stroke="#cf222e" strokeWidth={1.6}
          points={FREQS.map((f, i) => `${X(f)},${Y(measured[i])}`).join(" ")} />
        <text x={4} y={14} className="ov-t">spatial frequency: 0 to 0.4 cycles/pixel</text>
      </svg>
      <div className="gl-legend">
        <span><span className="by-k" style={{ background: "#8250df", opacity: 0.35 }} /> analytic exp(−2π²σ²f²)</span>
        <span><span className="by-k" style={{ background: "#cf222e" }} /> measured (ESF → LSF → |DFT|)</span>
      </div>
      <ul className="ap-stats">
        <li><span>MTF50</span><strong>{f50.toFixed(4)} c/px</strong><em>frequency where MTF = 0.5</em></li>
      </ul>
      <div className="pg-readout"><span>The measured curve (real ESF → LSF → DFT magnitude pipeline) sits on top of the closed-form analytic MTF of this known Gaussian PSF at every σ -- the same check the chapter's own Code section runs on real, binned pixels.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
