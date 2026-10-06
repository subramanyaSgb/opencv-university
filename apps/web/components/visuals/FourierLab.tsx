"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dft, idft, logSpectrum, transfer, applyFilter, notchReject, peaks, wave, psnr, freq, type FilterKind } from "@/lib/fourier-ops";

type Mode = "waves" | "spectrum" | "filter" | "notch" | "conv";
const N = 256;

function useGray(src: string) {
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
    img.src = src;
  }, [src]);
  return g;
}

/** Grey canvas; values mapped with lo…hi → 0…255. */
function Gray({ d, w, h, lo = 0, hi = 255, label, overlay, onPick }: { d: ArrayLike<number>; w: number; h: number; lo?: number; hi?: number; label: string; overlay?: (ctx: CanvasRenderingContext2D) => void; onPick?: (x: number, y: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = Math.max(0, Math.min(255, Math.round(((d[i] - lo) / (hi - lo || 1)) * 255))); im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255; }
    ctx.putImageData(im, 0, 0); overlay?.(ctx);
  }, [d, w, h, lo, hi, overlay]);
  return (
    <figure className="fq-view">
      <canvas ref={ref} width={w} height={h} className="fq-img" role="img" aria-label={label} style={onPick ? { cursor: "crosshair" } : undefined}
        onClick={(e) => { if (!onPick) return; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); onPick(Math.floor(((e.clientX - r.left) / r.width) * w), Math.floor(((e.clientY - r.top) / r.height) * h)); }} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}
const range = (d: ArrayLike<number>) => { let a = Infinity, b = -Infinity; for (let i = 0; i < d.length; i++) { if (d[i] < a) a = d[i]; if (d[i] > b) b = d[i]; } return [a, b] as const; };
const Spec = ({ d, label, overlay, onPick }: { d: Float64Array; label: string; overlay?: (ctx: CanvasRenderingContext2D) => void; onPick?: (x: number, y: number) => void }) => { const [a, b] = range(d); return <Gray d={d} w={N} h={N} lo={a} hi={b} label={label} overlay={overlay} onPick={onPick} />; };

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
const ring = (r: number, colour: string) => (ctx: CanvasRenderingContext2D) => { ctx.strokeStyle = colour; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(N / 2, N / 2, r, 0, 2 * Math.PI); ctx.stroke(); };

/** FourierLab (Module 30, 256 × 256 images). mode "waves": build an image from up to two 2-D cosine waves and see their
 *  spectrum peaks. "spectrum": log-magnitude spectrum of test images; click the spectrum to see that frequency's wave;
 *  swap magnitude and phase of two images. "filter": ideal / Butterworth / Gaussian low- and high-pass. "notch": find
 *  and remove periodic interference. "conv": spatial (reflect-101) vs FFT (circular) convolution, with zero padding. */
