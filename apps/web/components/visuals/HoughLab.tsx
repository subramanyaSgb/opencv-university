"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { canny, gradients } from "@/lib/edge-ops";
import { houghLines, lineEnds, houghCircles, ransacLine, ransacIterations, tls, perp, circleKasa, circleGeometric, circleRms, ellipseDirect, arcPoints, rng, type Pt, type Ellipse } from "@/lib/hough-ops";

type Mode = "lines" | "circles" | "ransac" | "fit";
const SRC = "/images/sample-hough.png";
const S = 2; // canvas scale for crisp overlays

function useGray(src: string) {
  const [g, setG] = useState<{ d: Float64Array; w: number; h: number; img: HTMLImageElement } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Float64Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG({ d, w: img.width, h: img.height, img });
    };
    img.src = src;
  }, [src]);
  return g;
}

/** A canvas drawn by a callback at scale S (pixel art underneath, vector overlays on top). */
function Draw({ w, h, draw, label, onPick }: { w: number; h: number; draw: (ctx: CanvasRenderingContext2D) => void; label: string; onPick?: (x: number, y: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const ctx = ref.current?.getContext("2d"); if (!ctx) return; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w * S, h * S); ctx.imageSmoothingEnabled = false; draw(ctx); }, [draw, w, h]);
  return (
    <canvas ref={ref} width={w * S} height={h * S} className="hg-img" role="img" aria-label={label} style={onPick ? { cursor: "crosshair" } : undefined}
      onClick={(e) => { if (!onPick) return; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); onPick(((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * h); }} />
  );
}

/** Heat map of an integer accumulator into an offscreen canvas (sqrt scaling). */
function heat(acc: Int32Array, w: number, h: number, rows: (y: number) => number = (y) => y) {
  let mx = 1; for (const v of acc) if (v > mx) mx = v;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!, im = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = Math.sqrt(acc[rows(y) * w + x] / mx), k = 4 * (y * w + x);
    im.data[k] = Math.round(255 * Math.min(1, t * 1.6)); im.data[k + 1] = Math.round(255 * Math.max(0, t * 1.6 - 0.6)); im.data[k + 2] = Math.round(90 * (1 - t) + 40 * t); im.data[k + 3] = 255;
  }
  ctx.putImageData(im, 0, 0); return c;
}

const fmt = (v: number, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : "–");

