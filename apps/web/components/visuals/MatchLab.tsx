"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { matchTemplate, peaks, warpTemplate, METHODS, lowerIsBetter, type Method } from "@/lib/match-ops";

type Mode = "slide" | "methods" | "scale" | "limits";
const W = 240, H = 150, S = 3;
const TPL = { x: 25, y: 22, w: 31, h: 27 };   // the reference chip
const TRUTH: Record<string, [number, number]> = { rotated: [90, 80], scaled: [195, 45], bright: [195, 110], upside: [40, 122] };

function useBoard() {
  const [g, setG] = useState<Float64Array | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Float64Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG(d);
    };
    img.src = "/images/sample-board.png";
  }, []);
  return g;
}
const cropTpl = (g: Float64Array) => { const t = new Float64Array(TPL.w * TPL.h); for (let y = 0; y < TPL.h; y++) for (let x = 0; x < TPL.w; x++) t[y * TPL.w + x] = g[(TPL.y + y) * W + TPL.x + x]; return t; };

/** Canvas: grey image at scale S plus an overlay callback (coordinates in image pixels × S). */
function View({ d, w, h, label, overlay, heat, onPick, scale = S }: { d: ArrayLike<number>; w: number; h: number; label: string; overlay?: (ctx: CanvasRenderingContext2D) => void; heat?: boolean; onPick?: (x: number, y: number) => void; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    let a = Infinity, b = -Infinity; for (let i = 0; i < w * h; i++) { if (d[i] < a) a = d[i]; if (d[i] > b) b = d[i]; }
    const off = document.createElement("canvas"); off.width = w; off.height = h; const o = off.getContext("2d")!, im = o.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const t = heat ? (d[i] - a) / (b - a || 1) : Math.max(0, Math.min(1, d[i] / 255));
      if (heat) { im.data[4 * i] = Math.round(255 * Math.min(1, 1.6 * t)); im.data[4 * i + 1] = Math.round(255 * Math.max(0, 1.6 * t - 0.6)); im.data[4 * i + 2] = Math.round(110 * (1 - t)); }
      else { im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = Math.round(255 * t); }
      im.data[4 * i + 3] = 255;
    }
    o.putImageData(im, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, w * scale, h * scale); ctx.drawImage(off, 0, 0, w * scale, h * scale); overlay?.(ctx);
  }, [d, w, h, heat, overlay, scale]);
  return (
    <figure className="tm-view">
      <canvas ref={ref} width={w * scale} height={h * scale} className="tm-img" role="img" aria-label={label} style={onPick ? { cursor: "crosshair" } : undefined}
        onClick={(e) => { if (!onPick) return; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); onPick(Math.floor(((e.clientX - r.left) / r.width) * w), Math.floor(((e.clientY - r.top) / r.height) * h)); }} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}
const box = (x: number, y: number, w: number, h: number, colour: string, lw = 2) => (ctx: CanvasRenderingContext2D) => { ctx.strokeStyle = colour; ctx.lineWidth = lw; ctx.strokeRect(x * S, y * S, w * S, h * S); };