export function FourierLab({ mode = "spectrum", caption }: { mode?: Mode; caption?: string }) {
  return (
    <figure className="fig fourierlab">
      {mode === "waves" ? <Waves /> : mode === "spectrum" ? <Spectrum /> : mode === "filter" ? <Filter /> : mode === "notch" ? <Notch /> : <Conv />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Waves() {
  const [u1, setU1] = useState(8), [v1, setV1] = useState(0), [a1, setA1] = useState(60), [u2, setU2] = useState(3), [v2, setV2] = useState(12), [a2, setA2] = useState(0);
  const img = useMemo(() => { const w1 = wave(N, N, u1, v1, a1, 0, 128), w2 = wave(N, N, u2, v2, a2); return w1.map((v, i) => v + w2[i]); }, [u1, v1, a1, u2, v2, a2]);
  const S = useMemo(() => logSpectrum(dft(img, N, N), N, N), [img]);
  const marks = useMemo(() => (ctx: CanvasRenderingContext2D) => { ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 1.5; for (const [u, v, a] of [[u1, v1, a1], [u2, v2, a2]]) { if (!a) continue; for (const s of [1, -1]) { ctx.beginPath(); ctx.arc(N / 2 + s * u, N / 2 + s * v, 6, 0, 2 * Math.PI); ctx.stroke(); } } }, [u1, v1, a1, u2, v2, a2]);
  const lam = (u: number, v: number) => (u || v ? (N / Math.hypot(u, v)).toFixed(1) : "∞");
  return (
    <>
      <div className="sc-ctl fq-two">
        <div><b>Wave 1</b>{sl("u (cycles across)", u1, setU1, -32, 32, 1)}{sl("v (cycles down)", v1, setV1, -32, 32, 1)}{sl("amplitude", a1, setA1, 0, 100, 5)}</div>
        <div><b>Wave 2</b>{sl("u", u2, setU2, -32, 32, 1)}{sl("v", v2, setV2, -32, 32, 1)}{sl("amplitude", a2, setA2, 0, 100, 5)}</div>
      </div>
      <div className="fq-grid">
        <Gray d={img} w={N} h={N} label={`image: wave 1 period ${lam(u1, v1)} px${a2 ? `, wave 2 period ${lam(u2, v2)} px` : ""}`} />
        <Spec d={S} label="log spectrum (centre = 0 frequency); circles mark ±(u, v)" overlay={marks} />
      </div>
    </>
  );
}

const SOURCES = { scene: "/images/sample-fft-scene.png", periodic: "/images/sample-fft-periodic.png" } as const;
function synth(kind: "stripes" | "rotated" | "square") {
  const d = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (kind === "stripes") d[i] = 128 + 100 * Math.sign(Math.sin((2 * Math.PI * x) / 16));
    else if (kind === "rotated") { const t = x * Math.cos(0.5) + y * Math.sin(0.5); d[i] = 128 + 100 * Math.sign(Math.sin((2 * Math.PI * t) / 16)); }
    else d[i] = Math.abs(x - 128) < 24 && Math.abs(y - 128) < 24 ? 230 : 30;
  }
  return d;
}
function Spectrum() {
  const scene = useGray(SOURCES.scene), periodic = useGray(SOURCES.periodic);
  const [src, setSrc] = useState<"scene" | "periodic" | "stripes" | "rotated" | "square">("scene"), [view, setView] = useState<"mag" | "swap">("mag"), [pick, setPick] = useState<[number, number] | null>(null);
  const img = useMemo(() => (src === "scene" ? scene : src === "periodic" ? periodic : synth(src)), [src, scene, periodic]);
  const F = useMemo(() => (img ? dft(img, N, N) : null), [img]);
  const S = useMemo(() => (F ? logSpectrum(F, N, N) : null), [F]);
  const swap = useMemo(() => {
    if (view !== "swap" || !scene) return null;
    const A = dft(scene, N, N), B = dft(synth("square"), N, N), ma = { re: new Float64Array(N * N), im: new Float64Array(N * N) }, mb = { re: new Float64Array(N * N), im: new Float64Array(N * N) };
    for (let i = 0; i < N * N; i++) { const pa = Math.atan2(A.im[i], A.re[i]), pb = Math.atan2(B.im[i], B.re[i]), ra = Math.hypot(A.re[i], A.im[i]), rb = Math.hypot(B.re[i], B.im[i]); ma.re[i] = rb * Math.cos(pa); ma.im[i] = rb * Math.sin(pa); mb.re[i] = ra * Math.cos(pb); mb.im[i] = ra * Math.sin(pb); }
    return { a: idft(ma, N, N), b: idft(mb, N, N) };
  }, [view, scene]);
  const basis = useMemo(() => {
    if (!pick || !F) return null;
    const u = pick[0] - N / 2, v = pick[1] - N / 2, i = (((v % N) + N) % N) * N + (((u % N) + N) % N), m = Math.hypot(F.re[i], F.im[i]), ph = Math.atan2(F.im[i], F.re[i]);
    return { u, v, m, img: wave(N, N, u, v, 100, ph, 128) };
  }, [pick, F]);
  if (!img || !S) return <p className="fq-read">Loading…</p>;
  const mark = pick ? (ctx: CanvasRenderingContext2D) => { ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pick[0], pick[1], 5, 0, 2 * Math.PI); ctx.stroke(); } : undefined;
  return (
    <>
      <div className="sc-ctl">
        {seg("Image", [["scene", "test scene"], ["periodic", "scene + interference"], ["stripes", "vertical stripes"], ["rotated", "stripes at 29°"], ["square", "bright square"]], src, (k) => { setSrc(k); setPick(null); })}
        {seg("Show", [["mag", "magnitude spectrum"], ["swap", "swap magnitude and phase"]], view, setView)}
      </div>
      {view === "mag" ? (
        <div className="fq-grid">
          <Gray d={img} w={N} h={N} label="image" />
          <Spec d={S} label="log(1 + |F|), shifted · click a point" overlay={mark} onPick={(x, y) => setPick([x, y])} />
          {basis && <Gray d={basis.img} w={N} h={N} label={`the wave at (u, v) = (${basis.u}, ${basis.v}): |F| = ${basis.m.toFixed(0)}`} />}
        </div>
      ) : swap && (
        <div className="fq-grid">
          <Gray d={swap.a} w={N} h={N} lo={range(swap.a)[0]} hi={range(swap.a)[1]} label="phase of the scene + magnitude of the square" />
          <Gray d={swap.b} w={N} h={N} lo={range(swap.b)[0]} hi={range(swap.b)[1]} label="phase of the square + magnitude of the scene" />
        </div>
      )}
      <p className="fq-read">{view === "swap" ? "The image follows its phase: edges and positions are stored in the phase, the magnitude says how much of each frequency." : "Bright centre: slow changes (the mean and the gradient). Lines through the centre: edges perpendicular to them. Isolated bright points: periodic patterns."}</p>
    </>
  );
}

function Filter() {
  const scene = useGray(SOURCES.scene);
  const [kind, setKind] = useState<FilterKind>("ideal"), [high, setHigh] = useState(false), [D0, setD0] = useState(30), [n, setN] = useState(2);
  const T = useMemo(() => transfer(kind, D0, N, N, high, n), [kind, D0, high, n]);
  const out = useMemo(() => (scene ? applyFilter(scene, T, N, N) : null), [scene, T]);
  const S = useMemo(() => (scene ? logSpectrum(dft(scene, N, N), N, N) : null), [scene]);
  const masked = useMemo(() => { if (!S) return null; const m = new Float64Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) m[y * N + x] = S[y * N + x] * T[((y + N / 2) % N) * N + ((x + N / 2) % N)]; return m; }, [S, T]);
  const energy = useMemo(() => { if (!scene) return 0; const F = dft(scene, N, N); let a = 0, b = 0; for (let i = 0; i < N * N; i++) { const p = F.re[i] ** 2 + F.im[i] ** 2; a += p * T[i] * T[i]; b += p; } return a / b; }, [scene, T]);
  if (!scene || !out || !masked) return <p className="fq-read">Loading…</p>;
  const [lo, hi] = high ? range(out) : [0, 255];
  return (
    <>
      <div className="sc-ctl">
        {seg("Filter", [["ideal", "ideal"], ["butterworth", "Butterworth"], ["gaussian", "Gaussian"]], kind, setKind)}
        {seg("Type", [["low", "low-pass"], ["high", "high-pass"]], high ? "high" : "low", (k) => setHigh(k === "high"))}
        {sl("cut-off D0", D0, setD0, 2, 120, 1, " cycles")}
        {kind === "butterworth" && sl("order n", n, setN, 1, 10, 1)}
      </div>
      <div className="fq-grid">
        <Gray d={scene} w={N} h={N} label="input" />
        <Spec d={masked} label="spectrum × H (the filter keeps what is bright)" overlay={ring(D0, "#ffcc00")} />
        <Gray d={out} w={N} h={N} lo={lo} hi={hi} label={high ? "high-pass result (stretched)" : "low-pass result"} />
      </div>
      <p className="fq-read">Energy kept: {(energy * 100).toFixed(2)} % of Σ|F|². Ideal low-pass: look for ringing (ripples) beside the edges; Gaussian has none.</p>
    </>
  );
}

