"use client";

import { useMemo, useState } from "react";
import { useGrays, GrayView, rect, both, type Paint } from "./lab-kit";

const CELL = 8, NBINS = 9, BINW = 180 / NBINS;

type Grad = { mag: Float64Array; ang: Float64Array; w: number; h: number };

/** Simple centred gradient (Dalal-Triggs' own choice: [-1,0,1], no smoothing), replicated border. */
function gradients(d: ArrayLike<number>, w: number, h: number): Grad {
  const mag = new Float64Array(w * h), ang = new Float64Array(w * h);
  const at = (x: number, y: number) => d[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = at(x + 1, y) - at(x - 1, y);
      const gy = at(x, y + 1) - at(x, y - 1);
      mag[y * w + x] = Math.hypot(gx, gy);
      let a = (Math.atan2(gy, gx) * 180) / Math.PI;
      a = ((a % 180) + 180) % 180;                 // unsigned orientation, 0-180
      ang[y * w + x] = a;
    }
  }
  return { mag, ang, w, h };
}

/** Unnormalised 9-bin orientation histogram of one 8x8 cell (hard binning, magnitude-weighted). */
function cellHistogram(g: Grad, cx: number, cy: number): number[] {
  const hist = new Array(NBINS).fill(0);
  for (let dy = 0; dy < CELL; dy++) {
    for (let dx = 0; dx < CELL; dx++) {
      const x = cx * CELL + dx, y = cy * CELL + dy;
      if (x >= g.w || y >= g.h) continue;
      const bin = Math.min(NBINS - 1, Math.floor(g.ang[y * g.w + x] / BINW));
      hist[bin] += g.mag[y * g.w + x];
    }
  }
  return hist;
}

/** Draws every cell's histogram as a "rose" of line segments (classic HOG visualisation): one line per bin,
 *  through the cell centre, at the bin's angle, with length proportional to the bin's share of the cell's total. */
function roseOverlay(g: Grad, cellsX: number, cellsY: number, sel: [number, number] | null): Paint {
  return (ctx, s) => {
    for (let cy = 0; cy < cellsY; cy++) {
      for (let cx = 0; cx < cellsX; cx++) {
        const hist = cellHistogram(g, cx, cy);
        const total = hist.reduce((a, b) => a + b, 0) || 1;
        const ccx = (cx * CELL + CELL / 2) * s, ccy = (cy * CELL + CELL / 2) * s;
        ctx.strokeStyle = cx === sel?.[0] && cy === sel?.[1] ? "#e0393e" : "rgba(80,160,255,0.85)";
        for (let b = 0; b < NBINS; b++) {
          const frac = hist[b] / total;
          if (frac < 0.02) continue;
          const theta = ((b + 0.5) * BINW * Math.PI) / 180;
          const len = frac * CELL * s * 0.95;
          const dx = Math.cos(theta) * len, dy = Math.sin(theta) * len;
          ctx.lineWidth = cx === sel?.[0] && cy === sel?.[1] ? 2 : 1;
          ctx.beginPath(); ctx.moveTo(ccx - dx, ccy - dy); ctx.lineTo(ccx + dx, ccy + dy); ctx.stroke();
        }
      }
    }
  };
}

/** HogLab (Module 35): HOG cell histograms on a 64x64 crop — the classic "rose of lines" visualisation,
 *  click a cell to read its 9-bin orientation histogram. */
export function HogLab({ src = "/images/sample-hog-l.png", caption }: { src?: string; caption?: string }) {
  const g = useGrays([src])?.[0];
  const [sel, setSel] = useState<[number, number] | null>(null);

  const grad = useMemo(() => (g ? gradients(g.d, g.w, g.h) : null), [g]);
  if (!g || !grad) return <p>Loading…</p>;
  const cellsX = Math.floor(g.w / CELL), cellsY = Math.floor(g.h / CELL);
  const hist = sel ? cellHistogram(grad, sel[0], sel[1]) : null;
  const overlay = both(
    roseOverlay(grad, cellsX, cellsY, sel),
    sel ? rect(sel[0] * CELL, sel[1] * CELL, CELL, CELL, "#e0393e", 1.5) : undefined,
  );

  return (
    <figure className="fig lklab">
      <div className="lk-grid">
        <GrayView
          d={g.d} w={g.w} h={g.h} scale={7} overlay={overlay}
          label={`${g.w}×${g.h}, ${CELL}×${CELL} cells; click a cell for its histogram`}
          onPick={(x, y) => setSel([Math.min(cellsX - 1, Math.floor(x / CELL)), Math.min(cellsY - 1, Math.floor(y / CELL))])}
        />
        {hist && (
          <div>
            <p className="lk-read">Cell ({sel![0]}, {sel![1]}) — unnormalised histogram, 9 bins of 20°:</p>
            <div className="lk-wrap">
              <table className="lk-table">
                <thead><tr><th>bin</th>{hist.map((_, b) => <th key={b}>{b * 20}–{b * 20 + 20}°</th>)}</tr></thead>
                <tbody><tr><th>Σ|∇|</th>{hist.map((v, b) => <td key={b}>{v.toFixed(0)}</td>)}</tr></tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
