"use client";

import { useEffect, useRef, useState } from "react";
import { autoLimits, colour, norm, type Cmap } from "@/lib/imshow-ops";

const W = 320, H = 200;
type Src = "color" | "flat" | "sobel";
const SOURCES: { k: Src; name: string; note: string }[] = [
  { k: "color", name: "Colour image (BGR array)", note: "3 channels: no colour map, values used directly as R, G, B." },
  { k: "flat", name: "Low-contrast gray (100…140)", note: "2-D uint8 array: colour map and colour limits apply." },
  { k: "sobel", name: "Signed float (Sobel x)", note: "Negative and positive values: limits decide where 0 sits." },
];

/** ImshowLab: what plt.imshow shows for the same array under different arguments (BGR/RGB, cmap, vmin/vmax). */
export function ImshowLab({ caption }: { caption?: string }) {
  const [src, setSrc] = useState<Src>("color");
  const [rgb, setRgb] = useState(false);
  const [cmap, setCmap] = useState<Cmap>("viridis");
  const [fixed, setFixed] = useState(false);
  const [info, setInfo] = useState("");
  const out = useRef<HTMLCanvasElement>(null);
  const data = useRef<{ bgr: Uint8ClampedArray; gray: Float32Array } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d"); if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, W, H).data;
      const g = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) g[i] = 0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2];
      // the browser gives RGB; build the BGR array OpenCV would hold
      const bgr = new Uint8ClampedArray(W * H * 3);
      for (let i = 0; i < W * H; i++) { bgr[3 * i] = d[4 * i + 2]; bgr[3 * i + 1] = d[4 * i + 1]; bgr[3 * i + 2] = d[4 * i]; }
      data.current = { bgr, gray: g };
      setInfo((s) => s + " ");
    };
    img.src = "/images/sample-color.png";
  }, []);

  useEffect(() => {
    const ctx = out.current?.getContext("2d");
    const dd = data.current;
    if (!ctx || !dd) return;
    const im = ctx.createImageData(W, H);
    if (src === "color") {
      for (let i = 0; i < W * H; i++) {
        const [b, g, r] = [dd.bgr[3 * i], dd.bgr[3 * i + 1], dd.bgr[3 * i + 2]];
        const [R, G, B] = rgb ? [r, g, b] : [b, g, r]; // matplotlib reads channel 0 as red
        im.data.set([R, G, B, 255], 4 * i);
      }
      setInfo(rgb ? "cv2.cvtColor(img, cv2.COLOR_BGR2RGB) first: colours correct." : "plt.imshow(img) on a BGR array: red and blue swapped.");
    } else {
      const v = new Float32Array(W * H);
      if (src === "flat") for (let i = 0; i < v.length; i++) v[i] = Math.floor(100 + (dd.gray[i] * 40) / 255);
      else for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const at = (yy: number, xx: number) => dd.gray[Math.min(H - 1, Math.max(0, yy)) * W + Math.min(W - 1, Math.max(0, xx))];
        v[y * W + x] = (at(y - 1, x + 1) + 2 * at(y, x + 1) + at(y + 1, x + 1)) - (at(y - 1, x - 1) + 2 * at(y, x - 1) + at(y + 1, x - 1));
      }
      const [lo, hi] = autoLimits(v);
      const m = Math.max(Math.abs(lo), Math.abs(hi));
      const [vmin, vmax] = fixed ? (src === "flat" ? [0, 255] : [-m, m]) : [lo, hi];
      for (let i = 0; i < v.length; i++) im.data.set([...colour(norm(v[i], vmin, vmax), cmap), 255], 4 * i);
      setInfo(`Data ${lo.toFixed(0)} … ${hi.toFixed(0)}; colour limits (vmin, vmax) = (${vmin.toFixed(0)}, ${vmax.toFixed(0)})${fixed ? "" : " chosen automatically"}.`);
    }
    ctx.putImageData(im, 0, 0);
  }, [src, rgb, cmap, fixed, info === ""]);

  const fixedLabel = src === "flat" ? "vmin=0, vmax=255" : "vmin=−m, vmax=+m (symmetric)";
  return (
    <figure className="fig imshowlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Array</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Array">
            {SOURCES.map((s) => <button key={s.k} type="button" role="radio" aria-checked={src === s.k} className={src === s.k ? "is-on" : ""} onClick={() => setSrc(s.k)}>{s.name}</button>)}
          </div>
        </div>
        {src === "color" ? (
          <label className="ctl"><input type="checkbox" checked={rgb} onChange={() => setRgb(!rgb)} /> Convert BGR → RGB before plotting</label>
        ) : (
          <>
            <div className="ctl ctl-full"><span>cmap</span>
              <div className="seg seg-small" role="radiogroup" aria-label="Colour map">
                {(["viridis", "gray"] as Cmap[]).map((k) => <button key={k} type="button" role="radio" aria-checked={cmap === k} className={cmap === k ? "is-on" : ""} onClick={() => setCmap(k)}>{k === "viridis" ? "default (viridis)" : "'gray'"}</button>)}
              </div>
            </div>
            <div className="ctl ctl-full"><span>Limits</span>
              <div className="seg seg-small" role="radiogroup" aria-label="Colour limits">
                {([[false, "automatic (min…max)"], [true, fixedLabel]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={fixed === k} className={fixed === k ? "is-on" : ""} onClick={() => setFixed(k)}>{l}</button>)}
              </div>
            </div>
          </>
        )}
      </div>
      <canvas ref={out} width={W} height={H} className="sl-canvas" role="img" aria-label="The array as matplotlib would display it" />
      <div className="pg-readout" aria-live="polite"><span>{SOURCES.find((s) => s.k === src)?.note} {info}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
