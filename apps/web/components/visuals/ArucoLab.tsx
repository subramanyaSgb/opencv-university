"use client";

import { useState } from "react";
import { Slider } from "./lab-kit";

// Real bit patterns for IDs 0-2 of cv2.aruco.DICT_4X4_50 (cv2.aruco.Dictionary_getBitsFromByteList),
// row-major 4x4 grid, verified against opencv-python-headless 4.13.0.92.
const CODES: Record<number, number[]> = {
  0: [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0],
  1: [0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1],
  2: [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0],
};
const hamming = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v !== b[i] ? 1 : 0), 0);

/** ArucoLab (Module 38.1): the dictionary-matching idea behind ArUco/AprilTag decoding, live. Starts from
 *  ID 0's real DICT_4X4_50 bit pattern; toggle bits to simulate a damaged/misread marker, and see the
 *  Hamming distance to each real dictionary codeword and whether it still decodes within a chosen
 *  error-correction radius. */
export function ArucoLab({ caption }: { caption?: string }) {
  const [bits, setBits] = useState<number[]>([...CODES[0]]);
  const [radius, setRadius] = useState(1);

  const distances = Object.entries(CODES).map(([id, code]) => ({ id: Number(id), d: hamming(bits, code) }));
  const best = distances.reduce((a, b) => (b.d < a.d ? b : a));
  const decoded = best.d <= radius;

  return (
    <figure className="fig lklab">
      <Slider label="Error-correction radius (max tolerated bit errors)" v={radius} set={setRadius} min={0} max={6} step={1} />
      <div className="lk-grid">
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 2.4em)", gap: 2 }}>
            {bits.map((b, i) => (
              <button key={i} type="button" onClick={() => setBits((bs) => bs.map((v, j) => (j === i ? 1 - v : v)))}
                style={{ width: "2.4em", height: "2.4em", background: b ? "#eee" : "#222", color: b ? "#111" : "#eee", border: "1px solid var(--line)", fontSize: "0.8em" }}>
                {b}
              </button>
            ))}
          </div>
          <p className="lk-read">Click any cell to flip it (simulating a misread bit). Starts as the real ID 0 codeword.</p>
        </div>
        <div className="lk-wrap">
          <table className="lk-table">
            <thead><tr><th>Dictionary ID</th><th>Hamming distance</th></tr></thead>
            <tbody>
              {distances.map((d) => (
                <tr key={d.id} style={d.id === best.id ? { fontWeight: "bold" } : undefined}><td>{d.id}</td><td>{d.d}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="lk-read">
        Nearest codeword: ID <b>{best.id}</b>, distance <b>{best.d}</b>.{" "}
        {decoded ? <>Within the radius ({radius}) → <b>decoded as ID {best.id}</b>.</> : <>Exceeds the radius ({radius}) → <b>rejected, not decoded</b>.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
