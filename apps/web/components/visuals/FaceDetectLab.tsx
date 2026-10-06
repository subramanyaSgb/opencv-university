"use client";

import { useEffect, useState } from "react";
import { useGrays, GrayView, rect, both, Check } from "./lab-kit";

type Face = { box: [number, number, number, number]; eyes: [number, number, number, number][]; iou: number };
type Data = { imageSize: [number, number]; groundTruth: [number, number, number, number][]; faces: Face[] };

/** FaceDetectLab (Module 37.5): the full pipeline on one scene -- real cv2.CascadeClassifier face
 *  detection (multi-scale, two different face sizes), eye detection within each found face (alignment/
 *  verification), and IoU against the known ground-truth placement. Precomputed by
 *  scripts/gen_facedetect_data.py. */
export function FaceDetectLab({ caption }: { caption?: string }) {
  const g = useGrays(["/images/sample-synth-face-scene.png"])?.[0];
  const [data, setData] = useState<Data | null>(null);
  const [showGt, setShowGt] = useState(true);
  const [showEyes, setShowEyes] = useState(true);

  useEffect(() => {
    fetch("/data/facedetect-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!g || !data) return <p>Loading…</p>;
  const overlay = both(
    showGt ? both(...data.groundTruth.map(([x, y, w, h]) => rect(x, y, w, h, "rgba(47,174,92,0.8)", 1))) : undefined,
    ...data.faces.map((f) => rect(...f.box, "#e0393e", 2)),
    showEyes ? both(...data.faces.flatMap((f) => f.eyes.map(([ex, ey, ew, eh]) => rect(f.box[0] + ex, f.box[1] + ey, ew, eh, "#3aa0ff", 1.5)))) : undefined,
  );

  return (
    <figure className="fig lklab">
      <div className="sc-ctl">
        <Check label="Show ground truth (green)" v={showGt} set={setShowGt} />
        <Check label="Show detected eyes (blue)" v={showEyes} set={setShowEyes} />
      </div>
      <GrayView d={g.d} w={g.w} h={g.h} scale={1.4} overlay={overlay} label="red = detected face; green = true placement; blue = detected eyes within the face" />
      <p className="lk-read">
        {data.faces.map((f, i) => `Face ${i + 1}: box ${f.box.join(",")}, IoU vs ground truth ${f.iou}, ${f.eyes.length} eye(s) found`).join(" — ")}.
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
