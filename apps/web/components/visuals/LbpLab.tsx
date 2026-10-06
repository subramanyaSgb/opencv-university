"use client";

import { useMemo, useState } from "react";
import { useGrays, GrayView, rect, Seg } from "./lab-kit";

const SOURCES: Record<string, { src: string; label: string }> = {
  woven: { src: "/images/sample-texture-woven.png", label: "woven fabric" },
  smooth: { src: "/images/sample-texture-smooth.png", label: "smooth shading" },
  blotchy: { src: "/images/sample-texture-blotchy.png", label: "blotchy" },
  defect: { src: "/images/sample-texture-defect.png", label: "fabric with a defect" },
};
// TL, T, TR, R, BR, B, BL, L — clockwise from the top-left neighbour, matching the worked example in the text.
const OFFS: [number, number][] = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];
const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

function transitions(code: number): number {
  const bits = Array.from({ length: 8 }, (_, k) => (code >> k) & 1);
  let t = 0;
  for (let k = 0; k < 8; k++) if (bits[k] !== bits[(k + 1) % 8]) t++;
  return t;
}
const UNIFORM = Array.from({ length: 256 }, (_, v) => transitions(v) <= 2);

function codeAt(d: ArrayLike<number>, w: number, h: number, x: number, y: number): number {
  const c = d[y * w + x];
  let code = 0;
  for (let i = 0; i < 8; i++) {
    const [dy, dx] = OFFS[i];
    const n = d[(y + dy) * w + (x + dx)];
    if (n >= c) code |= WEIGHTS[i];
  }
  return code;
}

/** LbpLab (Module 35): local binary patterns on a texture image — click a pixel for its 3x3 neighbours, the 8 bits
 *  and the LBP code, plus the uniform-pattern fraction of the whole image (and of a defect patch, for the "defect" source). */
export function LbpLab({ initialSource = "woven", caption }: { initialSource?: keyof typeof SOURCES; caption?: string }) {
  const [source, setSource] = useState<keyof typeof SOURCES>(initialSource);
  const g = useGrays([SOURCES[source].src])?.[0];
  const [sel, setSel] = useState<[number, number]>([35, 35]);

  const stats = useMemo(() => {
    if (!g) return null;
    const { d, w, h } = g;
    let uniform = 0, total = 0;
    let dUniform = 0, dTotal = 0, rUniform = 0, rTotal = 0;
    const inDefect = (x: number, y: number) => x >= 24 && x < 48 && y >= 24 && y < 48;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const code = codeAt(d, w, h, x, y);
        const u = UNIFORM[code] ? 1 : 0;
        uniform += u; total++;
        if (source === "defect") {
          if (inDefect(x, y)) { dUniform += u; dTotal++; } else { rUniform += u; rTotal++; }
        }
      }
    }
    return { fracAll: uniform / total, total, fracDefect: dTotal ? dUniform / dTotal : null, fracRest: rTotal ? rUniform / rTotal : null };
  }, [g, source]);

  const [sx, sy] = sel;
  const detail = useMemo(() => {
    if (!g) return null;
    const { d, w, h } = g;
    if (sx < 1 || sy < 1 || sx >= w - 1 || sy >= h - 1) return null;
    const c = d[sy * w + sx];
    const bits = OFFS.map(([dy, dx], i) => {
      const n = d[(sy + dy) * w + (sx + dx)];
      return { n, bit: n >= c ? 1 : 0, weight: WEIGHTS[i] };
    });
    const code = bits.reduce((s, b) => s + b.bit * b.weight, 0);
    return { c, bits, code, uniform: UNIFORM[code] };
  }, [g, sx, sy]);

  if (!g) return <p>Loading…</p>;
  const overlay = rect(sx - 1, sy - 1, 3, 3, "#e0393e", 2);

  return (
    <figure className="fig lklab">
      <Seg label="Texture" opts={Object.entries(SOURCES).map(([k, v]) => [k as keyof typeof SOURCES, v.label] as [keyof typeof SOURCES, string])} v={source} set={setSource} />
      <div className="lk-grid">
        <GrayView d={g.d} w={g.w} h={g.h} scale={5} label={`${SOURCES[source].label} (${g.w}×${g.h}); click a pixel`} overlay={overlay} onPick={(x, y) => setSel([Math.max(1, Math.min(g.w - 2, x)), Math.max(1, Math.min(g.h - 2, y))])} />
        {detail && (
          <div>
            <p className="lk-read"><b>Centre</b> at ({sx}, {sy}) = {detail.c}</p>
            <div className="lk-wrap">
              <table className="lk-table">
                <thead><tr><th>Neighbour</th>{["TL", "T", "TR", "R", "BR", "B", "BL", "L"].map((l) => <th key={l}>{l}</th>)}</tr></thead>
                <tbody>
                  <tr><th>value</th>{detail.bits.map((b, i) => <td key={i}>{b.n}</td>)}</tr>
                  <tr><th>≥ {detail.c}?</th>{detail.bits.map((b, i) => <td key={i}>{b.bit}</td>)}</tr>
                  <tr><th>weight</th>{detail.bits.map((b, i) => <td key={i}>{b.weight}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <p className="lk-read">
              code = {detail.bits.filter((b) => b.bit).map((b) => b.weight).join(" + ") || 0} = <b>{detail.code}</b>{" "}
              — {detail.uniform ? "uniform" : "non-uniform"} ({transitions(detail.code)} transitions)
            </p>
          </div>
        )}
      </div>
      {stats && (
        <p className="lk-read">
          Whole image: {stats.total} interior pixels, <b>{(stats.fracAll * 100).toFixed(1)}%</b> uniform patterns.
          {stats.fracDefect !== null && stats.fracRest !== null && (
            <> Defect patch: <b>{(stats.fracDefect * 100).toFixed(1)}%</b> uniform vs <b>{(stats.fracRest * 100).toFixed(1)}%</b> for the rest of the fabric.</>
          )}
        </p>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