function Notch() {
  const scene = useGray(SOURCES.scene), noisy = useGray(SOURCES.periodic);
  const [r, setR] = useState(3), [count, setCount] = useState(2);
  const F = useMemo(() => (noisy ? dft(noisy, N, N) : null), [noisy]);
  const P = useMemo(() => (F ? peaks(F, N, N, 4, 6) : []), [F]);
  const T = useMemo(() => notchReject(P.slice(0, count).map((p) => [p.u, p.v] as [number, number]), r, N, N), [P, count, r]);
  const out = useMemo(() => (noisy ? applyFilter(noisy, T, N, N) : null), [noisy, T]);
  const S = useMemo(() => (F ? logSpectrum(F, N, N) : null), [F]);
  if (!scene || !noisy || !out || !S) return <p className="fq-read">Loading…</p>;
  const marks = (ctx: CanvasRenderingContext2D) => { P.forEach((p, k) => { ctx.strokeStyle = k < count ? "#ff4d4d" : "#7ee0ff"; ctx.lineWidth = 1.5; for (const s of [1, -1]) { ctx.beginPath(); ctx.arc(N / 2 + s * p.u, N / 2 + s * p.v, r + 3, 0, 2 * Math.PI); ctx.stroke(); } }); };
  return (
    <>
      <div className="sc-ctl">
        {sl("peaks removed", count, setCount, 0, 4, 1)}
        {sl("notch radius D0", r, setR, 1, 12, 1, " cycles")}
      </div>
      <div className="fq-grid">
        <Gray d={noisy} w={N} h={N} label={`with interference · PSNR vs clean ${psnr(noisy, scene).toFixed(1)} dB`} />
        <Spec d={S} label={`strongest peaks: ${P.map((p) => `(${p.u}, ${p.v})`).join(" ")} · red = notched`} overlay={marks} />
        <Gray d={out} w={N} h={N} label={`after the notch filter · PSNR ${psnr(out, scene).toFixed(1)} dB`} />
      </div>
    </>
  );
}

