"use client";

import { useEffect, useState } from "react";
import { ScatterPlot, classColour, type Pt } from "./classify-kit";
import { Seg } from "./lab-kit";

type Data = {
  names: string[]; xDomain: [number, number]; yDomain: [number, number]; grid: number;
  points: Pt[];
  trees: Record<string, { region: number[]; trainAccuracy: number }>;
  forest: { region: number[]; trainAccuracy: number; oobError: number; nTrees: number };
};

/** TreeLab (Module 36.5): single decision tree (depth slider, via cv2.ml.DTrees) vs random forest
 *  (cv2.ml.RTrees) decision regions on the same texture tile feature space as 36.1-36.4 -- the
 *  characteristic axis-aligned "staircase" boundaries. Precomputed (scripts/gen_tree_data.py). */
export function TreeLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [mode, setMode] = useState<"tree" | "forest">("tree");
  const [depth, setDepth] = useState("5");

  useEffect(() => {
    fetch("/data/tree-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;
  const region = mode === "tree" ? data.trees[depth].region : data.forest.region;
  const acc = mode === "tree" ? data.trees[depth].trainAccuracy : data.forest.trainAccuracy;
  const cw = (320 - 56) / data.grid, ch = (320 - 56) / data.grid;
  const bg = (
    <g>
      {region.map((label, i) => {
        const gx = i % data.grid, gy = Math.floor(i / data.grid);
        return <rect key={i} x={28 + gx * cw} y={28 + gy * ch} width={cw + 0.5} height={ch + 0.5} fill={classColour(data.names, data.names[label])} opacity={0.16} />;
      })}
    </g>
  );

  return (
    <figure className="fig cklab">
      <Seg label="Model" opts={[["tree", "Single tree"], ["forest", "Random forest"]]} v={mode} set={(m) => setMode(m as "tree" | "forest")} />
      {mode === "tree" && <Seg label="Max depth" opts={Object.keys(data.trees).map((d) => [d, d] as [string, string])} v={depth} set={setDepth} />}
      <ScatterPlot
        points={data.points} labels={data.names} xDomain={data.xDomain} yDomain={data.yDomain}
        xLabel="tile mean grey level" yLabel="tile std. dev." background={bg}
      />
      <p className="lk-read">
        {mode === "tree" ? (
          <>Single tree, max depth {depth}: training accuracy <b>{(acc * 100).toFixed(1)}%</b>. Notice the sharp, rectangular "staircase" boundaries — every split is a single threshold on one feature.</>
        ) : (
          <>Random forest ({data.forest.nTrees} trees): training accuracy <b>{(acc * 100).toFixed(1)}%</b>, but out-of-bag error <b>{(data.forest.oobError * 100).toFixed(1)}%</b> — a more honest estimate, since each tree's OOB predictions come from data it did not train on.</>
        )}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
