"use client";

import { useState } from "react";
import { ScatterPlot, decisionRegion, useTextureTiles, type Pt } from "./classify-kit";

function stats(points: Pt[], label: string) {
  const pts = points.filter((p) => p.label === label);
  const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  const sx = Math.sqrt(pts.reduce((a, p) => a + (p.x - mx) ** 2, 0) / pts.length);
  const sy = Math.sqrt(pts.reduce((a, p) => a + (p.y - my) ** 2, 0) / pts.length);
  return { mx, my, sx, sy, n: pts.length };
}
const gauss = (v: number, m: number, s: number) => (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((v - m) / s) ** 2);

/** GaussNbLab (Module 36.2): Gaussian naive Bayes on the same three-texture tile feature space as 36.1 —
 *  per-class Gaussian likelihoods (mean/std per feature), equal priors, posterior by Bayes' rule.
 *  The decision-region background (curved, unlike nearest-centroid's straight bisectors) shows how a
 *  class's own spread changes its territory. */
export function GaussNbLab({ caption }: { caption?: string }) {
  const points = useTextureTiles();
  const [test, setTest] = useState<{ x: number; y: number } | null>(null);

  if (!points) return <p>Loading…</p>;
  const labels = [...new Set(points.map((p) => p.label))];
  const byClass = labels.map((label) => ({ label, ...stats(points, label) }));
  const prior = 1 / labels.length;

  function posteriors(x: number, y: number) {
    const likes = byClass.map((c) => ({ label: c.label, like: gauss(x, c.mx, c.sx) * gauss(y, c.my, c.sy) * prior }));
    const total = likes.reduce((a, l) => a + l.like, 0) || 1e-300;
    return likes.map((l) => ({ label: l.label, p: l.like / total })).sort((a, b) => b.p - a.p);
  }
  const classify = (x: number, y: number) => posteriors(x, y)[0].label;

  const xDomain: [number, number] = [80, 200], yDomain: [number, number] = [0, 60];
  const bg = decisionRegion(labels, xDomain, yDomain, 320, 320, classify);
  const post = test ? posteriors(test.x, test.y) : null;

  return (
    <figure className="fig cklab">
      <ScatterPlot
        points={points} labels={labels} xDomain={xDomain} yDomain={yDomain} xLabel="tile mean grey level" yLabel="tile std. dev."
        test={test ? { ...test, label: post?.[0].label } : undefined}
        onPick={(x, y) => setTest({ x, y })}
        background={bg}
      />
      <p className="lk-read">
        Shaded regions: which class has the highest posterior probability there (Gaussian naive Bayes, equal priors).
        Compare the curved boundaries here with 36.1's straight nearest-centroid ones — Smooth's tight spread gives it a small,
        sharply-bounded region; Blotchy's wide spread claims territory far from its own centroid.
        {post && test && <> Test point ({test.x.toFixed(1)}, {test.y.toFixed(1)}): {post.map((p) => `${p.label} ${(p.p * 100).toFixed(1)}%`).join(", ")}.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
