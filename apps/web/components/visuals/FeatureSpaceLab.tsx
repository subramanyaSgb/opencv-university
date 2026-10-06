"use client";

import { useState } from "react";
import { ScatterPlot, makeScale, useTextureTiles, centroidsOf } from "./classify-kit";

/** FeatureSpaceLab (Module 36.1): mean/std tile features of three texture classes (reusing 35.1's images)
 *  as a 2-D feature space; click anywhere to drop a test point and see its nearest class by eye (centroid distance). */
export function FeatureSpaceLab({ caption }: { caption?: string }) {
  const points = useTextureTiles();
  const [test, setTest] = useState<{ x: number; y: number } | null>(null);

  if (!points) return <p>Loading…</p>;
  const centroids = centroidsOf(points);
  const labels = centroids.map((c) => c.label);
  const nearest = test && centroids.reduce((best, c) => (Math.hypot(test.x - c.x, test.y - c.y) < Math.hypot(test.x - best.x, test.y - best.y) ? c : best));
  const xDomain: [number, number] = [80, 200], yDomain: [number, number] = [0, 60];
  const { sx, sy } = makeScale(xDomain, yDomain, 320, 320);

  return (
    <figure className="fig cklab">
      <ScatterPlot
        points={points} labels={labels} xDomain={xDomain} yDomain={yDomain} xLabel="tile mean grey level" yLabel="tile std. dev."
        test={test ? { ...test, label: nearest?.label } : undefined}
        onPick={(x, y) => setTest({ x, y })}
        extra={centroids.map((c, i) => <circle key={i} cx={sx(c.x)} cy={sy(c.y)} r={4} fill="none" stroke="#111" strokeWidth={1.5} />)}
      />
      <p className="lk-read">
        Each point is one 8×8 tile of a texture image (81 tiles each). Click anywhere to drop a test point (black ring);
        it is coloured by the nearest class **centroid** (small black circles).
        {nearest && test && <> Test point ({test.x.toFixed(1)}, {test.y.toFixed(1)}) → nearest class: <b>{nearest.label}</b>.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
