"use client";

import { useMemo, useState } from "react";
import { useGrays, GrayView, Seg } from "./lab-kit";

const SOURCES: Record<string, { src: string; label: string }> = {
  scene: { src: "/images/sample-scene.png", label: "scene" },
  brighter: { src: "/images/sample-scene-brighter.png", label: "scene, brighter" },
  inverted: { src: "/images/sample-scene-inverted.png", label: "scene, inverted" },
  other: { src: "/images/sample-color-gray.png", label: "a different image" },
};

/** Simple area-average resize (box filter), equivalent to cv2.INTER_AREA for integer scale ratios. */
function resize(d: ArrayLike<number>, w: number, h: number, nw: number, nh: number): Float64Array {
  const out = new Float64Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    const y0 = (y * h) / nh, y1 = ((y + 1) * h) / nh;
    for (let x = 0; x < nw; x++) {
      const x0 = (x * w) / nw, x1 = ((x + 1) * w) / nw;
      let sum = 0, count = 0;
      for (let sy = Math.floor(y0); sy < y1; sy++) {
        for (let sx = Math.floor(x0); sx < x1; sx++) {
          sum += d[Math.min(h - 1, sy) * w + Math.min(w - 1, sx)]; count++;
        }
      }
      out[y * nw + x] = sum / Math.max(1, count);
    }
  }
  return out;
}

function aHashBits(d: ArrayLike<number>, w: number, h: number): boolean[] {
  const small = resize(d, w, h, 8, 8);
  const avg = small.reduce((a, b) => a + b, 0) / 64;
  return Array.from(small, (v) => v > avg);
}
function dHashBits(d: ArrayLike<number>, w: number, h: number): boolean[] {
  const small = resize(d, w, h, 9, 8);
  const bits: boolean[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits.push(small[y * 9 + x + 1] > small[y * 9 + x]);
  return bits;
}
// 2-D DCT-II of a small square array (direct O(n^4), fine for 32x32 run once per hash).
function dct2(d: Float64Array, n: number): Float64Array {
  const out = new Float64Array(n * n);
  const c = (k: number) => (k === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n));
  const cosTable: number[][] = Array.from({ length: n }, (_, x) => Array.from({ length: n }, (_, k) => Math.cos((Math.PI / n) * (x + 0.5) * k)));
  for (let v = 0; v < n; v++) {
    for (let u = 0; u < n; u++) {
      let sum = 0;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) sum += d[y * n + x] * cosTable[x][u] * cosTable[y][v];
      out[v * n + u] = c(u) * c(v) * sum;
    }
  }
  return out;
}
function pHashBits(d: ArrayLike<number>, w: number, h: number): boolean[] {
  const small = resize(d, w, h, 32, 32);
  const D = dct2(small, 32);
  const block: number[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) block.push(D[y * 32 + x]);
  block.shift();                                  // drop the DC term
  const sorted = [...block].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  return block.map((v) => v > med);
}
const HASHES = { aHash: aHashBits, dHash: dHashBits, pHash: pHashBits };

function BitGrid({ bits, diff }: { bits: boolean[]; diff?: boolean[] }) {
  const n = Math.round(Math.sqrt(bits.length));
  return (
    <div className="lk-wrap">
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1.3em)`, gap: 1 }}>
        {bits.map((b, i) => (
          <div key={i} style={{
            width: "1.3em", height: "1.3em", fontSize: "0.6em", display: "flex", alignItems: "center", justifyContent: "center",
            background: b ? "#e8e8e8" : "#333", color: b ? "#111" : "#eee",
            outline: diff?.[i] ? "2px solid #e0393e" : undefined,
          }}>{b ? 1 : 0}</div>
        ))}
      </div>
    </div>
  );
}

/** HashLab (Module 35): aHash, dHash and pHash of two chosen images, their bit patterns and Hamming distance. */
export function HashLab({ initialA = "scene", initialB = "brighter", initialHash = "dHash", caption }: {
  initialA?: keyof typeof SOURCES; initialB?: keyof typeof SOURCES; initialHash?: keyof typeof HASHES; caption?: string;
}) {
  const [a, setA] = useState<keyof typeof SOURCES>(initialA);
  const [b, setB] = useState<keyof typeof SOURCES>(initialB);
  const [hash, setHash] = useState<keyof typeof HASHES>(initialHash);
  const imgs = useGrays([SOURCES[a].src, SOURCES[b].src]);

  const result = useMemo(() => {
    if (!imgs) return null;
    const [ga, gb] = imgs;
    const fn = HASHES[hash];
    const bitsA = fn(ga.d, ga.w, ga.h), bitsB = fn(gb.d, gb.w, gb.h);
    const diff = bitsA.map((v, i) => v !== bitsB[i]);
    return { bitsA, bitsB, diff, distance: diff.filter(Boolean).length, total: bitsA.length };
  }, [imgs, hash]);

  return (
    <figure className="fig lklab">
      <Seg label="Image A" opts={Object.entries(SOURCES).map(([k, v]) => [k as keyof typeof SOURCES, v.label] as [keyof typeof SOURCES, string])} v={a} set={setA} />
      <Seg label="Image B" opts={Object.entries(SOURCES).map(([k, v]) => [k as keyof typeof SOURCES, v.label] as [keyof typeof SOURCES, string])} v={b} set={setB} />
      <Seg label="Hash" opts={(Object.keys(HASHES) as (keyof typeof HASHES)[]).map((k) => [k, k] as [keyof typeof HASHES, string])} v={hash} set={setHash} />
      {imgs && (
        <div className="lk-grid">
          <GrayView d={imgs[0].d} w={imgs[0].w} h={imgs[0].h} scale={imgs[0].w > 160 ? 1 : 3} label={SOURCES[a].label} />
          <GrayView d={imgs[1].d} w={imgs[1].w} h={imgs[1].h} scale={imgs[1].w > 160 ? 1 : 3} label={SOURCES[b].label} />
        </div>
      )}
      {result && (
        <>
          <div className="lk-grid">
            <div><p className="lk-read">Hash A</p><BitGrid bits={result.bitsA} diff={result.diff} /></div>
            <div><p className="lk-read">Hash B</p><BitGrid bits={result.bitsB} diff={result.diff} /></div>
          </div>
          <p className="lk-read">Hamming distance: <b>{result.distance}</b> / {result.total} bits differ (outlined in red).</p>
        </>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
