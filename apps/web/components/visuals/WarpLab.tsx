"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { warp, rotationMatrix, mul3, type Interp } from "@/lib/warp-ops";

const W = 320, H = 200;

function useBgr(src: string) {
  const [d, setD] = useState<Uint8Array | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, W, H);
      const p = ctx.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 3);
      for (let i = 0; i < W * H; i++) { out[3 * i] = p[4 * i]; out[3 * i + 1] = p[4 * i + 1]; out[3 * i + 2] = p[4 * i + 2]; }
      setD(out);
    };
    img.src = src;
  }, [src]);
  return d;
}

/** WarpLab (16.1, 16.2): translate, rotate, scale and shear an image; see the 2 × 3 matrix, the pivot, and what happens to the corners with "same size" vs "fit everything". */
export function WarpLab({ mode = "similarity", src = "/images/sample-color.png", caption }: { mode?: "similarity" | "affine"; src?: string; caption?: string }) {
  const img = useBgr(src);
  const [tx, setTx] = useState(0), [ty, setTy] = useState(0), [deg, setDeg] = useState(30), [s, setS] = useState(1), [sh, setSh] = useState(0);
  const [pivot, setPivot] = useState<"centre" | "origin">("centre");
  const [fit, setFit] = useState(false);
  const [interp, setInterp] = useState<Interp>("linear");
  const { M, ow, oh } = useMemo(() => {
    const cx = pivot === "centre" ? W / 2 : 0, cy = pivot === "centre" ? H / 2 : 0;
    let m = rotationMatrix(cx, cy, deg, s);
    if (mode === "affine" && sh) m = mul3([[1, sh, -sh * cy], [0, 1, 0], [0, 0, 1]], m); // shear about the pivot row
    m = mul3([[1, 0, tx], [0, 1, ty], [0, 0, 1]], m);
    if (!fit) return { M: m, ow: W, oh: H };
    const pts = [[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => [m[0][0] * x + m[0][1] * y + m[0][2], m[1][0] * x + m[1][1] * y + m[1][2]]);
    const x0 = Math.min(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1]));
    const x1 = Math.max(...pts.map((p) => p[0])), y1 = Math.max(...pts.map((p) => p[1]));
    return { M: mul3([[1, 0, -x0], [0, 1, -y0], [0, 0, 1]], m), ow: Math.min(900, Math.ceil(x1 - x0)), oh: Math.min(900, Math.ceil(y1 - y0)) };
  }, [tx, ty, deg, s, sh, pivot, fit, mode]);
  const out = useMemo(() => (img ? warp(img, W, H, 3, M, ow, oh, interp, 0) : null), [img, M, ow, oh, interp]);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx || !out) return;
    const im = ctx.createImageData(ow, oh);
    for (let i = 0; i < ow * oh; i++) im.data.set([out[3 * i], out[3 * i + 1], out[3 * i + 2], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
  }, [out, ow, oh]);
  const f = (v: number) => (Math.abs(v) < 5e-4 ? "0" : v.toFixed(3));
  const sl = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number) => (
    <label className="ctl ctl-wide"><span>{label} <output>{v}</output></span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} /></label>
  );
  return (
    <figure className="fig warplab">
      <div className="sc-ctl">
        {sl("rotation (degrees, counter-clockwise)", deg, setDeg, -180, 180, 1)}
        {sl("scale", s, setS, 0.3, 2, 0.05)}
        {mode === "affine" && sl("shear (x += k·y)", sh, setSh, -1, 1, 0.05)}
        {sl("tx (pixels)", tx, setTx, -150, 150, 1)}
        {sl("ty (pixels)", ty, setTy, -100, 100, 1)}
        <div className="ctl ctl-full"><span>Pivot</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Pivot">
            {(["centre", "origin"] as const).map((p) => <button key={p} type="button" role="radio" aria-checked={pivot === p} className={pivot === p ? "is-on" : ""} onClick={() => setPivot(p)}>{p === "centre" ? "image centre" : "top-left (0, 0)"}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Output</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Output size">
            {[false, true].map((v) => <button key={String(v)} type="button" role="radio" aria-checked={fit === v} className={fit === v ? "is-on" : ""} onClick={() => setFit(v)}>{v ? "enlarge to fit" : "same size as input"}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Interpolation</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Interpolation">
            {(["nearest", "linear", "cubic"] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={interp === k} className={interp === k ? "is-on" : ""} onClick={() => setInterp(k)}>{k}</button>)}
          </div>
        </div>
      </div>
      <div className="wp-out"><canvas ref={ref} width={ow} height={oh} className="wp-img" role="img" aria-label="Warped image" /></div>
      <pre className="wp-mat"><code>{`M = [[${f(M[0][0])}, ${f(M[0][1])}, ${M[0][2].toFixed(1)}],\n     [${f(M[1][0])}, ${f(M[1][1])}, ${M[1][2].toFixed(1)}]]   output ${ow} × ${oh}\ncv2.warpAffine(img, M, (${ow}, ${oh}), flags=cv2.INTER_${interp.toUpperCase()})`}</code></pre>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