const seg = <T extends string>(lab: string, opts: [T, string][], v: T, set: (x: T) => void) => (
  <div className="ctl ctl-full"><span>{lab}</span>
    <div className="seg seg-small" role="radiogroup" aria-label={lab}>
      {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
    </div>
  </div>
);
const sl = (lab: string, v: number, set: (n: number) => void, min: number, max: number, st: number, unit = "") => (
  <label className="ctl ctl-wide"><span>{lab} <output>{v}{unit}</output></span><input type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={lab} /></label>
);
const fmt = (v: number) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en") : v.toFixed(3));

/** MatchLab (Module 32) on sample-board.png with the top-left chip as template. mode "slide": move the template by
 *  clicking and read SSD and NCC at that position. "methods": all six cv2.matchTemplate methods (exact formulas),
 *  result map, best match and peaks above a threshold; an image gain slider shows which methods break. "scale":
 *  search over template scales for the 1.3× chip. "limits": rotate / scale the template and watch the NCC at the
 *  true chip fall. */
export function MatchLab({ mode = "methods", caption }: { mode?: Mode; caption?: string }) {
  const g = useBoard();
  return (
    <figure className="fig matchlab">
      {!g ? <p className="tm-read">Loading…</p> : mode === "slide" ? <Slide g={g} /> : mode === "methods" ? <Methods g={g} /> : mode === "scale" ? <Scale g={g} /> : <Limits g={g} />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Slide({ g }: { g: Float64Array }) {
  const tpl = useMemo(() => cropTpl(g), [g]), [pos, setPos] = useState<[number, number]>([60, 20]);
  const x = Math.min(W - TPL.w, Math.max(0, pos[0])), y = Math.min(H - TPL.h, Math.max(0, pos[1]));
  let ssd = 0, cc = 0, ii = 0, tt = 0, is = 0, ts = 0; const n = TPL.w * TPL.h;
  for (let j = 0; j < TPL.h; j++) for (let i = 0; i < TPL.w; i++) { const a = g[(y + j) * W + x + i], b = tpl[j * TPL.w + i]; ssd += (a - b) ** 2; is += a; ts += b; }
  const ma = is / n, mb = ts / n;
  for (let j = 0; j < TPL.h; j++) for (let i = 0; i < TPL.w; i++) { const a = g[(y + j) * W + x + i] - ma, b = tpl[j * TPL.w + i] - mb; cc += a * b; ii += a * a; tt += b * b; }
  const ncc = ii && tt ? cc / Math.sqrt(ii * tt) : 0;
  return (
    <>
      <div className="tm-grid">
        <View d={g} w={W} h={H} label="click to place the template's top-left corner" onPick={(px, py) => setPos([px, py])} overlay={(ctx) => { box(TPL.x, TPL.y, TPL.w, TPL.h, "#3ca0ff")(ctx); box(x, y, TPL.w, TPL.h, "#ffcc00", 2.5)(ctx); }} />
        <View d={tpl} w={TPL.w} h={TPL.h} scale={6} label="template (blue box, 31 × 27)" />
      </div>
      <p className="tm-read">Window at ({x}, {y}): sum of squared differences <b>{Math.round(ssd).toLocaleString("en")}</b> (0 = identical) · normalised correlation <b>{ncc.toFixed(3)}</b> (1 = identical up to brightness and contrast).</p>
    </>
  );
}

function Methods({ g }: { g: Float64Array }) {
  const tpl = useMemo(() => cropTpl(g), [g]);
  const [m, setM] = useState<Method>("CCOEFF_NORMED"), [gain, setGain] = useState(1), [thr, setThr] = useState(0.8);
  const img = useMemo(() => (gain === 1 ? g : Float64Array.from(g, (v, i) => ((i % W) > 120 ? Math.min(255, v * gain) : v))), [g, gain]);
  const res = useMemo(() => matchTemplate(img, W, H, tpl, TPL.w, TPL.h, m), [img, tpl, m]);
  const low = lowerIsBetter(m), normed = m.endsWith("NORMED");
  let bi = 0; res.R.forEach((v, i) => { if (low ? v < res.R[bi] : v > res.R[bi]) bi = i; });
  const bx = bi % res.rw, by = (bi / res.rw) | 0;
  const P = useMemo(() => (normed ? peaks(res.R, res.rw, res.rh, low ? 1 - thr : thr, low, 6) : []), [res, normed, low, thr]);
  return (
    <>
      <div className="sc-ctl">
        {seg("Method", METHODS.map((k) => [k, `TM_${k}`] as [Method, string]), m, setM)}
        {sl("gain on the right half of the image", gain, setGain, 0.6, 1.6, 0.1, "×")}
        {normed && sl(low ? "accept if score ≤ 1 − t, t" : "accept if score ≥ t", thr, setThr, 0.3, 0.99, 0.01)}
      </div>
      <div className="tm-grid">
        <View d={img} w={W} h={H} label={`best match (yellow) at (${bx}, ${by}); ${normed ? `${P.length} matches over the threshold (green)` : "raw scores: no fixed threshold"}`}
          overlay={(ctx) => { box(bx, by, TPL.w, TPL.h, "#ffcc00", 3)(ctx); P.forEach((p) => box(p.x, p.y, TPL.w, TPL.h, "#3ce07a", 1.5)(ctx)); }} />
        <View d={res.R} w={res.rw} h={res.rh} heat label={`result map ${res.rw} × ${res.rh}: bright = high score${low ? " (for SQDIFF the best match is the darkest point)" : ""}`} />
      </div>
      <p className="tm-read">Best score {fmt(res.R[bi])}. {low ? "For SQDIFF methods the best match is the minimum." : "The best match is the maximum."} {!normed ? "Unnormalised scores grow with image brightness and contrast: the best match may land on a bright region instead of a chip." : ""}</p>
    </>
  );
}

function Scale({ g }: { g: Float64Array }) {
  const tpl = useMemo(() => cropTpl(g), [g]);
  const scales = useMemo(() => Array.from({ length: 11 }, (_, i) => 0.8 + i * 0.07), []);
  const rows = useMemo(() => scales.map((s) => {
    const t = warpTemplate(tpl, TPL.w, TPL.h, 0, s, 100), r = matchTemplate(g, W, H, t.t, t.w, t.h, "CCOEFF_NORMED");
    const [tx, ty] = TRUTH.scaled, ix = Math.round(tx - (t.w - 1) / 2), iy = Math.round(ty - (t.h - 1) / 2);
    let v = -1; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = ix + dx, y = iy + dy; if (x >= 0 && y >= 0 && x < r.rw && y < r.rh) v = Math.max(v, r.R[y * r.rw + x]); }
    return { s, v, w: t.w, h: t.h };
  }), [g, tpl, scales]);
  const best = rows.reduce((a, b) => (b.v > a.v ? b : a));
  const [tx, ty] = TRUTH.scaled;
  return (
    <>
      <div className="tm-grid">
        <View d={g} w={W} h={H} label={`target: the 1.3× chip; best scale ${best.s.toFixed(2)} (box)`} overlay={box(Math.round(tx - (best.w - 1) / 2), Math.round(ty - (best.h - 1) / 2), best.w, best.h, "#ffcc00", 2.5)} />
        <div className="tm-bars" aria-label="NCC at the chip for each template scale">
          {rows.map((r) => <div key={r.s} className={`tm-bar${r === best ? " is-best" : ""}`}><i style={{ height: `${Math.max(0, r.v) * 100}%` }} /><span>{r.s.toFixed(2)}</span><b>{r.v.toFixed(2)}</b></div>)}
        </div>
      </div>
      <p className="tm-read">Normalised correlation at the large chip for template scales 0.80 to 1.50. Only scales near 1.3 give a strong match; at scale 1.0 the template does not fit at all.</p>
    </>
  );
}

function Limits({ g }: { g: Float64Array }) {
  const tpl = useMemo(() => cropTpl(g), [g]);
  const [angle, setAngle] = useState(0), [scale, setScale] = useState(1), [target, setTarget] = useState<"ref" | keyof typeof TRUTH>("rotated");
  const t = useMemo(() => warpTemplate(tpl, TPL.w, TPL.h, angle, scale, 100), [tpl, angle, scale]);
  const r = useMemo(() => matchTemplate(g, W, H, t.t, t.w, t.h, "CCOEFF_NORMED"), [g, t]);
  const [cx, cy] = target === "ref" ? [40, 35] : TRUTH[target];
  const ix = Math.round(cx - (t.w - 1) / 2), iy = Math.round(cy - (t.h - 1) / 2);
  let at = -1; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = ix + dx, y = iy + dy; if (x >= 0 && y >= 0 && x < r.rw && y < r.rh) at = Math.max(at, r.R[y * r.rw + x]); }
  let bi = 0; r.R.forEach((v, i) => { if (v > r.R[bi]) bi = i; });
  return (
    <>
      <div className="sc-ctl">
        {seg("Target", [["ref", "reference chip"], ["rotated", "rotated 15°"], ["scaled", "scaled 1.3×"], ["bright", "brighter"], ["upside", "upside down"]], target, setTarget)}
        {sl("rotate template", angle, setAngle, -30, 180, 5, "°")}
        {sl("scale template", scale, setScale, 0.7, 1.5, 0.05, "×")}
      </div>
      <div className="tm-grid">
        <View d={g} w={W} h={H} label="target (blue) and the overall best match (yellow)" overlay={(ctx) => { box(ix, iy, t.w, t.h, "#3ca0ff")(ctx); box(bi % r.rw, (bi / r.rw) | 0, t.w, t.h, "#ffcc00", 2.5)(ctx); }} />
        <View d={t.t} w={t.w} h={t.h} scale={5} label={`template ${t.w} × ${t.h} after rotation and scaling`} />
      </div>
      <p className="tm-read">NCC at the target: <b>{at.toFixed(3)}</b> · best anywhere: {r.R[bi].toFixed(3)}. Find the rotation and scale that bring the target back above 0.9.</p>
    </>
  );
}
