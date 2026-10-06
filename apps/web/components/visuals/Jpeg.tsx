"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { basis, jpegBlock, qtable, ZIGZAG, zigzagRun, type Block } from "@/lib/dct-ops";

const ramp = (f: (r: number, c: number) => number): Block => Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => f(r, c)));
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const NOISE = ramp(() => Math.round(128 + (rnd() - 0.5) * 60));
const BLOCKS: { name: string; b: Block }[] = [
  { name: "Smooth ramp", b: ramp((r, c) => 100 + 6 * c + 3 * r) },
  { name: "Edge", b: ramp((_, c) => (c < 4 ? 60 : 180)) },
  { name: "Thin line", b: ramp((_, c) => (c === 3 ? 200 : 60)) },
  { name: "Noise", b: NOISE },
  { name: "Fine checkerboard", b: ramp((r, c) => ((r + c) % 2 ? 160 : 90)) },
];

function Grid({ title, values, kind }: { title: string; values: Block; kind: "pix" | "coef" | "err" }) {
  return (
    <div className="dl-panel">
      <div className="vis-title">{title}</div>
      <div className="dl-grid" role="img" aria-label={`${title}: ${values.map((r) => r.join(" ")).join("; ")}`}>
        {values.flat().map((v, i) => {
          let style: React.CSSProperties;
          if (kind === "pix") style = { background: `rgb(${v},${v},${v})`, color: v > 140 ? "#16202b" : "#fff" };
          else if (kind === "err") style = v === 0 ? {} : { background: `hsl(30 90% ${Math.max(45, 92 - Math.abs(v) * 2)}%)`, color: "#16202b" };
          else style = v === 0 ? {} : { background: v > 0 ? `hsl(210 75% ${Math.max(40, 85 - Math.log2(1 + Math.abs(v)) * 7)}%)` : `hsl(0 70% ${Math.max(42, 85 - Math.log2(1 + Math.abs(v)) * 7)}%)`, color: "#16202b" };
          return <span key={i} className={v === 0 && kind !== "pix" ? "dl-cell dl-zero" : "dl-cell"} style={style}>{v}</span>;
        })}
      </div>
    </div>
  );
}

/** DctLab: one 8×8 block through JPEG: DCT, quantization at any quality, decode, error. */
export function DctLab({ caption }: { caption?: string }) {
  const [bi, setBi] = useState(1);
  const [q, setQ] = useState(50);
  const block = BLOCKS[bi].b;
  const r = useMemo(() => jpegBlock(block, q), [block, q]);
  const err = r.rec.map((row, y) => row.map((v, x) => v - block[y][x]));
  const run = zigzagRun(r.q);
  const Q = qtable(q);
  return (
    <figure className="fig dctlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Block</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Block">
            {BLOCKS.map((b, k) => <button key={b.name} type="button" role="radio" aria-checked={bi === k} className={bi === k ? "is-on" : ""} onClick={() => setBi(k)}>{b.name}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide">
          <span>JPEG quality <output>{q}</output></span>
          <input type="range" min={1} max={100} step={1} value={q} onChange={(e) => setQ(Number(e.target.value))} aria-label="JPEG quality" />
        </label>
      </div>
      <div className="dl-panels">
        <Grid title="1. Original pixels" values={block} kind="pix" />
        <Grid title="2. Quantized DCT coefficients" values={r.q} kind="coef" />
        <Grid title="3. Decoded pixels" values={r.rec} kind="pix" />
        <Grid title="4. Error (decoded − original)" values={err} kind="err" />
      </div>
      <ul className="ap-stats">
        <li><span>Non-zero coefficients</span><strong>{r.nonzero} / 64</strong><em>the rest cost almost nothing</em></li>
        <li><span>Max error</span><strong>{r.maxErr}</strong><em>gray levels</em></li>
        <li><span>Step for the top-left (DC)</span><strong>{Q[0][0]}</strong><em>highest frequency: {Q[7][7]}</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite">
        <span>Zigzag sequence: <code>[{run.join(", ")}]</code> + end of block. Top-left = average brightness; to the right = horizontal detail; down = vertical detail.</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** DctBasis: the 64 cosine patterns every 8×8 block is built from. */
export function DctBasis({ caption }: { caption?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const cell = 6, gap = 4, step = 8 * cell + gap;
    ctx.fillStyle = "#7a8794";
    ctx.fillRect(0, 0, 8 * step + gap, 8 * step + gap);
    for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) {
      const b = basis(u, v);
      const m = Math.max(...b.flat().map(Math.abs));
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const g = Math.round(128 + (127 * b[y][x]) / m);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(gap + v * step + x * cell, gap + u * step + y * cell, cell, cell);
      }
    }
  }, []);
  return (
    <figure className="vis dctbasis">
      <div className="db-wrap">
        <span className="db-axis db-x">horizontal frequency →</span>
        <span className="db-axis db-y">vertical frequency →</span>
        <canvas ref={ref} width={8 * 52 + 4} height={8 * 52 + 4} role="img" aria-label="8 by 8 grid of DCT basis patterns: top-left flat, frequencies increase to the right and downward" />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** ZigZag: the order JPEG reads the 64 coefficients, low to high frequency. */
export function ZigZag({ caption }: { caption?: string }) {
  const s = 30, pad = 6;
  const pts = ZIGZAG.map(([r, c]) => `${pad + c * s + s / 2},${pad + r * s + s / 2}`).join(" ");
  const order = new Map(ZIGZAG.map(([r, c], i) => [`${r}-${c}`, i]));
  return (
    <figure className="vis zigzag">
      <svg viewBox={`0 0 ${8 * s + 2 * pad} ${8 * s + 2 * pad}`} role="img" aria-label="Zigzag scan order over an 8 by 8 block, from the top-left corner to the bottom-right">
        {Array.from({ length: 64 }, (_, k) => {
          const r = Math.floor(k / 8), c = k % 8;
          return (
            <g key={k}>
              <rect x={pad + c * s} y={pad + r * s} width={s} height={s} className={r + c < 4 ? "zz-low" : "zz-cell"} />
              <text x={pad + c * s + 4} y={pad + r * s + 11} className="zz-num">{order.get(`${r}-${c}`)}</text>
            </g>
          );
        })}
        <polyline points={pts} className="zz-path" />
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