/** HoughLab (Module 26). mode "lines": Canny edges → (ρ, θ) accumulator → peaks above a threshold, as cv2.HoughLines; click the accumulator. "circles": gradient voting for circle centres (the idea of cv2.HOUGH_GRADIENT) with radius range, votes and minimum distance. "ransac": a line among outliers, iteration by iteration, vs least squares. "fit": circle (Kåsa, geometric) and ellipse (direct) fits on a partial noisy arc. */
export function HoughLab({ mode = "lines", caption }: { mode?: Mode; caption?: string }) {
  return (
    <figure className="fig houghlab">
      {mode === "lines" && <LinesMode />}
      {mode === "circles" && <CirclesMode />}
      {mode === "ransac" && <RansacMode />}
      {mode === "fit" && <FitMode />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

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

function useEdges(g: ReturnType<typeof useGray>) {
  return useMemo(() => {
    if (!g) return null;
    const { d, w, h } = g, e = canny(d, w, h, 50, 150).edge, { gx, gy } = gradients(d, w, h, "sobel", true);
    return { e, gx, gy, n: e.reduce((s: number, v: number) => s + (v ? 1 : 0), 0) };
  }, [g]);
}

function LinesMode() {
  const g = useGray(SRC), E = useEdges(g);
  const [thStep, setThStep] = useState<"0.5" | "1" | "2">("1"), [rhoStep, setRhoStep] = useState<"1" | "2" | "3">("1"), [thr, setThr] = useState(60);
  const [pick, setPick] = useState<{ rho: number; theta: number; votes: number } | null>(null);
  const H = useMemo(() => (g && E ? houghLines(E.e, g.w, g.h, Number(rhoStep), (Number(thStep) * Math.PI) / 180, thr) : null), [g, E, thStep, rhoStep, thr]);
  // accumulator view: ρ horizontal (only |ρ| ≤ image diagonal), θ vertical
  const view = useMemo(() => {
    if (!g || !H) return null;
    const half = Math.floor((H.numrho - 1) / 2), dmax = Math.ceil(Math.hypot(g.w, g.h) / H.rho), r0 = half - dmax, cols = 2 * dmax + 1;
    const sub = new Int32Array(H.numangle * cols);
    for (let n = 0; n < H.numangle; n++) for (let c = 0; c < cols; c++) sub[n * cols + c] = H.acc[n * H.numrho + r0 + c];
    return { sub, cols, half, r0, canvas: heat(sub, cols, H.numangle) };
  }, [g, H]);
  if (!g || !E || !H || !view) return <p className="hg-read">Loading…</p>;
  const { w, h } = g, shown = H.lines.slice(0, 30);
  const drawImg = (ctx: CanvasRenderingContext2D) => {
    ctx.drawImage(g.img, 0, 0, w * S, h * S);
    ctx.fillStyle = "rgba(255,80,80,0.9)"; E.e.forEach((v: number, i: number) => { if (v) ctx.fillRect((i % w) * S, ((i / w) | 0) * S, S, S); });
    ctx.lineWidth = 1.5;
    for (const l of shown) { const p = lineEnds(l.rho, l.theta, w, h); if (!p) continue; ctx.strokeStyle = "rgba(60,220,120,0.95)"; ctx.beginPath(); ctx.moveTo(p[0] * S, p[1] * S); ctx.lineTo(p[2] * S, p[3] * S); ctx.stroke(); }
    if (pick) { const p = lineEnds(pick.rho, pick.theta, w, h); if (p) { ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p[0] * S, p[1] * S); ctx.lineTo(p[2] * S, p[3] * S); ctx.stroke(); } }
  };
  const aw = view.cols, ah = H.numangle;
  const drawAcc = (ctx: CanvasRenderingContext2D) => {
    ctx.save(); ctx.scale((w * S) / aw, (h * S) / ah); ctx.drawImage(view.canvas, 0, 0); ctx.restore();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    for (const l of shown) { const x = ((l.rho / H.rho + view.half - view.r0 + 0.5) / aw) * w * S, y = ((l.theta / H.theta + 0.5) / ah) * h * S; ctx.beginPath(); ctx.arc(x, y, 8, 0, 2 * Math.PI); ctx.stroke(); }
    if (pick) { const x = ((pick.rho / H.rho + view.half - view.r0 + 0.5) / aw) * w * S, y = ((pick.theta / H.theta + 0.5) / ah) * h * S; ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.stroke(); }
  };
  const onPick = (x: number, y: number) => {
    const c = Math.min(aw - 1, Math.max(0, Math.floor((x / w) * aw))), n = Math.min(ah - 1, Math.max(0, Math.floor((y / h) * ah)));
    setPick({ rho: (c + view.r0 - view.half) * H.rho, theta: n * H.theta, votes: view.sub[n * aw + c] });
  };
  return (
    <>
      <div className="sc-ctl">
        {seg("θ step", [["0.5", "0.5°"], ["1", "1°"], ["2", "2°"]], thStep, (k) => { setThStep(k); setPick(null); })}
        {seg("ρ step", [["1", "1 px"], ["2", "2 px"], ["3", "3 px"]], rhoStep, (k) => { setRhoStep(k); setPick(null); })}
        {sl("threshold (votes >)", thr, setThr, 20, 160, 5)}
      </div>
      <div className="hg-grid">
        <figure className="hg-view"><Draw w={w} h={h} draw={drawImg} label="edges and detected lines" /><figcaption>{E.n} Canny edge pixels (red) · {H.lines.length} lines (green){H.lines.length > 30 ? ", strongest 30 drawn" : ""}</figcaption></figure>
        <figure className="hg-view"><Draw w={w} h={h} draw={drawAcc} label="Hough accumulator" onPick={onPick} /><figcaption>accumulator: ρ → (−{Math.ceil(Math.hypot(w, h))} … {Math.ceil(Math.hypot(w, h))} px), θ ↓ (0 … 180°) · circles = peaks · click a cell</figcaption></figure>
      </div>
      <p className="hg-read">
        {H.numangle} angles × {H.numrho} ρ bins.{" "}
        {pick ? <>Picked ρ = {fmt(pick.rho)} px, θ = {fmt((pick.theta * 180) / Math.PI)}°: <b>{pick.votes}</b> votes (yellow line).</> : <>Strongest: {H.lines.slice(0, 4).map((l) => `ρ ${fmt(l.rho)}, θ ${fmt((l.theta * 180) / Math.PI)}° (${l.votes})`).join(" · ") || "none"}.</>}
      </p>
    </>
  );
}

function CirclesMode() {
  const g = useGray(SRC), E = useEdges(g);
  const [minR, setMinR] = useState(5), [maxR, setMaxR] = useState(35), [votes, setVotes] = useState(30), [minDist, setMinDist] = useState(15);
  const C = useMemo(() => (g && E ? houghCircles(E.e, E.gx, E.gy, g.w, g.h, minR, Math.max(minR, maxR), votes, minDist) : null), [g, E, minR, maxR, votes, minDist]);
  const acc = useMemo(() => (g && C ? heat(C.acc, g.w, g.h) : null), [g, C]);
  if (!g || !E || !C || !acc) return <p className="hg-read">Loading…</p>;
  const { w, h } = g, shown = C.centres.slice(0, 25);
  const drawImg = (ctx: CanvasRenderingContext2D) => {
    ctx.drawImage(g.img, 0, 0, w * S, h * S); ctx.lineWidth = 2;
    for (const c of shown) { ctx.strokeStyle = "rgba(60,220,120,0.95)"; ctx.beginPath(); ctx.arc((c.x + 0.5) * S, (c.y + 0.5) * S, c.r * S, 0, 2 * Math.PI); ctx.stroke(); ctx.fillStyle = "#ffcc00"; ctx.fillRect((c.x + 0.5) * S - 2, (c.y + 0.5) * S - 2, 4, 4); }
  };
  const drawAcc = (ctx: CanvasRenderingContext2D) => {
    ctx.drawImage(acc, 0, 0, w * S, h * S); ctx.strokeStyle = "#7ee0ff"; ctx.lineWidth = 1.2;
    for (const c of shown) { ctx.beginPath(); ctx.arc((c.x + 0.5) * S, (c.y + 0.5) * S, 6, 0, 2 * Math.PI); ctx.stroke(); }
  };
  return (
    <>
      <div className="sc-ctl">
        {sl("min radius", minR, setMinR, 3, 30, 1, " px")}
        {sl("max radius", maxR, setMaxR, 5, 45, 1, " px")}
        {sl("centre votes ≥", votes, setVotes, 5, 120, 1)}
        {sl("min distance between centres", minDist, setMinDist, 1, 40, 1, " px")}
      </div>
      <div className="hg-grid">
        <figure className="hg-view"><Draw w={w} h={h} draw={drawImg} label="detected circles" /><figcaption>{C.centres.length} circles{C.centres.length > 25 ? " (25 drawn)" : ""}</figcaption></figure>
        <figure className="hg-view"><Draw w={w} h={h} draw={drawAcc} label="centre accumulator" /><figcaption>centre votes: each edge pixel votes along its gradient for radii {minR}–{Math.max(minR, maxR)}</figcaption></figure>
      </div>
      <p className="hg-read">{shown.slice(0, 8).map((c) => `(${c.x}, ${c.y}) r ${fmt(c.r)}: ${c.votes} votes`).join(" · ") || "No centre reaches the vote threshold."}</p>
    </>
  );
}

const W2 = 320, H2 = 200;
function RansacMode() {
  const [outPct, setOutPct] = useState(50), [thr, setThr] = useState(3), [iters, setIters] = useState(20), [seed, setSeed] = useState(1), [show, setShow] = useState(20);
  const pts = useMemo(() => {
    const r = rng(100 + seed), g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    const nIn = 60, nOut = Math.round((nIn * outPct) / (100 - outPct)), p: Pt[] = [];
    for (let k = 0; k < nIn; k++) { const x = 20 + r() * 280; p.push([x, 150 - 0.35 * x + 1.2 * g()]); }
    for (let k = 0; k < nOut; k++) p.push([r() * W2, r() * H2]);
    return { p, nIn };
  }, [outPct, seed]);
  const R = useMemo(() => ransacLine(pts.p, iters, thr, 7 + seed), [pts, iters, thr, seed]);
  const ls = useMemo(() => tls(pts.p), [pts]);
  const k = Math.min(show, iters) - 1, st = R.steps[k];
  const wIn = pts.nIn / pts.p.length;
  const seg2 = (l: { cx: number; cy: number; dx: number; dy: number }) => [l.cx - 400 * l.dx, l.cy - 400 * l.dy, l.cx + 400 * l.dx, l.cy + 400 * l.dy];
  const [a, b, c, d] = seg2(R.refit), [e, f, gg, hh] = seg2(ls);
  const angle = (l: { dx: number; dy: number }) => fmt(((((Math.atan2(l.dy, l.dx) * 180) / Math.PI + 90) % 180) + 180) % 180 - 90);
  return (
    <>
      <div className="sc-ctl">
        {sl("outliers", outPct, setOutPct, 0, 80, 5, " %")}
        {sl("inlier threshold", thr, setThr, 1, 10, 0.5, " px")}
        {sl("iterations", iters, (v) => { setIters(v); setShow(v); }, 1, 100, 1)}
        {sl("show iteration", Math.min(show, iters), setShow, 1, iters, 1)}
        <div className="ctl"><button type="button" className="btn-ghost" onClick={() => setSeed((s) => s + 1)}>New random points</button></div>
      </div>
      <svg viewBox={`0 0 ${W2} ${H2}`} className="hg-svg" role="img" aria-label="RANSAC line fit">
        <rect x="0" y="0" width={W2} height={H2} className="hg-bg" />
        <line x1={e} y1={f} x2={gg} y2={hh} className="hg-ls" />
        <line x1={a} y1={b} x2={c} y2={d} className="hg-fit" />
        {pts.p.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.2} className={R.inliers[i] ? "hg-in" : "hg-out"} />)}
        {st && <line x1={pts.p[st.i][0]} y1={pts.p[st.i][1]} x2={pts.p[st.j][0]} y2={pts.p[st.j][1]} className="hg-pair" />}
        {st && [st.i, st.j].map((i) => <circle key={`s${i}`} cx={pts.p[i][0]} cy={pts.p[i][1]} r={4.5} className="hg-sample" />)}
      </svg>
      <p className="hg-read">
        {pts.p.length} points, {pts.nIn} on the line (true angle {fmt((Math.atan2(-0.35, 1) * 180) / Math.PI)}°). Iteration {k + 1}: sample pair (yellow) has <b>{st?.inliers}</b> inliers, best so far {st?.best}.
        RANSAC refit (green) {angle(R.refit)}° with {R.inliers.filter(Boolean).length} inliers · least squares on all points (red) {angle(ls)}°.
        Iterations needed for 99 % success with inlier ratio {fmt(wIn, 2)}: <b>{ransacIterations(0.99, wIn, 2)}</b>. Mean distance of the line points from the red fit: {fmt(pts.p.slice(0, pts.nIn).reduce((s, q) => s + Math.abs(perp(ls, q)), 0) / pts.nIn)} px.
      </p>
    </>
  );
}

