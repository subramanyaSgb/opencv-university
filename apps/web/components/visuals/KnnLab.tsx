"use client";

import { useState } from "react";
import { ScatterPlot, decisionRegion, makeScale, useTextureTiles, type Pt } from "./classify-kit";
import { Slider } from "./lab-kit";

function kNearest(points: Pt[], x: number, y: number, k: number) {
  return [...points].map((p) => ({ ...p, d: Math.hypot(p.x - x, p.y - y) })).sort((a, b) => a.d - b.d).slice(0, k);
}
function vote(neigh: { label: string }[]): string {
  const counts: Record<string, number> = {};
  for (const n of neigh) counts[n.label] = (counts[n.label] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** KnnLab (Module 36.3): k-nearest-neighbours decision regions on the same texture tile feature space as
 *  36.1-36.2; drag k, click a point to see its k nearest neighbours highlighted and the vote. */
export function KnnLab({ initialK = 5, caption }: { initialK?: number; caption?: string }) {
  const points = useTextureTiles();
  const [k, setK] = useState(initialK);
  const [test, setTest] = useState<{ x: number; y: number } | null>(null);

  if (!points) return <p>Loading…</p>;
  const labels = [...new Set(points.map((p) => p.label))];
  const xDomain: [number, number] = [80, 200], yDomain: [number, number] = [0, 60];
  const classify = (x: number, y: number) => vote(kNearest(points, x, y, k));
  const bg = decisionRegion(labels, xDomain, yDomain, 320, 320, classify, 32);
  const neigh = test ? kNearest(points, test.x, test.y, k) : null;
  const { sx, sy } = makeScale(xDomain, yDomain, 320, 320);
  const counts: Record<string, number> = {};
  if (neigh) for (const n of neigh) counts[n.label] = (counts[n.label] ?? 0) + 1;

  return (
    <figure className="fig cklab">
      <Slider label="k" v={k} set={setK} min={1} max={21} step={2} />
      <ScatterPlot
        points={points} labels={labels} xDomain={xDomain} yDomain={yDomain} xLabel="tile mean grey level" yLabel="tile std. dev."
        test={test ? { ...test, label: neigh ? vote(neigh) : undefined } : undefined}
        onPick={(x, y) => setTest({ x, y })}
        background={bg}
        extra={neigh?.map((n, i) => <circle key={i} cx={sx(n.x)} cy={sy(n.y)} r={7} fill="none" stroke="#111" strokeWidth={1} opacity={0.6} />)}
      />
      <p className="lk-read">
        Shaded regions: the predicted class at every point, for the current k. Click to drop a test point; its k nearest
        neighbours are ringed in black.
        {neigh && test && <> Vote: {Object.entries(counts).map(([l, c]) => `${l} ${c}`).join(", ")} → <b>{vote(neigh)}</b>.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
