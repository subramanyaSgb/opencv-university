"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { wrapU8, satU8 } from "@/lib/overflow-ops";

type Op = "add" | "sub" | "mul";
const OPS: { k: Op; label: string }[] = [
  { k: "add", label: "add c" },
  { k: "sub", label: "subtract c" },
  { k: "mul", label: "multiply by k" },
];

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

/** ArithLab (14.3): one arithmetic operation on a grey image, NumPy uint8 (wraps) next to OpenCV (saturates), with the affected pixels marked. */
export function ArithLab({ src = "/images/sample-scene.png", caption }: { src?: string; caption?: string }) {
  const g = useGray(src);
  const [op, setOp] = useState<Op>("add");
  const [c, setC] = useState(60);
  const [k, setK] = useState(2);
  const [mark, setMark] = useState(true);
  const res = useMemo(() => {
    if (!g) return null;
    const n = g.d.length, np = new Uint8Array(n), cv = new Uint8Array(n);
    let wrapped = 0, clipped = 0;
    for (let i = 0; i < n; i++) {
      const v = g.d[i], exact = op === "add" ? v + c : op === "sub" ? v - c : v * k;
      np[i] = wrapU8(exact); cv[i] = satU8(exact);
      if (exact < 0 || exact > 255) { wrapped++; clipped++; }
    }
    return { np, cv, wrapped, clipped, n };
  }, [g, op, c, k]);
  const aRef = useRef<HTMLCanvasElement>(null), bRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!g || !res) return;
    for (const [ref, d] of [[aRef, res.np], [bRef, res.cv]] as const) {
      const ctx = ref.current?.getContext("2d"); if (!ctx) continue;
      const im = ctx.createImageData(g.w, g.h);
      for (let i = 0; i < d.length; i++) {
        const v = g.d[i], exact = op === "add" ? v + c : op === "sub" ? v - c : v * k, bad = exact < 0 || exact > 255;
        const px = mark && bad ? (ref === aRef ? [255, 0, 255] : [255, 170, 0]) : [d[i], d[i], d[i]];
        im.data.set([px[0], px[1], px[2], 255], 4 * i);
      }
      ctx.putImageData(im, 0, 0);
    }
  }, [g, res, mark, op, c, k]);
  const code = op === "add" ? [`img + np.uint8(${c})`, `cv2.add(img, ${c})`] : op === "sub" ? [`img - np.uint8(${c})`, `cv2.subtract(img, ${c})`] : [`img * np.uint8(${k})`, `cv2.multiply(img, ${k})`];
  return (
    <figure className="fig arithlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Operation</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Operation">
            {OPS.map((o) => <button key={o.k} type="button" role="radio" aria-checked={op === o.k} className={op === o.k ? "is-on" : ""} onClick={() => setOp(o.k)}>{o.label}</button>)}
          </div>
        </div>
        {op !== "mul" && <label className="ctl ctl-wide"><span>c <output>{c}</output></span><input type="range" min={0} max={200} value={c} onChange={(e) => setC(Number(e.target.value))} aria-label="Constant c" /></label>}
        {op === "mul" && <label className="ctl ctl-wide"><span>k <output>{k}</output></span><input type="range" min={1} max={4} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Factor k" /></label>}
        <label className="ar-check"><input type="checkbox" checked={mark} onChange={(e) => setMark(e.target.checked)} /> mark pixels whose exact result is outside 0–255</label>
      </div>
      <div className="ar-grid">
        <div><canvas ref={aRef} width={g?.w ?? 1} height={g?.h ?? 1} className="ar-img" role="img" aria-label="NumPy result" /><p className="ar-cap"><code>{code[0]}</code>: wraps (marked magenta)</p></div>
        <div><canvas ref={bRef} width={g?.w ?? 1} height={g?.h ?? 1} className="ar-img" role="img" aria-label="OpenCV result" /><p className="ar-cap"><code>{code[1]}</code>: saturates (marked orange)</p></div>
      </div>
      {res && <div className="ap-stats ar-stats"><span>pixels outside 0–255 <b>{res.wrapped}</b> ({((100 * res.wrapped) / res.n).toFixed(1)} %)</span><span>NumPy: wrapped to the other end · OpenCV: clipped to 0 or 255</span></div>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
