"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { floodFill, growMean, kmeans, meanShiftFilter, watershed, slic, bgrToLab8, iou } from "@/lib/seg-ops";
import { erode, structuringElement } from "@/lib/morph-ops";
import GC from "@/lib/grabcut-data.json";

type Mode = "grow" | "kmeans" | "meanshift" | "watershed" | "grabcut" | "slic";
const NAMES = ["background", "orange", "red disc", "crimson disc", "green box", "label"];
const SEEDS: [number, number][] = [[225, 15], [55, 55], [120, 50], [165, 65], [60, 125], [205, 112]];
const S = 2;

type Img = { bgr: Uint8Array; ids: Uint8Array; w: number; h: number };
function useScene() {
  const [s, setS] = useState<Img | null>(null);
  useEffect(() => {
    let alive = true;
    const load = (src: string) => new Promise<{ p: Uint8ClampedArray; w: number; h: number }>((res) => {
      const im = new Image();
      im.onload = () => { const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const x = c.getContext("2d")!; x.drawImage(im, 0, 0); res({ p: x.getImageData(0, 0, im.width, im.height).data, w: im.width, h: im.height }); };
      im.src = src;
    });
    Promise.all([load("/images/sample-seg.png"), load("/images/sample-seg-ids.png")]).then(([a, b]) => {
      if (!alive) return;
      const n = a.w * a.h, bgr = new Uint8Array(3 * n), ids = new Uint8Array(n);
      for (let i = 0; i < n; i++) { bgr[3 * i] = a.p[4 * i + 2]; bgr[3 * i + 1] = a.p[4 * i + 1]; bgr[3 * i + 2] = a.p[4 * i]; ids[i] = b.p[4 * i]; }
      setS({ bgr, ids, w: a.w, h: a.h });
    });
    return () => { alive = false; };
  }, []);
  return s;
}

const hue = (k: number): [number, number, number] => { const a = (k * 137.508) % 360, c = 0.7, x = c * (1 - Math.abs(((a / 60) % 2) - 1)), m = 0.22; const [r, g, b] = a < 60 ? [c, x, 0] : a < 120 ? [x, c, 0] : a < 180 ? [0, c, x] : a < 240 ? [0, x, c] : a < 300 ? [x, 0, c] : [c, 0, x]; return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; };

/** Draw an RGB(A) pixel function at scale S, then vector extras. */
function Canvas({ w, h, px, extra, label, onPick }: { w: number; h: number; px: (i: number) => [number, number, number]; extra?: (ctx: CanvasRenderingContext2D) => void; label: string; onPick?: (x: number, y: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const off = document.createElement("canvas"); off.width = w; off.height = h;
    const o = off.getContext("2d")!, im = o.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const [r, g, b] = px(i); im.data[4 * i] = r; im.data[4 * i + 1] = g; im.data[4 * i + 2] = b; im.data[4 * i + 3] = 255; }
    o.putImageData(im, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, w * S, h * S); ctx.drawImage(off, 0, 0, w * S, h * S);
    extra?.(ctx);
  }, [w, h, px, extra]);
  return <canvas ref={ref} width={w * S} height={h * S} className="sg-img" role="img" aria-label={label} style={onPick ? { cursor: "crosshair" } : undefined}
    onClick={(e) => { if (!onPick) return; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); onPick(Math.min(w - 1, Math.floor(((e.clientX - r.left) / r.width) * w)), Math.min(h - 1, Math.floor(((e.clientY - r.top) / r.height) * h))); }} />;
}

