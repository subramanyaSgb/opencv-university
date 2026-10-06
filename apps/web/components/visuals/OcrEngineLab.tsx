"use client";

import { useEffect, useState } from "react";
import { useGrays, GrayView, rect, both } from "./lab-kit";

type Letter = { box: [number, number, number, number]; scores: Record<string, number>; predicted: string };
type Degraded = { shape: [number, number]; scores: Record<string, number> | null; predicted: string | null };
type Data = { chars: string; image: string; letters: Letter[]; degraded: Record<string, Degraded> };

/** OcrEngineLab (Module 38.3): a real from-scratch template-matching mini-OCR (38.2's segmentation +
 *  32.1-32.2's cv2.matchTemplate) on "LOT42", click a letter to see its scores against every template;
 *  plus the real scale-mismatch degradation test. Precomputed by scripts/gen_ocr_data.py. */
export function OcrEngineLab({ caption }: { caption?: string }) {
  const g = useGrays(["/images/sample-charseg-text.png"])?.[0];
  const [data, setData] = useState<Data | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    fetch("/data/ocr-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!g || !data) return <p>Loading…</p>;
  const letter = data.letters[sel];
  const overlay = both(...data.letters.map((l, i) => rect(...l.box, i === sel ? "#e0393e" : "rgba(58,160,255,0.6)", i === sel ? 2 : 1)));
  const ranked = Object.entries(letter.scores).sort((a, b) => b[1] - a[1]);

  return (
    <figure className="fig lklab">
      <GrayView d={g.d} w={g.w} h={g.h} scale={2} overlay={overlay} label="click a letter below to inspect"
        onPick={(px, py) => {
          const i = data.letters.findIndex((l) => px >= l.box[0] && px < l.box[0] + l.box[2] && py >= l.box[1] && py < l.box[1] + l.box[3]);
          if (i >= 0) setSel(i);
        }} />
      <div className="lk-wrap">
        <table className="lk-table">
          <thead><tr><th>Template</th>{ranked.map(([ch]) => <th key={ch}>{ch}</th>)}</tr></thead>
          <tbody><tr><th>NCC score</th>{ranked.map(([ch, s]) => <td key={ch} style={ch === letter.predicted ? { fontWeight: "bold", color: "#e0393e" } : undefined}>{s.toFixed(3)}</td>)}</tr></tbody>
        </table>
      </div>
      <p className="lk-read">Selected letter predicted as <b>{letter.predicted}</b> (score {ranked[0][1].toFixed(3)}).</p>
      <p className="lk-read">
        Scale-mismatch test (a &quot;4&quot; rendered at increasing scale against the same, unscaled templates):{" "}
        {Object.entries(data.degraded).map(([scale, d]) => `${scale}x→${d.predicted ?? "fails to fit"}`).join(", ")}.
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
