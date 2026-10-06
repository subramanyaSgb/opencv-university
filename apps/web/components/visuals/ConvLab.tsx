"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pad, filter2D, toU8, KERNELS, BORDER_NAME, type Border } from "@/lib/conv-ops";

const SMALL = [
  [20, 20, 20, 200, 200, 200, 200],
  [20, 20, 20, 200, 200, 200, 200],
  [20, 20, 90, 200, 200, 200, 200],
  [20, 20, 20, 200, 200, 30, 200],
  [20, 20, 20, 200, 200, 200, 200],
  [20, 20, 20, 200, 200, 200, 200],
];
const SW = 7, SH = 6;

function useGray(src: string) {
  const [g, setG] = useState<{ d: Uint8Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Uint8Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(1));

/** ConvLab (Module 17): slide a 3 × 3 kernel over a 7 × 6 image (click a pixel to see the products and the sum, with the chosen border), and apply it to a real image. */
export function ConvLab({ initialKernel = "box", showBorders = false, src = "/images/sample-scene.png", caption }: { initialKernel?: string; showBorders?: boolean; src?: string; caption?: string }) {
  const [kn, setKn] = useState(initialKernel);
  const [custom, setCustom] = useState<number[][]>(KERNELS[initialKernel]?.k.map((r) => r.slice()) ?? [[0, 0, 0], [0, 1, 0], [0, 0, 0]]);
  const [border, setBorder] = useState<Border>("reflect101");
  const [sel, setSel] = useState<[number, number]>([2, 2]); // x, y
  const [signed, setSigned] = useState(false);
  const k = kn === "custom" ? custom : KERNELS[kn].k;
  const flat = SMALL.flat();
  const padded = useMemo(() => pad(flat, SW, SH, 1, border), [border]); // eslint-disable-line react-hooks/exhaustive-deps
  const res = useMemo(() => filter2D(flat, SW, SH, k, border), [k, border]); // eslint-disable-line react-hooks/exhaustive-deps
  const g = useGray(src);
  const big = useMemo(() => (g ? filter2D(g.d, g.w, g.h, k, border) : null), [g, k, border]);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx || !g || !big) return;
    const shown = toU8(signed ? Array.from(big, (v) => v / 2 + 128) : big);
    const im = ctx.createImageData(g.w, g.h);
    for (let i = 0; i < shown.length; i++) im.data.set([shown[i], shown[i], shown[i], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
  }, [g, big, signed]);
  const [sx, sy] = sel;
  const terms: { v: number; w: number }[] = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) terms.push({ v: padded.d[(sy + j) * padded.w + sx + i], w: k[j][i] });
  const sum = terms.reduce((a, t) => a + t.v * t.w, 0);
  const shade = (v: number) => `rgb(${v},${v},${v})`;
  return (
    <figure className="fig convlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Kernel</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Kernel">
            {[...Object.keys(KERNELS), "custom"].map((n) => <button key={n} type="button" role="radio" aria-checked={kn === n} className={kn === n ? "is-on" : ""} onClick={() => setKn(n)}>{n === "custom" ? "your own" : KERNELS[n].label}</button>)}
          </div>
        </div>
        {showBorders && (
          <div className="ctl ctl-full"><span>Border</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Border">
              {(Object.keys(BORDER_NAME) as Border[]).map((b) => <button key={b} type="button" role="radio" aria-checked={border === b} className={border === b ? "is-on" : ""} onClick={() => setBorder(b)}>{BORDER_NAME[b]}</button>)}
            </div>
          </div>
        )}
      </div>
      <div className="kc-grid">
        <div>
          <div className="kc-mat" style={{ gridTemplateColumns: `repeat(${SW + 2}, minmax(0, 1fr))` }} role="grid" aria-label="Padded input; click a pixel">
            {Array.from({ length: (SW + 2) * (SH + 2) }, (_, i) => {
              const x = (i % (SW + 2)) - 1, y = Math.floor(i / (SW + 2)) - 1, v = padded.d[i], inside = x >= 0 && y >= 0 && x < SW && y < SH;
              const inWin = Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1;
              return <button key={i} type="button" disabled={!inside} onClick={() => setSel([x, y])} className={`kc-cell${inside ? "" : " kc-pad"}${inWin ? " kc-win" : ""}${x === sx && y === sy ? " kc-sel" : ""}`} style={{ background: shade(v), color: v > 120 ? "#111" : "#fff" }}>{v}</button>;
            })}
          </div>
          <p className="kc-cap">Input with a 1-pixel border{showBorders ? ` (${BORDER_NAME[border]})` : ""}; click any inner pixel.</p>
        </div>
        <div>
          <div className="kc-k">
            {k.map((row, j) => row.map((w, i) => kn === "custom"
              ? <input key={`${j}${i}`} type="number" step="any" value={custom[j][i]} onChange={(e) => setCustom((c) => c.map((r, jj) => r.map((v, ii) => (jj === j && ii === i ? Number(e.target.value) : v))))} aria-label={`kernel ${j},${i}`} />
              : <span key={`${j}${i}`}>{fmt(w)}</span>))}
          </div>
          <p className="kc-sum"><b>Output at ({sx}, {sy})</b> = {terms.map((t, i) => <span key={i}>{i ? " + " : ""}{fmt(t.w)}·{t.v}</span>)} = <b>{fmt(sum)}</b>{sum < 0 || sum > 255 ? ` → ${toU8([sum])[0]} in uint8` : ""}</p>
        </div>
      </div>
      <div className="kc-out">
        <div className="kc-res" style={{ gridTemplateColumns: `repeat(${SW}, minmax(0, 1fr))` }}>
          {Array.from(res, (v, i) => { const u = toU8([v])[0]; return <span key={i} className={i === sy * SW + sx ? "kc-sel" : ""} style={{ background: shade(u), color: u > 120 ? "#111" : "#fff" }}>{fmt(Math.round(v * 10) / 10)}</span>; })}
        </div>
        <p className="kc-cap">Result on the 7 × 6 image (cv2.filter2D, float)</p>
      </div>
      {g && (
        <div className="kc-real">
          <canvas ref={ref} width={g.w} height={g.h} className="kc-img" role="img" aria-label="Filtered image" />
          <label className="kc-check"><input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} /> show signed results as 128 + value/2 (for edge kernels)</label>
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