function Conv() {
  const scene = useGray(SOURCES.scene);
  const [k, setK] = useState(15), [pad, setPad] = useState(false);
  const res = useMemo(() => {
    if (!scene) return null;
    const r = (k - 1) / 2, M = pad ? 512 : N;
    // spatial box filter with BORDER_REFLECT_101 (as cv2.blur)
    const at = (x: number, y: number) => { const rx = x < 0 ? -x : x >= N ? 2 * N - 2 - x : x, ry = y < 0 ? -y : y >= N ? 2 * N - 2 - y : y; return scene[ry * N + rx]; };
    const sp = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) s += at(x + dx, y + dy); sp[y * N + x] = s / (k * k); }
    // FFT: image (zero-padded to M if pad) times the box's spectrum, centred kernel
    const big = new Float64Array(M * M), ker = new Float64Array(M * M);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) big[y * M + x] = scene[y * N + x];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) ker[(((dy % M) + M) % M) * M + (((dx % M) + M) % M)] = 1 / (k * k);
    const A = dft(big, M, M), B = dft(ker, M, M);
    for (let i = 0; i < M * M; i++) { const re = A.re[i] * B.re[i] - A.im[i] * B.im[i], im = A.re[i] * B.im[i] + A.im[i] * B.re[i]; A.re[i] = re; A.im[i] = im; }
    const full = idft(A, M, M), fq = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) fq[y * N + x] = full[y * M + x];
    const diff = sp.map((v, i) => Math.abs(v - fq[i]));
    let inner = 0, edge = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = diff[y * N + x]; if (x >= r && y >= r && x < N - r && y < N - r) inner = Math.max(inner, d); else edge = Math.max(edge, d); }
    return { sp, fq, diff, inner, edge };
  }, [scene, k, pad]);
  if (!res) return <p className="fq-read">Loading…</p>;
  return (
    <>
      <div className="sc-ctl">
        {sl("box size k", k, setK, 3, 41, 2, " px")}
        {seg("FFT input", [["circ", "256 × 256 as is (circular)"], ["pad", "zero-padded to 512 × 512"]], pad ? "pad" : "circ", (v) => setPad(v === "pad"))}
      </div>
      <div className="fq-grid">
        <Gray d={res.sp} w={N} h={N} label="spatial filter (cv2.blur, reflect-101 border)" />
        <Gray d={res.fq} w={N} h={N} label="FFT: F(image) · F(kernel), inverse" />
        <Gray d={res.diff} w={N} h={N} lo={0} hi={Math.max(1, res.edge)} label={`|difference| · inside: ${res.inner.toExponential(1)} · border band: ${res.edge.toFixed(1)}`} />
      </div>
      <p className="fq-read">Away from the border (more than {(k - 1) / 2} px in) the two agree to rounding error. At the border, circular FFT convolution wraps the opposite side of the image in; zero padding gives a dark border instead. Neither equals reflect-101.</p>
    </>
  );
}