const rgbOf = (bgr: ArrayLike<number>) => (i: number): [number, number, number] => [bgr[3 * i + 2], bgr[3 * i + 1], bgr[3 * i]];
/** Region boundaries of a label image in white over the image. */
const withEdges = (s: Img, lab: ArrayLike<number>, base = rgbOf(s.bgr)) => (i: number): [number, number, number] => {
  const x = i % s.w, l = lab[i];
  const edge = (x + 1 < s.w && lab[i + 1] !== l) || (i + s.w < s.w * s.h && lab[i + s.w] !== l) || l < 0;
  return edge ? [255, 255, 255] : base(i);
};

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
const f2 = (v: number) => v.toFixed(2);
/** For every object: the best IoU any single segment reaches. */
function bestIou(s: Img, lab: ArrayLike<number>) {
  const out: number[] = [];
  for (let k = 0; k < 6; k++) {
    const inter = new Map<number, number>(), size = new Map<number, number>(); let g = 0;
    for (let i = 0; i < lab.length; i++) { size.set(lab[i], (size.get(lab[i]) ?? 0) + 1); if (s.ids[i] === k) { g++; inter.set(lab[i], (inter.get(lab[i]) ?? 0) + 1); } }
    let b = 0; inter.forEach((n, l) => { if (l >= 0) b = Math.max(b, n / (g + size.get(l)! - n)); }); out.push(b);
  }
  return out;
}
const IouList = ({ v }: { v: number[] }) => <p className="sg-read">Best IoU per object: {v.map((x, k) => `${NAMES[k]} ${f2(x)}`).join(" · ")}</p>;

/** SegmentLab (Module 27) on sample-seg.png with its object map. mode "grow": flood fill (fixed / floating range) or
 *  running-mean region growing from a clicked seed. "kmeans": colour clustering in BGR, Lab, a*b* or Lab + position.
 *  "meanshift": cv2.pyrMeanShiftFiltering (level 0) then flood-fill regions. "watershed": cv2.watershed from seed
 *  markers or from all gradient minima. "grabcut": precomputed cv2.grabCut cases. "slic": SLIC superpixels. */
