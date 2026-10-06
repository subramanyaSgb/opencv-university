"use client";

import { useMemo, useState } from "react";
import { ScatterPlot, makeScale, useTextureTiles, type Pt } from "./classify-kit";
import { Seg, Slider } from "./lab-kit";

// Deterministic tiny PRNG (mulberry32) so k-means initialisation is reproducible across renders.
function rngOf(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function kmeans(points: Pt[], k: number, seed = 42) {
  const rng = rngOf(seed);
  const idx = [...points.keys()].sort(() => rng() - 0.5).slice(0, k);
  let centers = idx.map((i) => ({ x: points[i].x, y: points[i].y }));
  let assign = new Array(points.length).fill(0);
  for (let iter = 0; iter < 50; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = (points[i].x - centers[c].x) ** 2 + (points[i].y - centers[c].y) ** 2;
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assign[i] !== best) changed = true;
      assign[i] = best;
    }
    const sums = Array.from({ length: k }, () => ({ x: 0, y: 0, n: 0 }));
    for (let i = 0; i < points.length; i++) { const c = assign[i]; sums[c].x += points[i].x; sums[c].y += points[i].y; sums[c].n++; }
    centers = sums.map((s, c) => (s.n ? { x: s.x / s.n, y: s.y / s.n } : centers[c]));
    if (!changed) break;
  }
  let wcss = 0;
  for (let i = 0; i < points.length; i++) { const c = assign[i]; wcss += (points[i].x - centers[c].x) ** 2 + (points[i].y - centers[c].y) ** 2; }
  return { centers, assign, wcss };
}

/** ClusterLab (Module 36.8): live k-means (cv2.kmeans's algorithm, reimplemented in TS) on the same
 *  texture tile feature space as 36.1-36.7, run with NO labels. Toggle between the discovered clusters
 *  and the true classes to see how well unsupervised clustering rediscovers them. */
export function ClusterLab({ initialK = 3, caption }: { initialK?: number; caption?: string }) {
  const points = useTextureTiles();
  const [k, setK] = useState(initialK);
  const [view, setView] = useState<"clusters" | "true">("clusters");

  const result = useMemo(() => (points ? kmeans(points, k) : null), [points, k]);
  if (!points || !result) return <p>Loading…</p>;

  const clusterLabels = Array.from({ length: k }, (_, i) => `cluster ${i}`);
  const clusterPts: Pt[] = points.map((p, i) => ({ ...p, label: clusterLabels[result.assign[i]] }));
  const trueLabels = [...new Set(points.map((p) => p.label))];

  // majority-vote agreement between clusters and true labels (only meaningful at k = number of true classes)
  const agreement = useMemo(() => {
    if (k !== trueLabels.length) return null;
    let correct = 0;
    for (let c = 0; c < k; c++) {
      const counts: Record<string, number> = {};
      for (let i = 0; i < points.length; i++) if (result.assign[i] === c) counts[points[i].label] = (counts[points[i].label] ?? 0) + 1;
      const best = Math.max(0, ...Object.values(counts));
      correct += best;
    }
    return correct / points.length;
  }, [points, result, k, trueLabels.length]);

  const xDomain: [number, number] = [80, 200], yDomain: [number, number] = [0, 60];
  const { sx, sy } = makeScale(xDomain, yDomain, 320, 320);

  return (
    <figure className="fig cklab">
      <Slider label="k" v={k} set={setK} min={1} max={6} step={1} />
      <Seg label="Colour by" opts={[["clusters", "k-means cluster (unsupervised)"], ["true", "true texture class"]]} v={view} set={(v) => setView(v as "clusters" | "true")} />
      <ScatterPlot
        points={view === "clusters" ? clusterPts : points} labels={view === "clusters" ? clusterLabels : trueLabels}
        xDomain={xDomain} yDomain={yDomain} xLabel="tile mean grey level" yLabel="tile std. dev."
        extra={result.centers.map((c, i) => <circle key={i} cx={sx(c.x)} cy={sy(c.y)} r={5} fill="none" stroke="#111" strokeWidth={1.5} />)}
      />
      <p className="lk-read">
        k-means found {k} cluster{k === 1 ? "" : "s"} with total within-cluster distance² (WCSS) <b>{result.wcss.toFixed(0)}</b>, using no labels at all.
        {agreement !== null && <> At k=3, matching each cluster to its majority true class gives <b>{(agreement * 100).toFixed(1)}%</b> agreement with the real texture labels.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
