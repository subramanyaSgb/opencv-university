"use client";

import { useMemo, useState } from "react";
import { harris, minEig, tensor, eig2, localMax, goodFeatures, fast, segmentTest, ssdSurface, repeatability, applyH, CIRCLE, FEAT_H, type Pt } from "@/lib/feature-ops";
import { useGrays, GrayView, dots, rect, both, Seg, Slider, Check, type Gray } from "./lab-kit";

type Mode = "window" | "harris" | "shitomasi" | "fast";
const SRC = ["/images/sample-feat.png", "/images/sample-feat-b.png"];

/** Inverse of a 3 × 3 matrix (row-major). */
function inv3(m: number[]) {
  const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
}
const HINV = inv3(FEAT_H);
/** A point of view B counts if it is 7 px inside view B and maps back 7 px inside view A. */
const insideB = (x: number, y: number) => {
  if (x < 7 || y < 7 || x > 312 || y > 192) return false;
  const [u, v] = applyH(HINV, x, y); return u >= 7 && v >= 7 && u <= 312 && v <= 192;
};

/** FeatureLab (Module 33) on sample-feat.png and its second view sample-feat-b.png (known homography FEAT_H).
 *  mode "window": click a point; SSD of the 9 × 9 window against shifted copies, structure-tensor eigenvalues.
 *  "harris": cv2.cornerHarris response, block size, k, threshold, 3 × 3 non-max. "shitomasi": cv2.goodFeaturesToTrack
 *  (min eigenvalue or Harris), maxCorners, qualityLevel, minDistance. "fast": FAST-9 threshold and non-max, segment
 *  test at a clicked pixel. Detector modes report the repeatability from view A to view B. */
