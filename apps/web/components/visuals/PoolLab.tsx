"use client";

import { useMemo, useState } from "react";
import { avgPool2x2, maxPool2x2, maxPoolArgmax, type Grid } from "@/lib/pool-ops";
import { gauss, rng } from "@/lib/sensor-ops";

const SIZE = 8;
const CELL = 26;

function makeGrid(seed: number): Grid {
  const r = rng(seed);
  const g: Grid = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 128 + 40 * gauss(r)));
  g[3][5] = 250; // one strong "feature"
  return g;
}

function shiftGrid(g: Grid, di: number, dj: number): Grid {
  const H = g.length, W = g[0].length;
  return Array.from({ length: H }, (_, i) => Array.from({ length: W }, (_, j) => g[(i - di + H) % H][(j - dj + W) % W]));
}

function GridView({ grid, cell = CELL, highlight }: { grid: Grid; cell?: number; highlight?: (i: number, j: number) => boolean }) {
  return (
    <svg viewBox={`0 0 ${grid[0].length * cell} ${grid.length * cell}`} width={grid[0].length * cell} height={grid.length * cell} role="img" aria-label="Grid">
      {grid.map((row, i) => row.map((v, j) => {
        const g = Math.max(0, Math.min(255, Math.round(v)));
        return (
          <g key={`${i}-${j}`}>
            <rect x={j * cell} y={i * cell} width={cell} height={cell} fill={`rgb(${g},${g},${g})`} stroke="var(--line)" strokeWidth={0.5} />
            {highlight?.(i, j) && <rect x={j * cell + 2} y={i * cell + 2} width={cell - 4} height={cell - 4} fill="none" stroke="#cf222e" strokeWidth={2} />}
          </g>
        );
      }))}
    </svg>
  );
}

type Mode = "max" | "avg";

/** PoolLab (51.4): max- and average-pooling (2x2, stride 2) on a small feature map with one
 *  strong "feature", plus 1-pixel shift buttons to see, directly, which pooling mode keeps its
 *  output unchanged when the feature shifts by a pixel within the same pooling window. */
export function PoolLab({ caption }: { caption?: string }) {
  const [mode, setMode] = useState<Mode>("max");
  const [shift, setShift] = useState<[number, number]>([0, 0]);
  const base = useMemo(() => makeGrid(21), []);
  const current = useMemo(() => shiftGrid(base, shift[0], shift[1]), [base, shift]);
  const pooled = useMemo(() => (mode === "max" ? maxPool2x2(current) : avgPool2x2(current)), [current, mode]);
  const pooledBase = useMemo(() => (mode === "max" ? maxPool2x2(base) : avgPool2x2(base)), [base, mode]);
  const argmax = useMemo(() => maxPoolArgmax(current), [current]);
  const unchanged = useMemo(() => pooled.flat().filter((v, i) => Math.abs(v - pooledBase.flat()[i]) < 1e-6).length, [pooled, pooledBase]);

  return (
    <figure className="fig poollab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Pooling mode</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Pooling mode">
            <button type="button" role="radio" aria-checked={mode === "max"} className={mode === "max" ? "is-on" : ""} onClick={() => setMode("max")}>Max pool</button>
            <button type="button" role="radio" aria-checked={mode === "avg"} className={mode === "avg" ? "is-on" : ""} onClick={() => setMode("avg")}>Average pool</button>
          </div>
        </div>
        <div role="group" aria-label="Shift the feature map by one pixel" style={{ display: "flex", gap: "0.3rem" }}>
          <button type="button" onClick={() => setShift(([i, j]) => [i - 1, j])} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", cursor: "pointer" }} aria-label="shift up">↑</button>
          <button type="button" onClick={() => setShift(([i, j]) => [i + 1, j])} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", cursor: "pointer" }} aria-label="shift down">↓</button>
          <button type="button" onClick={() => setShift(([i, j]) => [i, j - 1])} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", cursor: "pointer" }} aria-label="shift left">←</button>
          <button type="button" onClick={() => setShift(([i, j]) => [i, j + 1])} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", cursor: "pointer" }} aria-label="shift right">→</button>
          <button type="button" onClick={() => setShift([0, 0])} style={{ background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", cursor: "pointer" }}>Reset</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div><div className="vis-title">feature map (shift: {shift[0]}, {shift[1]})</div><GridView grid={current} /></div>
        <div><div className="vis-title">pooled (2x2, stride 2){mode === "max" ? " -- red = the cell each window picked" : ""}</div>
          <GridView grid={pooled} cell={CELL * 2} highlight={mode === "max" ? (i, j) => true : undefined} />
        </div>
      </div>
      <ul className="ap-stats">
        <li><span>Pooled cells unchanged vs no shift</span><strong>{unchanged} / {pooled.length * pooled[0].length}</strong><em>{mode === "max" ? "max pooling tolerates small shifts better" : "average pooling changes almost every cell"}</em></li>
      </ul>
      <div className="pg-readout"><span>Shift the feature map by one pixel and compare: as long as the strong feature stays inside the same 2x2 window, max pooling's output for that window does not change at all. Average pooling blends in the shift immediately.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