function FitMode() {
  const [span, setSpan] = useState(120), [noise, setNoise] = useState(1), [outl, setOutl] = useState(0), [shape, setShape] = useState<"circle" | "ellipse">("circle");
  const truth: Ellipse = shape === "circle" ? { cx: 160, cy: 105, a: 70, b: 70, angle: 0 } : { cx: 160, cy: 105, a: 90, b: 50, angle: 25 };
  const p = useMemo(() => arcPoints(truth, -90 - span / 2, -90 + span / 2, 50, noise, outl, [W2, H2], 3), [span, noise, outl, shape]);
  const k = useMemo(() => circleKasa(p), [p]), gm = useMemo(() => circleGeometric(p), [p]), el = useMemo(() => ellipseDirect(p), [p]);
  const ell = (e: Ellipse, cls: string) => <ellipse cx={e.cx} cy={e.cy} rx={e.a} ry={e.b} transform={`rotate(${e.angle} ${e.cx} ${e.cy})`} className={cls} />;
  const ok = (v: number) => Number.isFinite(v) && Math.abs(v) < 5000;
  return (
    <>
      <div className="sc-ctl">
        {seg("Shape", [["circle", "circle r 70"], ["ellipse", "ellipse 90 × 50, 25°"]], shape, setShape)}
        {sl("arc span", span, setSpan, 20, 360, 10, "°")}
        {sl("noise σ", noise, setNoise, 0, 5, 0.5, " px")}
        {sl("outliers", outl, setOutl, 0, 10, 1)}
      </div>
      <svg viewBox={`0 0 ${W2} ${H2}`} className="hg-svg" role="img" aria-label="circle and ellipse fits">
        <rect x="0" y="0" width={W2} height={H2} className="hg-bg" />
        {ell(truth, "hg-truth")}
        {ok(k.r) && <circle cx={k.cx} cy={k.cy} r={k.r} className="hg-ls" />}
        {ok(gm.r) && <circle cx={gm.cx} cy={gm.cy} r={gm.r} className="hg-fit" />}
        {el && ok(el.a) && ell(el, "hg-ell")}
        {p.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2} className="hg-in" />)}
      </svg>
      <ul className="hg-legend">
        <li><i className="hg-k hg-k-truth" /> truth: centre ({truth.cx}, {truth.cy}), {shape === "circle" ? `r ${truth.a}` : `semi-axes ${truth.a}, ${truth.b}, ${truth.angle}°`}</li>
        <li><i className="hg-k hg-k-ls" /> Kåsa (algebraic) circle: ({fmt(k.cx)}, {fmt(k.cy)}) r {fmt(k.r)} · RMS {fmt(circleRms(p, k), 2)} px</li>
        <li><i className="hg-k hg-k-fit" /> geometric circle: ({fmt(gm.cx)}, {fmt(gm.cy)}) r {fmt(gm.r)} · RMS {fmt(circleRms(p, gm), 2)} px</li>
        <li><i className="hg-k hg-k-ell" /> direct ellipse (fitEllipseDirect): {el ? `(${fmt(el.cx)}, ${fmt(el.cy)}) semi-axes ${fmt(el.a)}, ${fmt(el.b)}, ${fmt(el.angle)}°` : "no ellipse"}</li>
      </ul>
    </>
  );
}
