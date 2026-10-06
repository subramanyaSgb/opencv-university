"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { snakeMatrix, edgeForce, snakeStep, resample, chanVeseStep } from "@/lib/active-ops";

type Mode = "snake" | "levelset";
const S = 3;

function useGray(src: string) {
  const [g, setG] = useState<{ d: Float64Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Float64Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

const seg = <T extends string>(lab: string, opts: [T, string][], v: T, set: (x: T) => void) => (
  <div className="ctl ctl-full"><span>{lab}</span>
    <div className="seg seg-small" role="radiogroup" aria-label={lab}>
      {opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? "is-on" : ""} onClick={() => set(k)}>{l}</button>)}
    </div>
  </div>
);
const sl = (lab: string, v: number, set: (n: number) => void, min: number, max: number, st: number) => (
  <label className="ctl ctl-wide"><span>{lab} <output>{v}</output></span><input type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={lab} /></label>
);

/** Background: the grey image, or the edge energy. */
function drawBase(ctx: CanvasRenderingContext2D, d: ArrayLike<number>, w: number, h: number, scale = 1) {
  const off = document.createElement("canvas"); off.width = w; off.height = h;
  const o = off.getContext("2d")!, im = o.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = Math.max(0, Math.min(255, Math.round(d[i] * scale))); im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255; }
  o.putImageData(im, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, w * S, h * S);
}

/** ActiveContourLab (Module 28) on sample-snake.png. mode "snake": a parametric snake (elasticity α, rigidity β,
 *  edge weight, balloon force, σ) evolving from a circle; play, step, reset. mode "levelset": Chan–Vese level set from
 *  a circle, a small corner circle or a checkerboard; μ and λ; shows φ > 0, the zero contour, c1 and c2, and the number
 *  of separate regions (topology changes). */
