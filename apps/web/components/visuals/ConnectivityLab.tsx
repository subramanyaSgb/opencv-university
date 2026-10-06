"use client";

import { useMemo, useState } from "react";
import { distance, label, type Metric } from "@/lib/conn-ops";

const ROWS = 7, COLS = 10;
const START = [
  "1100000000",
  "1100011000",
  "0011011000",
  "0011000000",
  "0000100110",
  "0000010110",
  "0000000000",
].map((s) => s.split("").map(Number));
const HUES = [210, 20, 130, 280, 50, 340, 170, 95];

/** ConnectivityLab: paint pixels, compare 4- and 8-connectivity, and see grid distances from a chosen pixel. */
export function ConnectivityLab({ caption }: { caption?: string }) {
  const [g, setG] = useState(START);
  const [conn, setConn] = useState<4 | 8>(4);
  const [mode, setMode] = useState<"regions" | Metric>("regions");
  const [from, setFrom] = useState<[number, number]>([3, 4]);
  const { labels, count } = useMemo(() => label(g, conn), [g, conn]);

  const click = (r: number, c: number) => {
    if (mode === "regions") setG(g.map((row, y) => row.map((v, x) => (y === r && x === c ? 1 - v : v))));
    else setFrom([r, c]);
  };

  return (
    <figure className="fig connlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Show</span>
          <div className="seg seg-small" role="radiogroup" aria-label="What to show">
            {([["regions", "Connected regions"], ["cityblock", "City-block distance"], ["chessboard", "Chessboard distance"], ["euclidean", "Euclidean distance"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={mode === k} className={mode === k ? "is-on" : ""} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
        </div>
        {mode === "regions" && (
          <div className="ctl ctl-full">
            <span>Connectivity</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Connectivity">
              {[4, 8].map((k) => <button key={k} type="button" role="radio" aria-checked={conn === k} className={conn === k ? "is-on" : ""} onClick={() => setConn(k as 4 | 8)}>{k}-connected</button>)}
            </div>
          </div>
        )}
      </div>
      <div className="cn-grid" role="grid" aria-label={mode === "regions" ? `${count} connected objects` : "distances from the chosen pixel"}>
        {Array.from({ length: ROWS * COLS }, (_, k) => {
          const r = Math.floor(k / COLS), c = k % COLS;
          const lab = labels[r][c];
          if (mode === "regions") {
            return <button key={k} type="button" className="cn-cell" aria-label={`row ${r}, column ${c}, ${g[r][c] ? `object ${lab}` : "background"}`}
              style={{ background: g[r][c] ? `hsl(${HUES[(lab - 1) % HUES.length]} 65% 50%)` : undefined }} onClick={() => click(r, c)}>{g[r][c] ? lab : ""}</button>;
          }
          const d = distance(from, [r, c], mode);
          const isFrom = r === from[0] && c === from[1];
          return <button key={k} type="button" className={isFrom ? "cn-cell cn-from" : "cn-cell"} aria-label={`row ${r}, column ${c}, distance ${d.toFixed(1)}`}
            style={{ background: isFrom ? undefined : `hsl(210 70% ${92 - Math.min(d, 9) * 6}%)` }} onClick={() => click(r, c)}>{Number.isInteger(d) ? d : d.toFixed(1)}</button>;
        })}
      </div>
      <div className="pg-readout" aria-live="polite">
        <span>{mode === "regions" ? <><strong>{count} object{count === 1 ? "" : "s"}</strong> with {conn}-connectivity. Click to add or remove pixels. Diagonal touches join objects only with 8-connectivity.</> : <>Distances from the dark cell. Click to move it. {mode === "cityblock" ? "City-block: steps up/down/left/right only." : mode === "chessboard" ? "Chessboard: diagonal steps count as 1." : "Euclidean: straight-line distance."}</>}</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
