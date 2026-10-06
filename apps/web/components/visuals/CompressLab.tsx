"use client";

import { useEffect, useRef, useState } from "react";

const W = 320, H = 200;
const SOURCES = [
  { src: "/images/sample-scene.png", name: "Gradient scene" },
  { src: "/images/sample-pinhole-scene.png", name: "Test chart" },
  { src: "/images/sample-color.png", name: "Colour shapes" },
];

/** CompressLab: JPEG-encode an image in the browser at any quality; see size, PSNR and the error image. */
export function CompressLab({ caption }: { caption?: string }) {
  const [si, setSi] = useState(0);
  const [q, setQ] = useState(50);
  const [showDiff, setShowDiff] = useState(false);
  const [stats, setStats] = useState<{ raw: number; png: number; jpg: number; psnr: number; max: number } | null>(null);
  const out = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const orig = ctx.getImageData(0, 0, W, H).data;
      const png = Math.round((c.toDataURL("image/png").length - 22) * 0.75);
      const url = c.toDataURL("image/jpeg", q / 100);
      const jpgBytes = Math.round((url.length - 23) * 0.75);
      const dec = new Image();
      dec.onload = () => {
        if (cancelled) return;
        const d = document.createElement("canvas");
        d.width = W; d.height = H;
        const dctx = d.getContext("2d");
        const octx = out.current?.getContext("2d");
        if (!dctx || !octx) return;
        dctx.drawImage(dec, 0, 0);
        const dd = dctx.getImageData(0, 0, W, H);
        let se = 0, mx = 0;
        const vis = octx.createImageData(W, H);
        for (let i = 0; i < orig.length; i += 4) {
          for (let k = 0; k < 3; k++) {
            const e = dd.data[i + k] - orig[i + k];
            se += e * e; mx = Math.max(mx, Math.abs(e));
            vis.data[i + k] = showDiff ? Math.min(255, Math.abs(e) * 8) : dd.data[i + k];
          }
          vis.data[i + 3] = 255;
        }
        octx.putImageData(vis, 0, 0);
        const mse = se / (W * H * 3);
        setStats({ raw: W * H * 3, png, jpg: jpgBytes, psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse), max: mx });
      };
      dec.src = url;
    };
    img.src = SOURCES[si].src;
    return () => { cancelled = true; };
  }, [si, q, showDiff]);

  return (
    <figure className="fig compresslab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Image</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Image">
            {SOURCES.map((s, k) => <button key={s.name} type="button" role="radio" aria-checked={si === k} className={si === k ? "is-on" : ""} onClick={() => setSi(k)}>{s.name}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide">
          <span>JPEG quality <output>{q}</output></span>
          <input type="range" min={1} max={100} step={1} value={q} onChange={(e) => setQ(Number(e.target.value))} aria-label="JPEG quality" />
        </label>
        <label className="ctl"><input type="checkbox" checked={showDiff} onChange={() => setShowDiff(!showDiff)} /> Show the error (× 8)</label>
      </div>
      <canvas ref={out} width={W} height={H} className="sl-canvas" role="img" aria-label={showDiff ? "Amplified difference between the original and the JPEG" : "The image after JPEG compression"} />
      {stats && (
        <ul className="ap-stats">
          <li><span>Raw (RGB)</span><strong>{(stats.raw / 1000).toFixed(0)} kB</strong><em>uncompressed</em></li>
          <li><span>PNG (lossless)</span><strong>{(stats.png / 1000).toFixed(1)} kB</strong><em>{(stats.raw / stats.png).toFixed(1)}×, exact</em></li>
          <li><span>JPEG q{q}</span><strong>{(stats.jpg / 1000).toFixed(1)} kB</strong><em>{(stats.raw / stats.jpg).toFixed(1)}×</em></li>
          <li><span>Quality</span><strong>{Number.isFinite(stats.psnr) ? `${stats.psnr.toFixed(1)} dB` : "∞"}</strong><em>max error {stats.max}</em></li>
        </ul>
      )}
      <div className="pg-readout"><span>Encoded by your browser's JPEG encoder (sizes differ slightly from OpenCV's). PSNR: higher is closer to the original; above about 40 dB differences are hard to see.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
