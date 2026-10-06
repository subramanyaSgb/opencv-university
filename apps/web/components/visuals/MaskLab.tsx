"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { shapeMask, logic, maskedMean, count, LOGIC, type Shape, type LogicOp } from "@/lib/mask-ops";

const W = 320, H = 200;
const SHAPES: { label: string; s: Shape; code: string }[] = [
  { label: "circle", s: { kind: "circle", cx: 70, cy: 95, r: 45 }, code: "cv2.circle(mask, (70, 95), 45, 255, -1)" },
  { label: "ring", s: { kind: "ring", cx: 70, cy: 95, r0: 30, r1: 45 }, code: "cv2.circle(mask, (70, 95), 45, 255, -1); cv2.circle(mask, (70, 95), 30, 0, -1)" },
  { label: "rectangle", s: { kind: "rect", x: 125, y: 35, w: 80, h: 120 }, code: "cv2.rectangle(mask, (125, 35), (204, 154), 255, -1)" },
  { label: "polygon", s: { kind: "poly", pts: [[260, 40], [222, 150], [300, 150]] }, code: "cv2.fillPoly(mask, [np.array([[260, 40], [222, 150], [300, 150]])], 255)" },
];
const ACTIONS = [
  { id: "inside", label: "keep inside", code: "cv2.bitwise_and(img, img, mask=mask)" },
  { id: "outside", label: "keep outside", code: "cv2.bitwise_and(img, img, mask=cv2.bitwise_not(mask))" },
  { id: "paint", label: "paint inside", code: "out = img.copy(); out[mask > 0] = (255, 0, 255)" },
] as const;

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

/** MaskLab (Module 14): mode "apply" restricts an operation to a shape mask; mode "logic" combines two masks with bitwise operations. */
export function MaskLab({ mode = "apply", src = "/images/sample-color.png", caption }: { mode?: "apply" | "logic"; src?: string; caption?: string }) {
  const bgr = useBgr(src);
  const [si, setSi] = useState(0);
  const [act, setAct] = useState<(typeof ACTIONS)[number]["id"]>("inside");
  const [op, setOp] = useState<LogicOp>("and");
  const A = useMemo(() => shapeMask(W, H, { kind: "circle", cx: 120, cy: 100, r: 70 }), []);
  const B = useMemo(() => shapeMask(W, H, { kind: "rect", x: 140, y: 40, w: 150, h: 120 }), []);
  const mask = useMemo(() => (mode === "logic" ? logic(A, B, op) : shapeMask(W, H, SHAPES[si].s)), [mode, A, B, op, si]);
  const mRef = useRef<HTMLCanvasElement>(null), oRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const a = mRef.current?.getContext("2d");
    if (a) {
      const im = a.createImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        const v = mask[i];
        let px = [v, v, v];
        if (mode === "logic" && !v) px = [A[i] ? 70 : 30, 30, B[i] ? 90 : 30];
        im.data.set([px[0], px[1], px[2], 255], 4 * i);
      }
      a.putImageData(im, 0, 0);
    }
    const b = oRef.current?.getContext("2d");
    if (b && bgr) {
      const im = b.createImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        const on = mask[i] > 0;
        let px = [bgr[3 * i + 2], bgr[3 * i + 1], bgr[3 * i]];
        if (mode === "logic" || act === "inside") { if (!on) px = [0, 0, 0]; }
        else if (act === "outside") { if (on) px = [0, 0, 0]; }
        else if (on) px = [255, 0, 255];
        im.data.set([px[0], px[1], px[2], 255], 4 * i);
      }
      b.putImageData(im, 0, 0);
    }
  }, [mask, bgr, act, mode, A, B]);
  const n = count(mask);
  const mm = bgr ? maskedMean(bgr, 3, mask) : null;
  const code = mode === "logic" ? LOGIC[op].code : `${SHAPES[si].code}  →  ${ACTIONS.find((x) => x.id === act)!.code}`;
  return (
    <figure className="fig masklab">
      <div className="sc-ctl">
        {mode === "apply" ? (
          <>
            <div className="ctl ctl-full"><span>Mask</span>
              <div className="seg seg-small" role="radiogroup" aria-label="Mask shape">
                {SHAPES.map((s, i) => <button key={s.label} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{s.label}</button>)}
              </div>
            </div>
            <div className="ctl ctl-full"><span>Operation</span>
              <div className="seg seg-small" role="radiogroup" aria-label="Operation">
                {ACTIONS.map((a) => <button key={a.id} type="button" role="radio" aria-checked={act === a.id} className={act === a.id ? "is-on" : ""} onClick={() => setAct(a.id)}>{a.label}</button>)}
              </div>
            </div>
          </>
        ) : (
          <div className="ctl ctl-full"><span>Operation</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Logic operation">
              {(Object.keys(LOGIC) as LogicOp[]).map((o) => <button key={o} type="button" role="radio" aria-checked={op === o} className={op === o ? "is-on" : ""} onClick={() => setOp(o)}>{LOGIC[o].label}</button>)}
            </div>
          </div>
        )}
      </div>
      <div className="mk-grid">
        <div><canvas ref={mRef} width={W} height={H} className="mk-img" role="img" aria-label="Mask" /><p className="mk-cap">{mode === "logic" ? "Result mask (white); A = circle, B = rectangle shown dimly" : "Mask: 255 inside, 0 outside"}</p></div>
        <div><canvas ref={oRef} width={W} height={H} className="mk-img" role="img" aria-label="Masked image" /><p className="mk-cap">Image with the mask applied</p></div>
      </div>
      <div className="ap-stats mk-stats">
        <span>mask pixels <b>{n}</b> ({((100 * n) / (W * H)).toFixed(1)} %)</span>
        {mm && <span>cv2.mean(img, mask) B, G, R <b>{mm.mean.map((v) => v.toFixed(1)).join(", ")}</b></span>}
      </div>
      <pre className="mk-code"><code>{code}</code></pre>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
