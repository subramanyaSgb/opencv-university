"use client";

import { useMemo, useState } from "react";
import { useGrays } from "./lab-kit";
import { ScatterPlot, makeScale, type Pt } from "./classify-kit";

const SOURCES: [string, string][] = [["woven", "/images/sample-texture-woven.png"], ["smooth", "/images/sample-texture-smooth.png"], ["blotchy", "/images/sample-texture-blotchy.png"]];
const TILE = 8;

function tileFeatures(d: ArrayLike<number>, w: number, h: number, label: string): Pt[] {
  const pts: Pt[] = [];
  for (let ty = 0; ty < Math.floor(h / TILE); ty++) {
    for (let tx = 0; tx < Math.floor(w / TILE); tx++) {
      const vals: number[] = [];
      for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) vals.push(d[(ty * TILE + y) * w + (tx * TILE + x)]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      pts.push({ x: mean, y: Math.sqrt(variance), label });
    }
  }
  return pts;
}

/** FeatureSpaceLab (Module 36.1): mean/std tile features of three texture classes (reusing 35.1's images)
 *  as a 2-D feature space; click anywhere to drop a test point and see its nearest class by eye (centroid distance). */
export function FeatureSpaceLab({ caption }: { caption?: string }) {
  const imgs = useGrays(SOURCES.map(([, src]) => src));
  const [test, setTest] = useState<{ x: number; y: number } | null>(null);

  const points = useMemo(() => {
    if (!imgs) return null;
    return SOURCES.flatMap(([label], i) => tileFeatures(imgs[i].d, imgs[i].w, imgs[i].h, label));
  }, [imgs]);

  const centroids = useMemo(() => {
    if (!points) return null;
    const labels = [...new Set(points.map((p) => p.label))];
    return labels.map((label) => {
      const pts = points.filter((p) => p.label === label);
      return { label, x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length };
    });
  }, [points]);

  if (!points || !centroids) return <p>Loading…</p>;
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
