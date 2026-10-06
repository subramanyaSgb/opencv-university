"use client";

import { useMemo, useState } from "react";
import { useGrays, GrayView, Seg, Slider } from "./lab-kit";

const TRAIN: { name: string; label: string }[] = [];
for (const id of ["a", "b", "c"]) for (const s of [0, 1, 2]) TRAIN.push({ name: `${id}-${s}`, label: id });
const TEST = [
  { name: "a-test", label: "a" }, { name: "b-test", label: "b" }, { name: "c-test", label: "c" },
  { name: "unknown", label: "?" },
];
const src = (name: string) => `/images/sample-synth-identity-${name}.png`;

const OFFS: [number, number][] = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];
const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
const GRID = 8, BINS = 256;

/** Builds an LBPH-style feature vector: per-pixel LBP code (35.1), histogrammed over an 8x8 grid of
 *  regions spanning the whole image (OpenCV's LBPH default grid_x=grid_y=8), concatenated. An
 *  illustrative reimplementation, not guaranteed bit-exact to cv2.face.LBPHFaceRecognizer. */
function lbpHistogram(d: ArrayLike<number>, w: number, h: number): Float64Array {
  const code = new Int16Array(w * h).fill(-1);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const c = d[y * w + x];
      let v = 0;
      for (let i = 0; i < 8; i++) {
        const [dy, dx] = OFFS[i];
        if (d[(y + dy) * w + (x + dx)] >= c) v |= WEIGHTS[i];
      }
      code[y * w + x] = v;
    }
  }
  const feat = new Float64Array(GRID * GRID * BINS);
  const cw = w / GRID, ch = h / GRID;
  for (let y = 1; y < h - 1; y++) {
    const gy = Math.min(GRID - 1, Math.floor(y / ch));
    for (let x = 1; x < w - 1; x++) {
      const gx = Math.min(GRID - 1, Math.floor(x / cw));
      const v = code[y * w + x];
      if (v >= 0) feat[(gy * GRID + gx) * BINS + v]++;
    }
  }
  return feat;
}
function chiSquare(a: Float64Array, b: Float64Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const sum = a[i] + b[i]; if (sum > 0) s += ((a[i] - b[i]) ** 2) / sum; }
  return s;
}

/** FaceRecLab (Module 37.6): an LBPH-style face recognizer, run live in the browser -- per-pixel LBP
 *  (35.1) histogrammed over an 8x8 grid, chi-squared distance (12.x) to every training example, nearest
 *  wins, with a threshold for open-set "unknown person" rejection. */
export function FaceRecLab({ caption }: { caption?: string }) {
  const allNames = [...TRAIN.map((t) => t.name), ...TEST.map((t) => t.name)];
  const imgs = useGrays(allNames.map(src));
  const [testName, setTestName] = useState("a-test");
  const [threshold, setThreshold] = useState(6000);

  const feats = useMemo(() => {
    if (!imgs) return null;
    const map = new Map<string, Float64Array>();
    allNames.forEach((name, i) => map.set(name, lbpHistogram(imgs[i].d, imgs[i].w, imgs[i].h)));
    return map;
  }, [imgs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!imgs || !feats) return <p>Loading…</p>;
  const testImg = imgs[allNames.indexOf(testName)];
  const testFeat = feats.get(testName)!;
  const distances = TRAIN.map((t) => ({ ...t, d: chiSquare(testFeat, feats.get(t.name)!) })).sort((a, b) => a.d - b.d);
  const best = distances[0];
  const accepted = best.d <= threshold;

  return (
    <figure className="fig lklab">
      <Seg label="Classify" opts={TEST.map((t) => [t.name, `${t.label === "?" ? "unknown person" : `test ${t.label}`}`] as [string, string])} v={testName} set={setTestName} />
      <Slider label="Rejection threshold (chi-squared distance)" v={threshold} set={setThreshold} min={1000} max={12000} step={500} />
      <div className="lk-grid">
        <GrayView d={testImg.d} w={testImg.w} h={testImg.h} scale={1.5} label={`classifying: ${testName}`} />
        <div className="lk-wrap">
          <table className="lk-table">
            <thead><tr><th>Training image</th><th>Identity</th><th>χ² distance</th></tr></thead>
            <tbody>
              {distances.map((d) => (
                <tr key={d.name} style={d.name === best.name ? { fontWeight: "bold" } : undefined}>
                  <td>{d.name}</td><td>{d.label}</td><td>{d.d.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="lk-read">
        Nearest training example: <b>{best.name}</b> (identity <b>{best.label}</b>), distance <b>{best.d.toFixed(0)}</b>.{" "}
        {accepted ? <>Below threshold → <b>recognised as {best.label}</b>.</> : <>Above threshold → <b>rejected as unknown</b>.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
