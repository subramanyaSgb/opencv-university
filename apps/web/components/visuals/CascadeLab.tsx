"use client";

import { useEffect, useState } from "react";
import { useGrays, GrayView, rect, both, Seg } from "./lab-kit";

type Data = {
  imageSize: [number, number]; windowSize: [number, number]; minNeighbours: number[];
  detections: Record<string, [number, number, number, number][]>;
};

/** CascadeLab (Module 37.2): real cv2.CascadeClassifier.detectMultiScale output (precomputed,
 *  scripts/gen_cascade_data.py) on sample-synth-face.png, at several minNeighbors settings — minNeighbors=0
 *  shows every raw stage-surviving window, higher values show OpenCV's built-in rectangle grouping. */
export function CascadeLab({ caption }: { caption?: string }) {
  const g = useGrays(["/images/sample-synth-face.png"])?.[0];
  const [data, setData] = useState<Data | null>(null);
  const [mn, setMn] = useState("1");

  useEffect(() => {
    fetch("/data/cascade-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!g || !data) return <p>Loading…</p>;
  const boxes = data.detections[mn] ?? [];
  const overlay = both(...boxes.map(([x, y, w, h]) => rect(x, y, w, h, "#e0393e", 2)));

  return (
    <figure className="fig lklab">
      <Seg label="minNeighbors" opts={data.minNeighbours.map((k) => [String(k), String(k)] as [string, string])} v={mn} set={setMn} />
      <GrayView d={g.d} w={g.w} h={g.h} scale={1.6} overlay={overlay} label={`${g.w}x${g.h}, cascade base window ${data.windowSize[0]}x${data.windowSize[1]}`} />
      <p className="lk-read">
        minNeighbors={mn}: <b>{boxes.length}</b> detection{boxes.length === 1 ? "" : "s"}.
        {mn === "0" && " Every window that survived all cascade stages, with no grouping at all."}
        {mn !== "0" && Number(mn) <= 5 && boxes.length === 1 && " OpenCV's built-in rectangle grouping merged the raw cluster into one box."}
        {mn === "10" && boxes.length === 0 && " Too strict: even the real face's cluster didn't have 10 overlapping neighbours, so nothing survives."}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
