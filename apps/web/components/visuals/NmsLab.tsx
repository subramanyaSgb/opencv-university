"use client";

import { useEffect, useMemo, useState } from "react";
import { useGrays, GrayView, rect, both, Seg, Slider } from "./lab-kit";

type Box = { x: number; y: number; w: number; h: number; score: number };
type Data = { face: { image: string; boxes: Box[] }; board: { image: string; boxes: Box[] } };

function iou(a: Box, b: Box): number {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}
/** Greedy non-max suppression: highest score first, suppress anything with IoU above the threshold. */
function nms(boxes: Box[], iouThresh: number): Box[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: Box[] = [];
  for (const b of sorted) {
    if (!kept.some((k) => iou(k, b) > iouThresh)) kept.push(b);
  }
  return kept;
}

/** NmsLab (Module 37.4): live greedy NMS (run in the browser) on real raw detections -- 37.2's 9 raw
 *  cascade windows (with real levelWeights) and 37.1's 53 raw board-template matches, precomputed by
 *  scripts/gen_nms_data.py since the detections themselves come from cv2.CascadeClassifier/matchTemplate. */
export function NmsLab({ caption }: { caption?: string }) {
  const [scene, setScene] = useState<"face" | "board">("board");
  const [iouThresh, setIouThresh] = useState(0.3);
  const [data, setData] = useState<Data | null>(null);
  const g = useGrays([scene === "face" ? "/images/sample-synth-face.png" : "/images/sample-board.png"])?.[0];

  useEffect(() => {
    fetch("/data/nms-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const boxes = data?.[scene].boxes ?? [];
  const kept = useMemo(() => nms(boxes, iouThresh), [boxes, iouThresh]);

  if (!g || !data) return <p>Loading…</p>;
  const overlay = both(
    ...boxes.map((b) => rect(b.x, b.y, b.w, b.h, "rgba(58,160,255,0.5)", 1)),
    ...kept.map((b) => rect(b.x, b.y, b.w, b.h, "#e0393e", 2)),
  );

  return (
    <figure className="fig lklab">
      <Seg label="Scene" opts={[["board", "Board (37.1, 53 raw matches)"], ["face", "Face (37.2, 9 raw windows)"]]} v={scene} set={(s) => setScene(s as "face" | "board")} />
      <Slider label="IoU threshold" v={iouThresh} set={setIouThresh} min={0.05} max={0.9} step={0.05} />
      <GrayView d={g.d} w={g.w} h={g.h} scale={scene === "face" ? 1.6 : 2.2} overlay={overlay} label={`blue = all raw detections (${boxes.length}); red = kept after NMS (${kept.length})`} />
      <p className="lk-read">
        Greedy NMS: take the highest-scoring box, discard every other box overlapping it with IoU &gt; {iouThresh.toFixed(2)}, repeat.
        At this threshold: <b>{boxes.length}</b> raw → <b>{kept.length}</b> final detection{kept.length === 1 ? "" : "s"}.
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