export function FeatureLab({ mode = "harris", caption }: { mode?: Mode; caption?: string }) {
  const g = useGrays(SRC);
  return (
    <figure className="fig featlab lklab">
      {!g ? <p className="lk-read">Loading…</p> : mode === "window" ? <Window a={g[0]} /> : <Detect mode={mode} a={g[0]} b={g[1]} />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const PRESETS: [string, number, number][] = [["flat", 250, 120], ["edge", 55, 20], ["corner", 20, 20], ["disc edge", 92, 140], ["checker", 132, 122]];

function Window({ a }: { a: Gray }) {
  const [p, setP] = useState({ x: 20, y: 20 });
  const S = 5, r = 4;
  const x = Math.max(r + S, Math.min(a.w - r - S - 1, p.x)), y = Math.max(r + S, Math.min(a.h - r - S - 1, p.y));
  const E = useMemo(() => ssdSurface(a.d, a.w, x, y, r, S), [a, x, y]);
  const T = useMemo(() => tensor(a.d, a.w, a.h, 5), [a]);
  const i = y * a.w + x, k = 4 * 5 * 255;                        // undo OpenCV's 8-bit scaling: plain Σ of Sobel products
  const [l1, l2] = eig2(T.A[i] * k * k, T.B[i] * k * k, T.C[i] * k * k);
  const n = 2 * S + 1, minShift = Math.min(...[0, n - 1].flatMap((v) => [0, S, n - 1].map((u) => E[v * n + u])), E[S * n], E[S * n + n - 1]);
  const kind = l1 > 0.1 * l2 && l1 > 50000 ? "corner: both eigenvalues large" : l2 > 50000 ? "edge: one large, one small eigenvalue" : "flat: both small";
  return (
    <>
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Go to</span>
          <div className="seg seg-small">{PRESETS.map(([l, px, py]) => <button key={l} type="button" className={x === px && y === py ? "is-on" : ""} onClick={() => setP({ x: px, y: py })}>{l}</button>)}</div>
        </div>
      </div>
      <div className="lk-grid">
        <GrayView d={a.d} w={a.w} h={a.h} label="click to place the 9 × 9 window" onPick={(px, py) => setP({ x: px, y: py })}
          overlay={rect(x - r, y - r, 2 * r + 1, 2 * r + 1, "#e0a800")} />
        <GrayView d={E} w={n} h={n} scale={20} heat label="SSD E(u, v) for shifts −5 … 5 (centre = no shift; dark = similar)"
          overlay={(ctx, s) => { ctx.strokeStyle = "#2f7de1"; ctx.lineWidth = 2; ctx.strokeRect(S * s, S * s, s, s); }} />
      </div>
      <p className="lk-read">Window at ({x}, {y}). Smallest SSD over the 8 shifts by 5 px: <b>{Math.round(minShift).toLocaleString("en")}</b>.
        Structure tensor (Sobel, 5 × 5 sum) eigenvalues λ₁ = {Math.round(l1).toLocaleString("en")}, λ₂ = {Math.round(l2).toLocaleString("en")} → <b>{kind}</b>.</p>
    </>
  );
}

function Detect({ mode, a, b }: { mode: Exclude<Mode, "window">; a: Gray; b: Gray }) {
  const [view, setView] = useState<"a" | "b">("a");
  const [block, setBlock] = useState(3), [k, setK] = useState(0.04), [q, setQ] = useState(-2), [nms, setNms] = useState(true), [showR, setShowR] = useState(false);
  const [maxC, setMaxC] = useState(0), [md, setMd] = useState(5), [useH, setUseH] = useState(false);
  const [t, setT] = useState(20), [pick, setPick] = useState({ x: 20, y: 20 });
  const quality = 10 ** q;

  const detect = useMemo(() => (im: Gray): { pts: Pt[]; map?: Float64Array } => {
    if (mode === "harris") {
      const R = harris(im.d, im.w, im.h, block, k); let mx = -Infinity; for (const v of R) if (v > mx) mx = v;
      const thr = quality * mx;
      const pts = nms ? localMax(R, im.w, im.h, thr) : Array.from(R, (v, i) => ({ v, i })).filter((o) => o.v > thr).map((o) => ({ x: o.i % im.w, y: Math.floor(o.i / im.w) }));
      return { pts, map: R.map((v) => Math.max(0, v)) };
    }
    if (mode === "shitomasi") return { pts: goodFeatures(im.d, im.w, im.h, { maxCorners: maxC, quality, minDistance: md, useHarris: useH }), map: useH ? harris(im.d, im.w, im.h, 3, 0.04).map((v) => Math.max(0, v)) : minEig(im.d, im.w, im.h, 3) };
    return { pts: fast(im.d, im.w, im.h, t, nms) };
  }, [mode, block, k, quality, nms, maxC, md, useH, t]);

  const A = useMemo(() => detect(a), [detect, a]), B = useMemo(() => detect(b), [detect, b]);
  const rep = useMemo(() => repeatability(A.pts, B.pts, FEAT_H, 2, insideB), [A, B]);
  const cur = view === "a" ? a : b, D = view === "a" ? A : B;
  const many = D.pts.length > 3000;

  const seg = mode === "fast" ? segmentTest(cur.d, cur.w, Math.max(3, Math.min(cur.w - 4, pick.x)), Math.max(3, Math.min(cur.h - 4, pick.y)), t) : 0;
  const px = Math.max(3, Math.min(cur.w - 4, pick.x)), py = Math.max(3, Math.min(cur.h - 4, pick.y)), pv = cur.d[py * cur.w + px];
  const zoom = useMemo(() => { const z = new Float64Array(49); for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) z[(j + 3) * 7 + i + 3] = cur.d[(py + j) * cur.w + px + i]; return z; }, [cur, px, py]);

  return (
    <>
      <div className="sc-ctl">
        <Seg label="View" opts={[["a", "view A"], ["b", "view B (rotated, scaled, darker)"]]} v={view} set={setView} />
        {mode === "harris" && <>
          <Seg label="blockSize" opts={[["2", "2"], ["3", "3"], ["5", "5"], ["7", "7"]]} v={String(block)} set={(s) => setBlock(Number(s))} />
          <Slider label="k" v={k} set={setK} min={0.02} max={0.2} step={0.01} />
        </>}
        {mode === "shitomasi" && <>
          <Seg label="Score" opts={[["min", "min eigenvalue (Shi–Tomasi)"], ["harris", "Harris (k 0.04)"]]} v={useH ? "harris" : "min"} set={(s) => setUseH(s === "harris")} />
          <Slider label="maxCorners (0 = all)" v={maxC} set={setMaxC} min={0} max={100} step={5} />
          <Slider label="minDistance" v={md} set={setMd} min={1} max={30} step={1} unit=" px" />
        </>}
        {mode !== "fast" ? <Slider label={mode === "harris" ? "threshold (fraction of max R)" : "qualityLevel"} v={q} set={setQ} min={-4} max={-0.5} step={0.25} show={quality < 0.01 ? quality.toPrecision(2) : quality.toFixed(3)} />
          : <Slider label="threshold t" v={t} set={setT} min={5} max={80} step={1} />}
        <div>{mode !== "shitomasi" && <Check label="non-max suppression" v={nms} set={setNms} />}{D.map && <Check label="show score map" v={showR} set={setShowR} />}</div>
      </div>
      <div className="lk-grid">
        <GrayView d={showR && D.map ? D.map : cur.d} heat={showR && !!D.map} w={cur.w} h={cur.h}
          label={mode === "fast" ? "click a pixel to see its segment test" : `${D.pts.length} points`}
          onPick={mode === "fast" ? (x, y) => setPick({ x, y }) : undefined}
          overlay={both(!many && dots(D.pts, "#e0503a", mode === "harris" && !nms ? 1 : 3), mode === "fast" && rect(px - 3, py - 3, 7, 7, "#2f7de1", 1.5))} />
        {mode === "fast" && <GrayView d={zoom} w={7} h={7} scale={28} label={`p = ${pv}; circle pixels: red > p + t, blue < p − t → ${seg ? (seg > 0 ? "corner (bright arc)" : "corner (dark arc)") : "not a corner"}`}
          overlay={(ctx, s) => {
            CIRCLE.forEach(([dx, dy], i) => {
              const v = zoom[(dy + 3) * 7 + dx + 3]; ctx.lineWidth = 3;
              ctx.strokeStyle = v > pv + t ? "#e0503a" : v < pv - t ? "#2f7de1" : "#999";
              ctx.strokeRect((dx + 3) * s + 2, (dy + 3) * s + 2, s - 4, s - 4);
              ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.fillText(String(i + 1), (dx + 3) * s + 4, (dy + 3) * s + 13);
            });
            ctx.strokeStyle = "#e0a800"; ctx.strokeRect(3 * s, 3 * s, s, s);
          }} />}
      </div>
      <p className="lk-read">View A: <b>{A.pts.length}</b> points · view B: <b>{B.pts.length}</b> points.
        {" "}Repeatability A → B (within 2 px, after mapping with the known homography): <b>{rep.hit} / {rep.n}</b> = <b>{(100 * rep.rate).toFixed(0)} %</b>.
        {many && " (Too many points to draw: raise the threshold.)"}</p>
    </>
  );
}
