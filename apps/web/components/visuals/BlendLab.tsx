"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addWeighted, composite, feather } from "@/lib/blend-ops";
import { shapeMask } from "@/lib/mask-ops";

const W = 320, H = 200;

function useBgr(src: string) {
  const [d, setD] = useState<Uint8Array | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, W, H);
      const p = ctx.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 3);
      for (let i = 0; i < W * H; i++) { out[3 * i] = p[4 * i + 2]; out[3 * i + 1] = p[4 * i + 1]; out[3 * i + 2] = p[4 * i]; }
      setD(out);
    };
    img.src = src;
  }, [src]);
  return d;
}

/** BlendLab (14.4): cross-fade two images with addWeighted, or composite through a (feathered) alpha mask, optionally in linear light. */
export function BlendLab({ srcA = "/images/sample-color.png", srcB = "/images/sample-scene.png", caption }: { srcA?: string; srcB?: string; caption?: string }) {
  const a = useBgr(srcA), b = useBgr(srcB);
  const [mode, setMode] = useState<"uniform" | "mask">("uniform");
  const [alpha, setAlpha] = useState(0.5);
  const [r, setR] = useState(6);
  const [linear, setLinear] = useState(false);
  const hard = useMemo(() => shapeMask(W, H, { kind: "circle", cx: 160, cy: 100, r: 70 }), []);
  const soft = useMemo(() => feather(hard, W, H, r), [hard, r]);
  const out = useMemo(() => {
    if (!a || !b) return null;
    if (mode === "uniform") {
      if (!linear) return addWeighted(a, alpha, b, 1 - alpha);
      return composite(a, b, new Uint8Array(W * H).fill(Math.round(alpha * 255)), 3, true);
    }
    return composite(a, b, soft, 3, linear);
  }, [a, b, mode, alpha, soft, linear]);
  const ref = useRef<HTMLCanvasElement>(null), mref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx && out) {
      const im = ctx.createImageData(W, H);
      for (let i = 0; i < W * H; i++) im.data.set([out[3 * i + 2], out[3 * i + 1], out[3 * i], 255], 4 * i);
      ctx.putImageData(im, 0, 0);
    }
    const m = mref.current?.getContext("2d");
    if (m) {
      const im = m.createImageData(W, H);
      for (let i = 0; i < W * H; i++) { const v = mode === "mask" ? soft[i] : Math.round(alpha * 255); im.data.set([v, v, v, 255], 4 * i); }
      m.putImageData(im, 0, 0);
    }
  }, [out, soft, mode, alpha]);
  const code = mode === "uniform"
    ? linear ? "decode sRGB → α·A + (1 − α)·B → encode (float32)" : `cv2.addWeighted(A, ${alpha.toFixed(2)}, B, ${(1 - alpha).toFixed(2)}, 0)`
    : `alpha = cv2.GaussianBlur(mask, (0, 0), ${r}) / 255;  out = alpha·A + (1 − alpha)·B${linear ? "  (in linear light)" : ""}`;
  return (
    <figure className="fig blendlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Blend</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Blend mode">
            {(["uniform", "mask"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-on" : ""} onClick={() => setMode(m)}>{m === "uniform" ? "one α for all pixels" : "α from a mask"}</button>)}
          </div>
        </div>
        {mode === "uniform" && <label className="ctl ctl-wide"><span>α (weight of A) <output>{alpha.toFixed(2)}</output></span><input type="range" min={0} max={1} step={0.05} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} aria-label="Alpha" /></label>}
        {mode === "mask" && <label className="ctl ctl-wide"><span>Edge softness (blur radius) <output>{r} px</output></span><input type="range" min={0} max={20} value={r} onChange={(e) => setR(Number(e.target.value))} aria-label="Feather radius" /></label>}
        <label className="bd-check"><input type="checkbox" checked={linear} onChange={(e) => setLinear(e.target.checked)} /> blend in linear light (decode sRGB first)</label>
      </div>
      <div className="bd-grid">
        <div><canvas ref={mref} width={W} height={H} className="bd-img" role="img" aria-label="Alpha" /><p className="bd-cap">α per pixel (white = A, black = B)</p></div>
        <div><canvas ref={ref} width={W} height={H} className="bd-img" role="img" aria-label="Blended image" /><p className="bd-cap">Result: A = colour shapes, B = grey scene</p></div>
      </div>
      <pre className="bd-code"><code>{code}</code></pre>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
