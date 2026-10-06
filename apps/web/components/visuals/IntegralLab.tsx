"use client";

import { useMemo, useState } from "react";

const A = [[3, 1, 4, 1, 5, 9], [2, 6, 5, 3, 5, 8], [9, 7, 9, 3, 2, 3], [8, 4, 6, 2, 6, 4], [3, 3, 8, 3, 2, 7], [9, 5, 0, 2, 8, 8]];
const N = 6;

/** IntegralLab (17.5): a 6 × 6 image and its integral image (cv2.integral, with the extra zero row and column); pick a rectangle and see its sum from four lookups. */
export function IntegralLab({ caption }: { caption?: string }) {
  const S = useMemo(() => {
    const s = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) s[y + 1][x + 1] = A[y][x] + s[y][x + 1] + s[y + 1][x] - s[y][x];
    return s;
  }, []);
  const [x0, setX0] = useState(1), [y0, setY0] = useState(1), [x1, setX1] = useState(4), [y1, setY1] = useState(4);
  const inRect = (x: number, y: number) => x >= x0 && x < x1 && y >= y0 && y < y1;
  const corners: Record<string, string> = { [`${y1},${x1}`]: "D", [`${y0},${x1}`]: "B", [`${y1},${x0}`]: "C", [`${y0},${x0}`]: "A" };
  const direct = A.flatMap((r, y) => r.filter((_, x) => inRect(x, y))).reduce((a, b) => a + b, 0);
  const sum = S[y1][x1] - S[y0][x1] - S[y1][x0] + S[y0][x0];
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  return (
    <figure className="fig integrallab">
      <div className="sc-ctl">
        {sl("x0 (first column)", x0, (v) => { setX0(v); if (x1 <= v) setX1(v + 1); }, 0, N - 1)}
        {sl("x1 (one past the last column)", x1, (v) => { setX1(v); if (x0 >= v) setX0(v - 1); }, 1, N)}
        {sl("y0 (first row)", y0, (v) => { setY0(v); if (y1 <= v) setY1(v + 1); }, 0, N - 1)}
        {sl("y1 (one past the last row)", y1, (v) => { setY1(v); if (y0 >= v) setY0(v - 1); }, 1, N)}
      </div>
      <div className="sa-grid">
        <div>
          <div className="sa-mat" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
            {A.flatMap((r, y) => r.map((v, x) => <span key={`${y}${x}`} className={inRect(x, y) ? "is-in" : ""}>{v}</span>))}
          </div>
          <p className="sa-cap">Image (rectangle highlighted)</p>
        </div>
        <div>
          <div className="sa-mat" style={{ gridTemplateColumns: `repeat(${N + 1}, minmax(0, 1fr))` }}>
            {S.flatMap((r, y) => r.map((v, x) => { const c = corners[`${y},${x}`]; return <span key={`${y}${x}`} className={c ? `is-${c}` : y === 0 || x === 0 ? "is-zero" : ""}>{c && <i>{c}</i>}{v}</span>; }))}
          </div>
          <p className="sa-cap">Integral image S (cv2.integral): S[y][x] = sum of all pixels above and left of (x, y)</p>
        </div>
      </div>
      <p className="sa-eq">sum = D − B − C + A = S[{y1}][{x1}] − S[{y0}][{x1}] − S[{y1}][{x0}] + S[{y0}][{x0}] = {S[y1][x1]} − {S[y0][x1]} − {S[y1][x0]} + {S[y0][x0]} = <b>{sum}</b> (direct sum of {(x1 - x0) * (y1 - y0)} pixels: {direct})</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
