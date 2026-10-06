"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { background, frame, motionMask, W, H, type DiffMethod } from "@/lib/diff-ops";

const N = 30;
const METHODS: { k: DiffMethod; label: string }[] = [
  { k: "two", label: "two frames |fₜ − fₜ₋₁|" },
  { k: "three", label: "three frames (AND)" },
  { k: "reference", label: "empty reference" },
  { k: "running", label: "running average" },
];

/** DiffLab (14.5): a moving (then stopping) object on a textured background; motion masks from frame differencing methods vs truth. */
export function DiffLab({ initial = "two", caption }: { initial?: DiffMethod; caption?: string }) {
  const bg = useMemo(background, []);
  const data = useMemo(() => Array.from({ length: N }, (_, t) => frame(bg, t)), [bg]);
  const frames = useMemo(() => data.map((d) => d.f), [data]);
  const empty = useMemo(() => Uint8Array.from(bg, (v) => Math.round(v)), [bg]);
  const [t, setT] = useState(8);
  const [m, setM] = useState<DiffMethod>(initial);
  const [thr, setThr] = useState(25);
  const [alpha, setAlpha] = useState(0.1);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setT((v) => (v >= N - 1 ? 2 : v + 1)), 350);
    return () => clearInterval(id);
  }, [play]);
  const truthT = m === "three" ? t - 1 : t; // three-frame differencing locates the object in the middle frame
  const mask = useMemo(() => motionMask(frames, t, m, thr, alpha, empty), [frames, t, m, thr, alpha, empty]);
  const truth = data[truthT].truth;
  const fRef = useRef<HTMLCanvasElement>(null), mRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const a = fRef.current?.getContext("2d"), b = mRef.current?.getContext("2d");
    if (!a || !b) return;
    const ia = a.createImageData(W, H), ib = b.createImageData(W, H), f = frames[t];
    for (let i = 0; i < W * H; i++) {
      ia.data.set([f[i], f[i], f[i], 255], 4 * i);
      const on = mask[i], tr = truth[i];
      const px = on && tr ? [20, 20, 20] : on ? [230, 40, 40] : tr ? [40, 110, 240] : [245, 245, 245];
      ib.data.set([px[0], px[1], px[2], 255], 4 * i);
    }
    a.putImageData(ia, 0, 0); b.putImageData(ib, 0, 0);
  }, [frames, t, mask, truth]);
  let found = 0, tot = 0, fp = 0;
  for (let i = 0; i < mask.length; i++) { if (truth[i]) { tot++; if (mask[i]) found++; } else if (mask[i]) fp++; }
  return (
    <figure className="fig difflab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Method</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Method">
            {METHODS.map((x) => <button key={x.k} type="button" role="radio" aria-checked={m === x.k} className={m === x.k ? "is-on" : ""} onClick={() => setM(x.k)}>{x.label}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Frame <output>{t}</output>{t >= 12 && t <= 19 ? " (object standing still)" : ""}</span><input type="range" min={2} max={N - 1} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Frame" /></label>
        <label className="ctl ctl-wide"><span>Threshold on |difference| <output>{thr}</output></span><input type="range" min={1} max={80} value={thr} onChange={(e) => setThr(Number(e.target.value))} aria-label="Threshold" /></label>
        {m === "running" && <label className="ctl ctl-wide"><span>α (learning rate per frame) <output>{alpha.toFixed(2)}</output></span><input type="range" min={0.01} max={0.5} step={0.01} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} aria-label="Alpha" /></label>}
        <button type="button" className="hl-reset" onClick={() => setPlay((p) => !p)}>{play ? "Pause" : "Play"}</button>
      </div>
      <div className="fd-grid">
        <div><canvas ref={fRef} width={W} height={H} className="fd-img" role="img" aria-label="Current frame" /><p className="fd-cap">Frame {t}</p></div>
        <div><canvas ref={mRef} width={W} height={H} className="fd-img" role="img" aria-label="Motion mask" /><p className="fd-cap">Black: object found · <span className="fd-fp">red: false motion</span> · <span className="fd-fn">blue: object missed</span>{m === "three" ? " (truth: frame t − 1)" : ""}</p></div>
      </div>
      <div className="ap-stats fd-stats"><span>object found <b>{((100 * found) / Math.max(tot, 1)).toFixed(0)} %</b></span><span>false motion pixels <b>{fp}</b></span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