export function ActiveContourLab({ mode = "snake", caption }: { mode?: Mode; caption?: string }) {
  const g = useGray("/images/sample-snake.png");
  return (
    <figure className="fig activecontourlab">
      {!g ? <p className="sn-read">Loading…</p> : mode === "snake" ? <Snake g={g} /> : <LevelSet g={g} />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const STARTS = { outside: { cx: 70, cy: 75, r: 62, balloon: -0.4 }, inside: { cx: 70, cy: 100, r: 10, balloon: 0.4 }, pair: { cx: 162, cy: 78, r: 55, balloon: -0.4 } } as const;
type Start = keyof typeof STARTS;
function Snake({ g }: { g: { d: Float64Array; w: number; h: number } }) {
  const { w, h } = g, n = 120;
  const [start, setStart] = useState<Start>("outside"), [alpha, setAlpha] = useState(0.05), [beta, setBeta] = useState(0.1);
  const [wEdge, setWEdge] = useState(2), [balloon, setBalloon] = useState(-0.4), [sigma, setSigma] = useState(2), [view, setView] = useState<"image" | "energy">("image");
  const [state, setState] = useState<{ x: Float64Array; y: Float64Array; it: number } | null>(null), [playing, setPlaying] = useState(false);
  const F = useMemo(() => edgeForce(g.d, w, h, sigma), [g, w, h, sigma]);
  const P = useMemo(() => snakeMatrix(n, alpha, beta, 1), [alpha, beta]);
  const init = (s: Start = start) => { const c = STARTS[s]; setState({ x: Float64Array.from({ length: n }, (_, i) => c.cx + c.r * Math.cos((2 * Math.PI * i) / n)), y: Float64Array.from({ length: n }, (_, i) => c.cy + c.r * Math.sin((2 * Math.PI * i) / n)), it: 0 }); setPlaying(false); };
  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (k: number) => setState((s) => {
    if (!s) return s; let { x, y } = s, it = s.it;
    for (let j = 0; j < k && it < 600; j++) { [x, y] = snakeStep(x, y, P, F, w, h, { alpha, beta, tau: 1, wEdge, balloon }); it++; if (it % 10 === 0) [x, y] = resample(x, y, n); }
    return { x, y, it };
  });
  useEffect(() => {
    if (!playing) return; let raf = 0;
    const tick = () => { step(5); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }); // re-subscribes each render so step sees current parameters
  useEffect(() => { if (state && state.it >= 600) setPlaying(false); }, [state]);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx || !state) return;
    if (view === "image") drawBase(ctx, g.d, w, h); else drawBase(ctx, F.E, w, h, 255);
    ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2; ctx.beginPath();
    state.x.forEach((v, i) => { const X = (v + 0.5) * S, Y = (state.y[i] + 0.5) * S; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#ff5a5a"; state.x.forEach((v, i) => { if (i % 4 === 0) ctx.fillRect((v + 0.5) * S - 1.5, (state.y[i] + 0.5) * S - 1.5, 3, 3); });
  }, [state, view, g, F, w, h]);
  return (
    <>
      <div className="sc-ctl">
        {seg("Start", [["outside", "circle around the slotted disc"], ["inside", "small circle inside it"], ["pair", "circle around both small discs"]], start, (k) => { setStart(k); setBalloon(STARTS[k].balloon); init(k); })}
        {sl("α elasticity", alpha, setAlpha, 0, 0.5, 0.01)}
        {sl("β rigidity", beta, setBeta, 0, 1, 0.01)}
        {sl("edge weight", wEdge, setWEdge, 0, 6, 0.1)}
        {sl("balloon (− shrink, + grow)", balloon, setBalloon, -1, 1, 0.05)}
        {sl("σ (edge smoothing)", sigma, setSigma, 0.5, 5, 0.5)}
        {seg("Show", [["image", "image"], ["energy", "edge energy |∇(G∗I)|²"]], view, setView)}
        <div className="ctl sn-buttons">
          <button type="button" className="btn" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
          <button type="button" className="btn-ghost" onClick={() => step(10)}>+10 steps</button>
          <button type="button" className="btn-ghost" onClick={() => init()}>Reset</button>
        </div>
      </div>
      <canvas ref={ref} width={w * S} height={h * S} className="sn-img" role="img" aria-label="snake on the image" />
      <p className="sn-read">Iteration {state?.it ?? 0} of 600 · {n} points (resampled every 10 steps).</p>
    </>
  );
}

const INITS = { circle: "circle around the slotted disc", corner: "small circle in a corner", checker: "checkerboard" } as const;
type Init = keyof typeof INITS;
function LevelSet({ g }: { g: { d: Float64Array; w: number; h: number } }) {
  const { w, h } = g, img = useMemo(() => Float64Array.from(g.d, (v) => v / 255), [g]);
  const [init, setInit] = useState<Init>("circle"), [mu, setMu] = useState(0.2), [lam, setLam] = useState(1), [view, setView] = useState<"contour" | "phi">("contour");
  const [state, setState] = useState<{ phi: Float64Array; c1: number; c2: number; it: number } | null>(null), [playing, setPlaying] = useState(false);
  const reset = (k: Init = init) => {
    const phi = new Float64Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) phi[y * w + x] = k === "circle" ? (40 - Math.hypot(x - 100, y - 75)) / 40 : k === "corner" ? (10 - Math.hypot(x - 30, y - 30)) / 40 : Math.sin((Math.PI * x) / 5) * Math.sin((Math.PI * y) / 5);
    setState({ phi, c1: 0, c2: 0, it: 0 }); setPlaying(false);
  };
  useEffect(() => { reset(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (k: number) => setState((s) => { if (!s) return s; let { phi, c1, c2 } = s, it = s.it; for (let j = 0; j < k && it < 400; j++) { ({ phi, c1, c2 } = chanVeseStep(phi, img, w, h, mu, lam, lam)); it++; } return { phi, c1, c2, it }; });
  useEffect(() => { if (!playing) return; let raf = 0; const tick = () => { step(2); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); });
  useEffect(() => { if (state && state.it >= 400) setPlaying(false); }, [state]);
  const regions = useMemo(() => {
    if (!state) return 0; const seen = new Uint8Array(w * h); let n = 0;
    for (let s = 0; s < w * h; s++) { if (seen[s] || state.phi[s] <= 0) continue; n++; const st = [s]; seen[s] = 1; while (st.length) { const p = st.pop()!, x = p % w; for (const q of [p - 1, p + 1, p - w, p + w]) if (q >= 0 && q < w * h && Math.abs((q % w) - x) <= 1 && !seen[q] && state.phi[q] > 0) { seen[q] = 1; st.push(q); } } }
    return n;
  }, [state, w, h]);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx || !state) return;
    if (view === "phi") { const m = Math.max(...Array.from(state.phi, Math.abs)) || 1; drawBase(ctx, Float64Array.from(state.phi, (v) => 128 + (127 * v) / m), w, h); }
    else drawBase(ctx, g.d, w, h);
    ctx.fillStyle = view === "contour" ? "rgba(255,204,0,0.25)" : "rgba(0,0,0,0)";
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, v = state.phi[i] > 0; if (view === "contour" && v) ctx.fillRect(x * S, y * S, S, S); if ((x + 1 < w && (state.phi[i + 1] > 0) !== v) || (y + 1 < h && (state.phi[i + w] > 0) !== v)) { ctx.fillStyle = "#ffcc00"; ctx.fillRect(x * S + 1, y * S + 1, S - 1, S - 1); ctx.fillStyle = view === "contour" ? "rgba(255,204,0,0.25)" : "rgba(0,0,0,0)"; } }
  }, [state, view, g, w, h]);
  return (
    <>
      <div className="sc-ctl">
        {seg("Start", Object.entries(INITS) as [Init, string][], init, (k) => { setInit(k); reset(k); })}
        {sl("μ (length penalty)", mu, setMu, 0, 1, 0.05)}
        {sl("λ1 = λ2 (region fit)", lam, setLam, 0.2, 5, 0.1)}
        {seg("Show", [["contour", "φ > 0 and zero contour"], ["phi", "φ as grey (mid-grey = 0)"]], view, setView)}
        <div className="ctl sn-buttons">
          <button type="button" className="btn" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
          <button type="button" className="btn-ghost" onClick={() => step(20)}>+20 steps</button>
          <button type="button" className="btn-ghost" onClick={() => reset()}>Reset</button>
        </div>
      </div>
      <canvas ref={ref} width={w * S} height={h * S} className="sn-img" role="img" aria-label="level set on the image" />
      <p className="sn-read">Iteration {state?.it ?? 0} of 400 · inside mean c1 = {state && state.it ? (state.c1 * 255).toFixed(1) : "–"}, outside mean c2 = {state && state.it ? (state.c2 * 255).toFixed(1) : "–"} · separate regions with φ &gt; 0: <b>{regions}</b></p>
    </>
  );
}
