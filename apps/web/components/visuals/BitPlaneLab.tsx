"use client";

import { useEffect, useRef, useState } from "react";
import { agreement, bitPlane, embedLsb } from "@/lib/watermark-ops";

const W = 320, H = 200;

function grayOf(ctx: CanvasRenderingContext2D) {
  const d = ctx.getImageData(0, 0, W, H).data;
  const g = new Uint8Array(W * H);
  for (let i = 0; i < g.length; i++) g[i] = d[4 * i + 1];
  return g;
}

function draw(canvas: HTMLCanvasElement | null, values: Uint8Array, scale: number) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const im = ctx.createImageData(W, H);
  for (let i = 0; i < values.length; i++) {
    const v = values[i] * scale;
    im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v;
    im.data[4 * i + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
}

/** BitPlaneLab: look at each bit plane of an image, hide a mark in bit 0, and see what JPEG does to it. */
export function BitPlaneLab({ caption }: { caption?: string }) {
  const [plane, setPlane] = useState(0);
  const [hide, setHide] = useState(true);
  const [q, setQ] = useState(0); // 0 = no JPEG (lossless)
  const [score, setScore] = useState<number | null>(null);
  const left = useRef<HTMLCanvasElement>(null);
  const right = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const gray = grayOf(ctx);
      // the mark: text drawn into a separate canvas, 1 where the text is
      const m = document.createElement("canvas");
      m.width = W; m.height = H;
      const mctx = m.getContext("2d");
      if (!mctx) return;
      mctx.fillStyle = "#000"; mctx.fillRect(0, 0, W, H);
      mctx.fillStyle = "#fff"; mctx.font = "bold 46px sans-serif"; mctx.fillText("LOT 4711", 40, 122);
      const mark = grayOf(mctx).map((v) => (v > 127 ? 1 : 0));
      const stego = hide ? embedLsb(gray, mark) : gray;
      const finish = (vals: Uint8Array) => {
        if (cancelled) return;
        draw(left.current, vals, 1);
        draw(right.current, bitPlane(vals, plane), 255);
        setScore(hide ? agreement(bitPlane(vals, 0), mark) : null);
      };
      if (!q) { finish(stego); return; }
      const s = document.createElement("canvas");
      s.width = W; s.height = H;
      const sctx = s.getContext("2d");
      if (!sctx) return;
      const im = sctx.createImageData(W, H);
      stego.forEach((v, i) => { im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255; });
      sctx.putImageData(im, 0, 0);
      const dec = new Image();
      dec.onload = () => {
        sctx.drawImage(dec, 0, 0);
        finish(grayOf(sctx));
      };
      dec.src = s.toDataURL("image/jpeg", q / 100);
    };
    img.src = "/images/sample-scene.png";
    return () => { cancelled = true; };
  }, [plane, hide, q]);

  return (
    <figure className="fig bitplanelab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Show bit</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Bit plane">
            {[7, 6, 5, 4, 3, 2, 1, 0].map((k) => <button key={k} type="button" role="radio" aria-checked={plane === k} className={plane === k ? "is-on" : ""} onClick={() => setPlane(k)}>{k}</button>)}
          </div>
        </div>
        <label className="ctl"><input type="checkbox" checked={hide} onChange={() => setHide(!hide)} /> Hide "LOT 4711" in bit 0</label>
        <label className="ctl ctl-wide">
          <span>Then save as <output>{q ? `JPEG q${q}` : "PNG (lossless)"}</output></span>
          <input type="range" min={0} max={100} step={5} value={q} onChange={(e) => setQ(Number(e.target.value))} aria-label="JPEG quality, 0 = PNG" />
        </label>
      </div>
      <div className="bp-pair">
        <div><div className="vis-title">Image</div><canvas ref={left} width={W} height={H} className="sl-canvas" role="img" aria-label="The image, possibly carrying the hidden mark" /></div>
        <div><div className="vis-title">Bit {plane} of every pixel</div><canvas ref={right} width={W} height={H} className="sl-canvas" role="img" aria-label={`Bit plane ${plane}: white = 1, black = 0`} /></div>
      </div>
      <div className="pg-readout" aria-live="polite">
        <span>{score === null ? "No mark hidden. Bit 7 shows the coarse picture; the low bits look like noise." : <>Mark bits read back correctly: <strong>{(score * 100).toFixed(1)} %</strong> {score > 0.99 ? "(intact)" : score < 0.6 ? "(about 50 % = random guessing: the mark is gone)" : "(damaged)"}.</>} White = 1, black = 0.</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
