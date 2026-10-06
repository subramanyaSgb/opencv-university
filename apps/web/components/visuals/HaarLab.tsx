"use client";

import { useMemo, useState } from "react";
import { useGrays, GrayView, both, rect, Seg, Slider } from "./lab-kit";

/** Build the integral image (one extra zero row/column, exactly cv2.integral's convention):
 *  S[y+1][x+1] = S[y][x+1] + S[y+1][x] - S[y][x] + d[y][x]. */
function buildIntegral(d: ArrayLike<number>, w: number, h: number): Float64Array {
  const S = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = S[y * (w + 1) + (x + 1)];       // S[y][x+1]
      const b = S[(y + 1) * (w + 1) + x];       // S[y+1][x]
      const c = S[y * (w + 1) + x];             // S[y][x]
      S[(y + 1) * (w + 1) + (x + 1)] = a + b - c + d[y * w + x];
    }
  }
  return S;
}
function rectSum(S: Float64Array, w: number, x0: number, y0: number, x1: number, y1: number): number {
  const W = w + 1;
  return S[(y1 + 1) * W + (x1 + 1)] - S[y0 * W + (x1 + 1)] - S[(y1 + 1) * W + x0] + S[y0 * W + x0];
}
const area = (x0: number, y0: number, x1: number, y1: number) => (x1 - x0 + 1) * (y1 - y0 + 1);

/** HaarLab (Module 35): two Haar-like features on the schematic face — a 2-rectangle feature (slide its
 *  vertical position) and the fixed 3-rectangle eyes-vs-bridge feature — both computed from a live integral image. */
export function HaarLab({ initialPattern = "2rect", caption }: { initialPattern?: "2rect" | "3rect"; caption?: string }) {
  const [pattern, setPattern] = useState<"2rect" | "3rect">(initialPattern);
  const [y, setY] = useState(10);
  const g = useGrays(["/images/sample-haar-face.png"])?.[0];
  const S = useMemo(() => (g ? buildIntegral(g.d, g.w, g.h) : null), [g]);

  if (!g || !S) return <p>Loading…</p>;

  let boxes: { x0: number; y0: number; x1: number; y1: number; sign: 1 | -1 }[];
  let value: number;
  if (pattern === "2rect") {
    const top = { x0: 4, y0: y, x1: 19, y1: y + 3, sign: 1 as const };
    const bot = { x0: 4, y0: y + 4, x1: 19, y1: y + 7, sign: -1 as const };
    boxes = [top, bot];
    const meanTop = rectSum(S, g.w, top.x0, top.y0, top.x1, top.y1) / area(top.x0, top.y0, top.x1, top.y1);
    const meanBot = rectSum(S, g.w, bot.x0, bot.y0, bot.x1, bot.y1) / area(bot.x0, bot.y0, bot.x1, bot.y1);
    value = meanTop - meanBot;
  } else {
    const left = { x0: 4, y0: 8, x1: 9, y1: 13, sign: -1 as const };
    const right = { x0: 14, y0: 8, x1: 19, y1: 13, sign: -1 as const };
    const mid = { x0: 10, y0: 8, x1: 13, y1: 13, sign: 1 as const };
    boxes = [left, mid, right];
    const meanOuter = (rectSum(S, g.w, left.x0, left.y0, left.x1, left.y1) + rectSum(S, g.w, right.x0, right.y0, right.x1, right.y1))
      / (area(left.x0, left.y0, left.x1, left.y1) + area(right.x0, right.y0, right.x1, right.y1));
    const meanMid = rectSum(S, g.w, mid.x0, mid.y0, mid.x1, mid.y1) / area(mid.x0, mid.y0, mid.x1, mid.y1);
    value = meanMid - meanOuter;
  }

  const overlay = both(...boxes.map((b) => rect(b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, b.sign > 0 ? "#3aa0ff" : "#e0393e", 2)));

  return (
    <figure className="fig lklab">
      <Seg label="Feature" opts={[["2rect", "2-rectangle (eyes row vs cheek row)"], ["3rect", "3-rectangle (eyes vs nose bridge)"]]} v={pattern} set={setPattern} />
      {pattern === "2rect" && <Slider label="Top band, starting row" v={y} set={setY} min={0} max={16} step={1} />}
      <div className="lk-grid">
        <GrayView d={g.d} w={g.w} h={g.h} scale={10} overlay={overlay} label="24×24 schematic face (blue = positive-weight rectangle, red = negative)" />
      </div>
      <p className="lk-read">Feature value = mean(blue) − mean(red) = <b>{value.toFixed(1)}</b> grey levels.</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
