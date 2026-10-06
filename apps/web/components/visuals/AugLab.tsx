"use client";

import { useEffect, useRef, useState } from "react";
import { sample, affine, transformBox, type AugOn } from "@/lib/aug-ops";

const W = 320, H = 200, BOX = { x: 25, y: 50, w: 90, h: 90 };
const LABELS: Record<keyof AugOn, string> = { flip: "horizontal flip", rotate: "rotation ±20°", scale: "scale ±30 %", bright: "brightness / contrast", noise: "noise", cutout: "cutout" };

function Sample({ img, seed, on, strength }: { img: HTMLImageElement; seed: number; on: AugOn; strength: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const p = sample(seed, on, strength, W, H), m = affine(p, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(m[0], m[3], m[1], m[4], m[2], m[5]); // canvas order: a, b, c, d, e, f
    ctx.drawImage(img, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const d = ctx.getImageData(0, 0, W, H);
    let s = seed * 7 + 1;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < d.data.length; i += 4) {
      const n = p.noise ? (rnd() + rnd() + rnd() - 1.5) * 2 * p.noise : 0;
      for (let c = 0; c < 3; c++) d.data[i + c] = Math.max(0, Math.min(255, d.data[i + c] * p.gain + p.offset + n));
    }
    ctx.putImageData(d, 0, 0);
    if (p.cut) { ctx.fillStyle = "#808080"; ctx.fillRect(p.cut.x, p.cut.y, p.cut.s, p.cut.s); }
    const b = transformBox(BOX, m);
    ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h);
  }, [img, seed, on, strength]);
  return <canvas ref={ref} width={W} height={H} className="ag-img" role="img" aria-label={`Augmented sample ${seed}`} />;
}

/** AugLab (15.6): eight seeded random augmentations of one labelled image; switch each kind on or off, change the strength, see the label box follow. */
export function AugLab({ src = "/images/sample-color.png", caption }: { src?: string; caption?: string }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => { const i = new Image(); i.onload = () => setImg(i); i.src = src; }, [src]);
  const [on, setOn] = useState<AugOn>({ flip: true, rotate: true, scale: true, bright: true, noise: false, cutout: false });
  const [strength, setStrength] = useState(0.6);
  const [batch, setBatch] = useState(1);
  return (
    <figure className="fig auglab">
      <div className="ag-toggles">
        {(Object.keys(LABELS) as (keyof AugOn)[]).map((k) => (
          <label key={k}><input type="checkbox" checked={on[k]} onChange={(e) => setOn({ ...on, [k]: e.target.checked })} /> {LABELS[k]}</label>
        ))}
      </div>
      <div className="sc-ctl">
        <label className="ctl ctl-wide"><span>Strength <output>{strength.toFixed(2)}</output></span><input type="range" min={0} max={1} step={0.05} value={strength} onChange={(e) => setStrength(Number(e.target.value))} aria-label="Strength" /></label>
        <button type="button" className="hl-reset" onClick={() => setBatch((b) => b + 1)}>New random batch</button>
      </div>
      {img && <div className="ag-grid">{Array.from({ length: 8 }, (_, i) => <Sample key={i} img={img} seed={batch * 100 + i} on={on} strength={strength} />)}</div>}
      <p className="ag-note">Magenta: the red disc's label box, transformed with the same matrix as the image (axis-aligned box around the rotated corners).</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