export function SegmentLab({ mode = "grow", caption }: { mode?: Mode; caption?: string }) {
  const s = useScene();
  return (
    <figure className="fig segmentlab">
      {!s ? <p className="sg-read">Loading…</p> : mode === "grow" ? <Grow s={s} /> : mode === "kmeans" ? <KMeans s={s} /> : mode === "meanshift" ? <MeanShift s={s} /> : mode === "watershed" ? <Watershed s={s} /> : mode === "grabcut" ? <GrabCut s={s} /> : <Slic s={s} />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Grow({ s }: { s: Img }) {
  const [method, setMethod] = useState<"fixed" | "floating" | "mean">("floating"), [t, setT] = useState(10), [seed, setSeed] = useState<[number, number]>([55, 55]), [conn, setConn] = useState<"4" | "8">("4");
  const mask = useMemo(() => (method === "mean" ? growMean(s.bgr, s.w, s.h, seed[0], seed[1], t) : floodFill(s.bgr, s.w, s.h, seed[0], seed[1], t, t, method === "fixed", conn === "4" ? 4 : 8)), [s, method, t, seed, conn]);
  const k = s.ids[seed[1] * s.w + seed[0]], gt = useMemo(() => Uint8Array.from(s.ids, (v) => (v === k ? 1 : 0)), [s, k]);
  let area = 0; mask.forEach((v) => { area += v; });
  const base = rgbOf(s.bgr);
  const px = useMemo(() => (i: number): [number, number, number] => { const [r, g, b] = base(i); return mask[i] ? [Math.round(r * 0.35 + 255 * 0.65), Math.round(g * 0.35 + 230 * 0.65), Math.round(b * 0.35)] : [r, g, b]; }, [mask, base]);
  const extra = useMemo(() => (ctx: CanvasRenderingContext2D) => { ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc((seed[0] + 0.5) * S, (seed[1] + 0.5) * S, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }, [seed]);
  return (
    <>
      <div className="sc-ctl">
        {seg("Rule", [["fixed", "floodFill fixed range (vs seed)"], ["floating", "floodFill floating range (vs neighbour)"], ["mean", "running mean (Euclidean)"]], method, setMethod)}
        {sl(method === "mean" ? "max distance to region mean" : "loDiff = upDiff (per channel)", t, setT, 1, 60, 1)}
        {method !== "mean" && seg("Connectivity", [["4", "4"], ["8", "8"]], conn, setConn)}
      </div>
      <Canvas w={s.w} h={s.h} px={px} extra={extra} label="region grown from the seed" onPick={(x, y) => setSeed([x, y])} />
      <p className="sg-read">Seed ({seed[0]}, {seed[1]}) on the <b>{NAMES[k]}</b> · region {area} px · true object {gt.reduce((a, v) => a + v, 0)} px · IoU <b>{f2(iou(mask, gt))}</b>. Click the image to move the seed.</p>
    </>
  );
}

function KMeans({ s }: { s: Img }) {
  const [feat, setFeat] = useState<"bgr" | "lab" | "ab" | "labxy">("lab"), [K, setK] = useState(6), [iters, setIters] = useState(10);
  const n = s.w * s.h, lab8 = useMemo(() => bgrToLab8(s.bgr, n), [s, n]);
  const X = useMemo(() => {
    const d = feat === "ab" ? 2 : feat === "labxy" ? 5 : 3, A = new Float64Array(n * d);
    for (let i = 0; i < n; i++) {
      if (feat === "bgr") for (let c = 0; c < 3; c++) A[3 * i + c] = s.bgr[3 * i + c];
      else if (feat === "ab") { A[2 * i] = lab8[3 * i + 1]; A[2 * i + 1] = lab8[3 * i + 2]; }
      else { for (let c = 0; c < 3; c++) A[d * i + c] = lab8[3 * i + c]; if (feat === "labxy") { A[5 * i + 3] = 0.5 * (i % s.w); A[5 * i + 4] = 0.5 * ((i / s.w) | 0); } }
    }
    return { A, d };
  }, [s, feat, lab8, n]);
  const r = useMemo(() => kmeans(X.A, n, X.d, K, iters, 27), [X, n, K, iters]);
  const mean = useMemo(() => { const m = new Float64Array(K * 4); for (let i = 0; i < n; i++) { const k = r.labels[i]; m[4 * k] += s.bgr[3 * i + 2]; m[4 * k + 1] += s.bgr[3 * i + 1]; m[4 * k + 2] += s.bgr[3 * i]; m[4 * k + 3]++; } return m; }, [r, s, K, n]);
  const px = useMemo(() => (i: number): [number, number, number] => { const k = r.labels[i], c = mean[4 * k + 3] || 1; return [mean[4 * k] / c, mean[4 * k + 1] / c, mean[4 * k + 2] / c].map(Math.round) as [number, number, number]; }, [r, mean]);
  const best = useMemo(() => bestIou(s, r.labels), [s, r]);
  return (
    <>
      <div className="sc-ctl">
        {seg("Features", [["bgr", "B, G, R"], ["lab", "L*, a*, b*"], ["ab", "a*, b* only"], ["labxy", "L*a*b* + 0.5·(x, y)"]], feat, setFeat)}
        {sl("K (clusters)", K, setK, 2, 10, 1)}
        {sl("iterations", iters, setIters, 1, 20, 1)}
      </div>
      <div className="sg-grid">
        <figure className="sg-view"><Canvas w={s.w} h={s.h} px={rgbOf(s.bgr)} label="input" /><figcaption>input</figcaption></figure>
        <figure className="sg-view"><Canvas w={s.w} h={s.h} px={px} label="clusters" /><figcaption>each pixel painted with its cluster&apos;s mean colour</figcaption></figure>
      </div>
      <IouList v={best} />
      <p className="sg-read">Compactness (sum of squared distances) after each iteration: {r.history.slice(0, 8).map((v) => (v / 1e6).toFixed(2)).join(" → ")}{r.history.length > 8 ? " → …" : ""} (millions).</p>
    </>
  );
}

function regionsOf(f: Uint8Array, w: number, h: number, tol: number) {
  const lab = new Int32Array(w * h).fill(-1); let n = 0;
  for (let p = 0; p < w * h; p++) {
    if (lab[p] >= 0) continue;
    const m = floodFill(f, w, h, p % w, (p / w) | 0, tol, tol, false, 4);
    for (let i = 0; i < w * h; i++) if (m[i] && lab[i] < 0) lab[i] = n;
    n++;
  }
  return { lab, n };
}
function MeanShift({ s }: { s: Img }) {
  const [sp, setSp] = useState(10), [sr, setSr] = useState(20), [view, setView] = useState<"filtered" | "regions">("filtered");
  const f = useMemo(() => meanShiftFilter(s.bgr, s.w, s.h, sp, sr), [s, sp, sr]);
  const R = useMemo(() => (view === "regions" ? regionsOf(f, s.w, s.h, 4) : null), [f, s, view]);
  const big = useMemo(() => { if (!R) return 0; const c = new Int32Array(R.n); R.lab.forEach((l) => c[l]++); return c.filter((v) => v >= 50).length; }, [R]);
  const best = useMemo(() => (R ? bestIou(s, R.lab) : null), [s, R]);
  return (
    <>
      <div className="sc-ctl">
        {sl("spatial radius sp", sp, setSp, 2, 15, 1, " px")}
        {sl("colour radius sr", sr, setSr, 5, 60, 1)}
        {seg("Show", [["filtered", "filtered image"], ["regions", "regions (flood fill, ±4)"]], view, setView)}
      </div>
      <div className="sg-grid">
        <figure className="sg-view"><Canvas w={s.w} h={s.h} px={rgbOf(s.bgr)} label="input" /><figcaption>input</figcaption></figure>
        <figure className="sg-view"><Canvas w={s.w} h={s.h} px={R ? withEdges(s, R.lab, rgbOf(f)) : rgbOf(f)} label="mean-shift result" /><figcaption>{R ? `${R.n} regions, ${big} of at least 50 px` : "pyrMeanShiftFiltering, maxLevel 0"}</figcaption></figure>
      </div>
      {best ? <IouList v={best} /> : <p className="sg-read">Choose &quot;regions&quot; to group equal colours into regions and score them.</p>}
    </>
  );
}

function Watershed({ s }: { s: Img }) {
  const [on, setOn] = useState([true, true, true, true, true, true]), [src, setSrc] = useState<"seeds" | "minima">("seeds");
  const res = useMemo(() => {
    const n = s.w * s.h, mk = new Int32Array(n);
    if (src === "seeds") {
      SEEDS.forEach(([x, y], k) => { if (!on[k]) return; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) mk[(y + dy) * s.w + x + dx] = k + 1; });
    } else {
      const g = new Uint8Array(n);
      for (let i = 0; i < n; i++) { const x = i % s.w, y = (i / s.w) | 0; let mx = 0, mn = 255; const v = (j: number) => (s.bgr[3 * j] + s.bgr[3 * j + 1] + s.bgr[3 * j + 2]) / 3;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.min(s.w - 1, Math.max(0, x + dx)), yy = Math.min(s.h - 1, Math.max(0, y + dy)), t = v(yy * s.w + xx); mx = Math.max(mx, t); mn = Math.min(mn, t); }
        g[i] = Math.round(mx - mn); }
      const e = erode(g, s.w, s.h, structuringElement("rect", 3, 3));
      let next = 1; const seen = new Int32Array(n);
      for (let i = 0; i < n; i++) if (g[i] === e[i] && !seen[i]) { const st = [i]; seen[i] = next; while (st.length) { const p = st.pop()!; mk[p] = next; const x = p % s.w; for (const q of [p - 1, p + 1, p - s.w, p + s.w]) if (q >= 0 && q < n && Math.abs((q % s.w) - x) <= 1 && !seen[q] && g[q] === e[q]) { seen[q] = next; st.push(q); } } next++; }
    }
    const lab = watershed(s.bgr, s.w, s.h, mk);
    let count = 0; const set = new Set<number>(); lab.forEach((v) => { if (v > 0) set.add(v); }); count = set.size;
    return { lab, count };
  }, [s, on, src]);
  const px = useMemo(() => (i: number): [number, number, number] => { const l = res.lab[i]; if (l < 0) return [255, 255, 255]; const [r, g, b] = rgbOf(s.bgr)(i), [hr, hg, hb] = hue(l); return [Math.round(0.45 * r + 0.55 * hr), Math.round(0.45 * g + 0.55 * hg), Math.round(0.45 * b + 0.55 * hb)]; }, [res, s]);
  const extra = useMemo(() => (ctx: CanvasRenderingContext2D) => { if (src !== "seeds") return; SEEDS.forEach(([x, y], k) => { if (!on[k]) return; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; ctx.beginPath(); ctx.arc((x + 0.5) * S, (y + 0.5) * S, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }); }, [on, src]);
  const objIou = SEEDS.map((_, k) => (on[k] && src === "seeds" ? iou(Int32Array.from(res.lab, (v) => (v === k + 1 ? 1 : 0)), Uint8Array.from(s.ids, (v) => (v === k ? 1 : 0))) : null));
  return (
    <>
      <div className="sc-ctl">
        {seg("Markers", [["seeds", "one seed per object"], ["minima", "every gradient minimum"]], src, setSrc)}
        {src === "seeds" && <div className="ctl ctl-full sg-checks">{NAMES.map((nm, k) => <label key={nm}><input type="checkbox" checked={on[k]} onChange={() => setOn(on.map((v, j) => (j === k ? !v : v)))} /> {nm}</label>)}</div>}
      </div>
      <Canvas w={s.w} h={s.h} px={px} extra={extra} label="watershed regions" />
      <p className="sg-read">{res.count} regions; white = watershed lines (label −1).{src === "seeds" ? " IoU: " + objIou.map((v, k) => (v === null ? null : `${NAMES[k]} ${f2(v)}`)).filter(Boolean).join(" · ") : " Every small dip of the gradient becomes a region: over-segmentation."}</p>
    </>
  );
}

type GcCase = { key: string; label: string; rect: number[]; strokes: number[][]; result: Record<string, { rle: number[]; iou: number; area: number }> };
function GrabCut({ s }: { s: Img }) {
  const cases = (GC as { cases: GcCase[] }).cases;
  const [key, setKey] = useState(cases[0].key), [it, setIt] = useState<"1" | "5">("5");
  const c = cases.find((x) => x.key === key)!, r = c.result[it];
  const mask = useMemo(() => { const m = new Uint8Array(s.w * s.h); let p = 0, v = 0; for (const n of r.rle) { if (v) m.fill(1, p, p + n); p += n; v ^= 1; } return m; }, [r, s]);
  const base = rgbOf(s.bgr);
  const px = useMemo(() => (i: number): [number, number, number] => { const [R, G, B] = base(i); return mask[i] ? [R, G, B] : [Math.round(R * 0.25), Math.round(G * 0.25), Math.round(B * 0.25 + 40)]; }, [mask, base]);
  const extra = useMemo(() => (ctx: CanvasRenderingContext2D) => {
    const [x, y, w, h] = c.rect; ctx.strokeStyle = "#ffd400"; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.strokeRect(x * S, y * S, w * S, h * S); ctx.setLineDash([]);
    for (const [sx, sy, rr, v] of c.strokes) { ctx.strokeStyle = v ? "#3cff7a" : "#ff4d4d"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc((sx + 0.5) * S, (sy + 0.5) * S, rr * S, 0, 2 * Math.PI); ctx.stroke(); }
  }, [c]);
  return (
    <>
      <div className="sc-ctl">
        {seg("Input", cases.map((x) => [x.key, x.label] as [string, string]), key, setKey)}
        {seg("Iterations", [["1", "1"], ["5", "5"]], it, setIt)}
      </div>
      <Canvas w={s.w} h={s.h} px={px} extra={extra} label="GrabCut foreground" />
      <p className="sg-read">Yellow: the rectangle (outside = sure background). Red circle: a sure-background stroke. Foreground {r.area} px, IoU with the target <b>{f2(r.iou)}</b>. Results computed with cv2.grabCut (OpenCV 4.13) by scripts/gen_grabcut_data.py.</p>
    </>
  );
}

function Slic({ s }: { s: Img }) {
  const [size, setSize] = useState(20), [m, setM] = useState(10);
  const n = s.w * s.h, lab8 = useMemo(() => bgrToLab8(s.bgr, n), [s, n]);
  const r = useMemo(() => slic(lab8, s.w, s.h, size, m, 10), [lab8, s, size, m]);
  const asa = useMemo(() => { const cnt = new Map<number, number[]>(); for (let i = 0; i < n; i++) { const a = cnt.get(r.labels[i]) ?? [0, 0, 0, 0, 0, 0]; a[s.ids[i]]++; cnt.set(r.labels[i], a); } let ok = 0; cnt.forEach((a) => { ok += Math.max(...a); }); return ok / n; }, [r, s, n]);
  return (
    <>
      <div className="sc-ctl">
        {sl("region size S", size, setSize, 8, 40, 1, " px")}
        {sl("compactness m", m, setM, 1, 40, 1)}
      </div>
      <Canvas w={s.w} h={s.h} px={withEdges(s, r.labels)} label="SLIC superpixels" />
      <p className="sg-read">{r.n} superpixels. Achievable segmentation accuracy (each superpixel given its majority object): <b>{(asa * 100).toFixed(2)} %</b>. Small m: boundaries follow colour, shapes get irregular; large m: compact, grid-like cells that may cut across edges.</p>
    </>
  );
}
