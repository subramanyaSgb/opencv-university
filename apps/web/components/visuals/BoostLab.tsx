"use client";

import { useEffect, useState } from "react";
import { ScatterPlot, classColour, type Pt } from "./classify-kit";
import { Seg } from "./lab-kit";

type Model = { trainAccuracy: number; region: number[] };
type Data = {
  names: string[]; xDomain: [number, number]; yDomain: [number, number]; grid: number;
  points: Pt[]; weakCounts: number[]; default: Record<string, Model>; disabledTrim: Record<string, Model>;
};

/** BoostLab (Module 36.6): AdaBoost (cv2.ml.Boost, REAL, depth-1 stumps) decision regions as weak-learner
 *  count grows, on a binary Woven-vs-Blotchy subset (Boost is a 2-class algorithm). Toggle OpenCV's default
 *  weightTrimRate (0.95) against it disabled (1.0) -- the default visibly hurts this small dataset. */
export function BoostLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [weak, setWeak] = useState("10");
  const [trim, setTrim] = useState<"default" | "disabledTrim">("disabledTrim");

  useEffect(() => {
    fetch("/data/boost-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;
  const model = data[trim][weak];
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
      <Seg label="Weak learners (stumps)" opts={data.weakCounts.map((k) => [String(k), String(k)] as [string, string])} v={weak} set={setWeak} />
      <Seg label="weightTrimRate" opts={[["default", "0.95 (OpenCV default)"], ["disabledTrim", "1.0 (disabled)"]]} v={trim} set={(t) => setTrim(t as "default" | "disabledTrim")} />
      <ScatterPlot
        points={data.points} labels={data.names} xDomain={data.xDomain} yDomain={data.yDomain}
        xLabel="tile mean grey level" yLabel="tile std. dev." background={bg}
      />
      <p className="lk-read">
        Training accuracy: <b>{(model.trainAccuracy * 100).toFixed(1)}%</b> with {weak} stump{weak === "1" ? "" : "s"}.
        {trim === "default" && Number(weak) >= 10 && <> At this setting, OpenCV's default weightTrimRate (0.95) is actually hurting accuracy here — switch to 1.0 to see boosting behave as expected.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
