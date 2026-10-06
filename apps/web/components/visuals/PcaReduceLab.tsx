"use client";

import { useEffect, useState } from "react";
import { ScatterPlot, type Pt } from "./classify-kit";

type Data = {
  featureNames: string[]; names: string[]; explainedVariance: number[];
  eigenvectors: number[][]; points: Pt[];
};

/** PcaReduceLab (Module 36.7): PCA of the 5-D GLCM Haralick features (35.2) of the three 35.1 texture
 *  images, projected to 2 principal components (cv2.PCACompute2/PCAProject). Precomputed by
 *  scripts/gen_pca_data.py since GLCM + PCA together are heavier than a quick in-browser recompute. */
export function PcaReduceLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/data/pca-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;
  const xs = data.points.map((p) => p.x), ys = data.points.map((p) => p.y);
  const pad = 0.5;
  const xDomain: [number, number] = [Math.min(...xs) - pad, Math.max(...xs) + pad];
  const yDomain: [number, number] = [Math.min(...ys) - pad, Math.max(...ys) + pad];

  return (
    <figure className="fig cklab">
      <ScatterPlot points={data.points} labels={data.names} xDomain={xDomain} yDomain={yDomain} xLabel="PC1" yLabel="PC2" />
      <p className="lk-read">
        Explained variance: PC1 <b>{(data.explainedVariance[0] * 100).toFixed(1)}%</b>, PC2 <b>{(data.explainedVariance[1] * 100).toFixed(1)}%</b> —
        together <b>{((data.explainedVariance[0] + data.explainedVariance[1]) * 100).toFixed(1)}%</b> of all 5 features'
        ({data.featureNames.join(", ")}) variance, in just 2 dimensions. Smooth separates cleanly along PC1; Woven and Blotchy overlap more, matching 36.4's finding that they aren't linearly separable.
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
