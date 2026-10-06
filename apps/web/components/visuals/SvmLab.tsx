"use client";

import { useEffect, useState } from "react";
import { ScatterPlot, makeScale, classColour, type Pt } from "./classify-kit";
import { Seg } from "./lab-kit";

type Data = {
  names: string[]; xDomain: [number, number]; yDomain: [number, number]; grid: number;
  points: Pt[];
  linear: { region: number[]; supportVectors: [number, number][]; trainAccuracy: number };
  rbf: { region: number[]; supportVectors: [number, number][]; trainAccuracy: number; C: number; gamma: number };
};

/** SvmLab (Module 36.4): linear vs RBF cv2.ml.SVM decision regions on the same texture tile feature space
 *  as 36.1-36.3, precomputed (scripts/gen_svm_data.py) since a real SVM solver is impractical to
 *  reimplement faithfully in the browser. Support vectors are ringed. */
export function SvmLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [kernel, setKernel] = useState<"linear" | "rbf">("linear");

  useEffect(() => {
    fetch("/data/svm-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;
  const model = data[kernel];
  const { sx, sy } = makeScale(data.xDomain, data.yDomain, 320, 320);
  const cw = (320 - 56) / data.grid, ch = (320 - 56) / data.grid;
  const bg = (
    <g>
      {model.region.map((label, i) => {
        const gx = i % data.grid, gy = Math.floor(i / data.grid);
        return <rect key={i} x={28 + gx * cw} y={28 + gy * ch} width={cw + 0.5} height={ch + 0.5} fill={classColour(data.names, data.names[label])} opacity={0.16} />;
      })}
    </g>
  );

  return (
    <figure className="fig cklab">
      <Seg label="Kernel" opts={[["linear", "Linear"], ["rbf", "RBF"]]} v={kernel} set={(k) => setKernel(k as "linear" | "rbf")} />
      <ScatterPlot
        points={data.points} labels={data.names} xDomain={data.xDomain} yDomain={data.yDomain}
        xLabel="tile mean grey level" yLabel="tile std. dev." background={bg}
        extra={model.supportVectors.map(([x, y], i) => <circle key={i} cx={sx(x)} cy={sy(y)} r={7} fill="none" stroke="#111" strokeWidth={1.2} opacity={0.7} />)}
      />
      <p className="lk-read">
        {kernel === "linear" ? (
          <>Linear kernel: straight boundaries. Training accuracy <b>{(model.trainAccuracy * 100).toFixed(1)}%</b>, <b>{model.supportVectors.length}</b> of {data.points.length} points are support vectors (black rings).</>
        ) : (
          <>RBF kernel (C={(model as Data["rbf"]).C}, γ={(model as Data["rbf"]).gamma}): curved boundaries. Training accuracy <b>{(model.trainAccuracy * 100).toFixed(1)}%</b>, <b>{model.supportVectors.length}</b> of {data.points.length} points are support vectors — a very high fraction, a real overfitting warning sign.</>
        )}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
