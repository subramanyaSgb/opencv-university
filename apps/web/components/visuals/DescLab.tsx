"use client";

import { useEffect, useMemo, useState } from "react";
import { hexBytes, knn2, ratioTest, crossCheck, ransacH, applyH, inv3, warp, cornerError, rng, POSTER_H, type Norm, type Match, type H3 } from "@/lib/desc-ops";
import { useGrays, GrayView, Seg, Slider, Check, type Gray, type Paint } from "./lab-kit";

type Mode = "keypoints" | "brief" | "match" | "homography" | "stitch";
type Det = "SIFT" | "ORB" | "AKAZE";
type KP = [number, number, number, number, number];
type Side = { kp: KP[]; d: Uint8Array[] };
type Data = Record<Det, { poster: Side; "poster-b": Side }> & { pano: { "pano-left": Side; "pano-right": Side } };
const NORM: Record<Det, Norm> = { SIFT: "L2", ORB: "HAMMING", AKAZE: "HAMMING" };
const SRC = ["/images/sample-poster.png", "/images/sample-poster-b.png", "/images/sample-pano-left.png", "/images/sample-pano-right.png"];

function useData() {
  const [d, setD] = useState<Data | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/data/desc-data.json").then((r) => r.json()).then((j) => {
      const conv = (s: { kp: KP[]; d: string[] }): Side => ({ kp: s.kp, d: s.d.map(hexBytes) });
      const out: Record<string, Record<string, Side>> = {};
      for (const k of Object.keys(j)) { out[k] = {}; for (const v of Object.keys(j[k])) out[k][v] = conv(j[k][v]); }
      if (alive) setD(out as unknown as Data);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return d;
}

/** Two grey images side by side (same height assumed) as one image. */
function sideBySide(a: Gray, b: Gray, gap = 6): Gray {
  const w = a.w + gap + b.w, h = Math.max(a.h, b.h), d = new Float64Array(w * h).fill(255);
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) d[y * w + x] = a.d[y * a.w + x];
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) d[y * w + a.w + gap + x] = b.d[y * b.w + x];
  return { d, w, h };
}
const correct = (m: Match, A: Side, B: Side, H: H3, tol = 3) => { const [x, y] = applyH(H, A.kp[m.q][0], A.kp[m.q][1]); return Math.hypot(x - B.kp[m.t][0], y - B.kp[m.t][1]) <= tol; };

/** DescLab (Module 34): keypoints and descriptors precomputed with OpenCV 4.13 (scripts/gen_desc_data.py) on the
 *  poster pair (known homography POSTER_H) and the panorama pair; matching, ratio test, cross-check, RANSAC
 *  homography and stitching computed live. mode "keypoints" | "brief" | "match" | "homography" | "stitch". */
export function DescLab({ mode = "match", detector = "ORB", caption }: { mode?: Mode; detector?: Det; caption?: string }) {
  const g = useGrays(SRC), data = useData();
  const ready = g && data;
  return (
    <figure className="fig desclab lklab">
      {!ready ? <p className="lk-read">Loading…</p>
        : mode === "keypoints" ? <Keypoints g={g} data={data} initial={detector} />
        : mode === "brief" ? <Brief g={g} data={data} />
        : mode === "match" ? <Matching g={g} data={data} initial={detector} />
        : mode === "homography" ? <Homography g={g} data={data} initial={detector} />
        : <Stitch g={g} data={data} />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const detSeg = (v: Det, set: (d: Det) => void) => <Seg label="Detector + descriptor" opts={[["SIFT", "SIFT (128 floats)"], ["ORB", "ORB (256 bits)"], ["AKAZE", "AKAZE (486 bits)"]]} v={v} set={set} />;

function Keypoints({ g, data, initial }: { g: Gray[]; data: Data; initial: Det }) {
  const [det, setDet] = useState<Det>(initial), [view, setView] = useState<"a" | "b">("a"), [sel, setSel] = useState(-1);
  const A = data[det][view === "a" ? "poster" : "poster-b"], O = data[det][view === "a" ? "poster-b" : "poster"], img = g[view === "a" ? 0 : 1];
  const first = useMemo(() => {                                 // default: the largest keypoint whose nearest match is correct
    const Hm = view === "a" ? POSTER_H : inv3(POSTER_H), m = knn2(A.d, O.d, NORM[det]);
    let b = 0; m.forEach((x, i) => { if (correct(x, A, O, Hm) && A.kp[i][2] > A.kp[b][2]) b = i; }); return b;
  }, [A, O, det, view]);
  if (sel < 0) setSel(first);
  const s = Math.max(0, Math.min(sel, A.kp.length - 1)), norm = NORM[det];
  const nn = useMemo(() => knn2([A.d[s]], O.d, norm)[0], [A, O, s, norm]);
  const H = view === "a" ? POSTER_H : inv3(POSTER_H);
  const ok = correct(nn, { kp: [A.kp[s]], d: [] }, O, H);
  const overlay: Paint = (ctx, sc) => {
    ctx.lineWidth = 1;
    A.kp.forEach((k, i) => {
      const r = Math.max(2, (k[2] / 2) * sc * 0.5);
      ctx.strokeStyle = i === s ? "#e0a800" : "rgba(224,80,58,0.75)"; ctx.lineWidth = i === s ? 2.5 : 1;
      ctx.beginPath(); ctx.arc(k[0] * sc, k[1] * sc, r, 0, 2 * Math.PI); ctx.stroke();
      if (k[3] >= 0) { const a = (k[3] * Math.PI) / 180; ctx.beginPath(); ctx.moveTo(k[0] * sc, k[1] * sc); ctx.lineTo(k[0] * sc + r * Math.cos(a), k[1] * sc + r * Math.sin(a)); ctx.stroke(); }
    });
  };
  const pick = (x: number, y: number) => { let b = 0, bd = Infinity; A.kp.forEach((k, i) => { const d = (k[0] - x) ** 2 + (k[1] - y) ** 2; if (d < bd) { bd = d; b = i; } }); setSel(b); };
  const desc = A.d[s];
  return (
    <>
      <div className="sc-ctl">{detSeg(det, (d) => { setDet(d); setSel(-1); })}<Seg label="View" opts={[["a", "poster"], ["b", "poster seen again (rotated 25°, 0.75×, darker)"]]} v={view} set={(v) => { setView(v); setSel(-1); }} /></div>
      <div className="lk-grid">
        <GrayView d={img.d} w={img.w} h={img.h} label={`${A.kp.length} keypoints; circle = scale, line = orientation. Click one.`} onPick={pick} overlay={overlay} />
        <DescView desc={desc} det={det} />
      </div>
      <p className="lk-read">Keypoint {s}: ({A.kp[s][0].toFixed(1)}, {A.kp[s][1].toFixed(1)}), size {A.kp[s][2].toFixed(1)}, angle {A.kp[s][3].toFixed(1)}°.
        {" "}Nearest descriptor in the other view: distance <b>{nn.d.toFixed(det === "SIFT" ? 1 : 0)}</b>, second nearest {nn.d2.toFixed(det === "SIFT" ? 1 : 0)} (ratio {(nn.d / nn.d2).toFixed(2)}) → {ok ? <b>the same physical point ✓</b> : <b>a different point ✗</b>}.</p>
    </>
  );
}

/** SIFT: 4 × 4 cells with 8-bin orientation histograms. Binary: one square per bit. */
function DescView({ desc, det }: { desc: Uint8Array; det: Det }) {
  if (det === "SIFT") {
    const d = new Float64Array(16 * 16), sc = Math.max(1, ...desc);
    return <GrayView d={d} w={16} h={16} scale={14} fixed={[0, 1]} label="SIFT descriptor: 4 × 4 cells, 8 gradient directions each (bar length = value)"
      overlay={(ctx, s) => {
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 16 * s, 16 * s); ctx.strokeStyle = "#999"; ctx.lineWidth = 1;
        for (let c = 0; c < 16; c++) {
          const cx = ((c % 4) * 4 + 2) * s, cy = (Math.floor(c / 4) * 4 + 2) * s; ctx.strokeRect(cx - 2 * s, cy - 2 * s, 4 * s, 4 * s);
          ctx.strokeStyle = "#2f7de1"; ctx.lineWidth = 2;
          for (let o = 0; o < 8; o++) { const v = desc[c * 8 + o] / sc, a = (o * Math.PI) / 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * v * 2 * s, cy - Math.sin(a) * v * 2 * s); ctx.stroke(); }
          ctx.strokeStyle = "#999"; ctx.lineWidth = 1;
        }
      }} />;
  }
  const bits = desc.length * 8, cols = 16, rows = Math.ceil(bits / cols), d = new Float64Array(cols * rows).fill(128);
  for (let i = 0; i < bits; i++) d[i] = (desc[i >> 3] >> (7 - (i & 7))) & 1 ? 255 : 0;
  return <GrayView d={d} w={cols} h={rows} scale={det === "ORB" ? 14 : 8} label={`${det} descriptor: ${desc.length} bytes = ${bits} bits (white = 1)`} />;
}

/** Generic BRIEF on a smoothed 31 × 31 patch with a seeded Gaussian test pattern (illustration; ORB uses a learned pattern). */
function Brief({ g, data }: { g: Gray[]; data: Data }) {
  const kps = useMemo(() => data.ORB.poster.kp.filter((k) => k[0] > 40 && k[1] > 40 && k[0] < 280 && k[1] < 200 && k[4] === 0), [data]);
  const start = useMemo(() => kps.reduce((b, k, i) => ((k[0] - 75) ** 2 + (k[1] - 143) ** 2 < (kps[b][0] - 75) ** 2 + (kps[b][1] - 143) ** 2 ? i : b), 0), [kps]);  // the chapter's example point
  const [n, setN] = useState(16), [sel, setSel] = useState(start), [steer, setSteer] = useState(true);
  const k = kps[Math.min(sel, kps.length - 1)];
  const pattern = useMemo(() => { const r = rng(5), gs = () => { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.max(-15, Math.min(15, (31 / 5) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); }; return Array.from({ length: 256 }, () => [gs(), gs(), gs(), gs()]); }, []);
  const smooth = (im: Gray, x: number, y: number) => { let s = 0, c = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const xx = Math.round(x) + i, yy = Math.round(y) + j; if (xx >= 0 && yy >= 0 && xx < im.w && yy < im.h) { s += im.d[yy * im.w + xx]; c++; } } return s / c; };
  const bitsAt = (im: Gray, x: number, y: number, ang: number, scale: number) => pattern.map(([a, b, c, d]) => {
    const ca = Math.cos(ang) * scale, sa = Math.sin(ang) * scale;
    return smooth(im, x + ca * a - sa * b, y + sa * a + ca * b) < smooth(im, x + ca * c - sa * d, y + sa * c + ca * d) ? 1 : 0;
  });
  const [bx, by] = applyH(POSTER_H, k[0], k[1]), rot = (25 * Math.PI) / 180;
  const bA = bitsAt(g[0], k[0], k[1], 0, 1), bB0 = bitsAt(g[1], bx, by, 0, 1), bB1 = bitsAt(g[1], bx, by, rot, 0.75);
  const other = kps[(Math.min(sel, kps.length - 1) + 7) % kps.length], bO = bitsAt(g[0], other[0], other[1], 0, 1);
  const ham = (p: number[], q: number[]) => p.reduce((s, v, i) => s + (v !== q[i] ? 1 : 0), 0);
  const crop = useMemo(() => { const c = new Float64Array(41 * 41); for (let y = 0; y < 41; y++) for (let x = 0; x < 41; x++) { const xx = Math.round(k[0]) - 20 + x, yy = Math.round(k[1]) - 20 + y; c[y * 41 + x] = g[0].d[Math.min(g[0].h - 1, Math.max(0, yy)) * g[0].w + Math.min(g[0].w - 1, Math.max(0, xx))]; } return c; }, [g, k]);
  return (
    <>
      <div className="sc-ctl">
        <Slider label="keypoint" v={Math.min(sel, kps.length - 1)} set={setSel} min={0} max={kps.length - 1} step={1} />
        <Slider label="tests drawn" v={n} set={setN} min={4} max={64} step={4} />
        <Check label="steer the pattern in view B by the rotation (25°) and scale (0.75)" v={steer} set={setSteer} />
      </div>
      <div className="lk-grid">
        <GrayView d={crop} w={41} h={41} scale={8} label="41 × 41 around the keypoint; each line is one test: bit = 1 if the red end is darker than the blue end"
          overlay={(ctx, s) => {
            ctx.strokeStyle = "#e0a800"; ctx.strokeRect(5 * s, 5 * s, 31 * s, 31 * s);
            pattern.slice(0, n).forEach(([a, b, c, d]) => {
              ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo((20.5 + a) * s, (20.5 + b) * s); ctx.lineTo((20.5 + c) * s, (20.5 + d) * s); ctx.stroke();
              ctx.fillStyle = "#e0503a"; ctx.fillRect((20.5 + a) * s - 3, (20.5 + b) * s - 3, 6, 6); ctx.fillStyle = "#2f7de1"; ctx.fillRect((20.5 + c) * s - 3, (20.5 + d) * s - 3, 6, 6);
            });
          }} />
        <div>
          <p className="lk-read">First {n} bits in view A: <code>{bA.slice(0, n).join("")}</code></p>
          <p className="lk-read">Same point in view B, {steer ? "steered" : "not steered"}: <code>{(steer ? bB1 : bB0).slice(0, n).join("")}</code></p>
          <p className="lk-read">Hamming distance over all 256 bits: same point, not steered <b>{ham(bA, bB0)}</b>; same point, steered <b>{ham(bA, bB1)}</b>; a different keypoint <b>{ham(bA, bO)}</b> (random ≈ 128).</p>
        </div>
      </div>
    </>
  );
}

function useMatches(A: Side, B: Side, norm: Norm, strategy: string, ratio: number) {
  const ab = useMemo(() => knn2(A.d, B.d, norm), [A, B, norm]);
  const ba = useMemo(() => (strategy === "cross" ? knn2(B.d, A.d, norm) : []), [A, B, norm, strategy]);
  return useMemo(() => (strategy === "best" ? ab : strategy === "ratio" ? ratioTest(ab, ratio) : crossCheck(ab, ba)), [ab, ba, strategy, ratio]);
}

const lines = (ms: Match[], A: Side, B: Side, off: number, colour: (m: Match, i: number) => string | null): Paint => (ctx, s) => {
  ms.forEach((m, i) => { const c = colour(m, i); if (!c) return; ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A.kp[m.q][0] * s, A.kp[m.q][1] * s); ctx.lineTo((B.kp[m.t][0] + off) * s, B.kp[m.t][1] * s); ctx.stroke(); });
};

function Matching({ g, data, initial }: { g: Gray[]; data: Data; initial: Det }) {
  const [det, setDet] = useState<Det>(initial), [strategy, setStrategy] = useState<"best" | "ratio" | "cross">("ratio"), [ratio, setRatio] = useState(0.75), [show, setShow] = useState<"all" | "wrong">("all");
  const A = data[det].poster, B = data[det]["poster-b"];
  const ms = useMatches(A, B, NORM[det], strategy, ratio);
  const ok = useMemo(() => ms.map((m) => correct(m, A, B, POSTER_H)), [ms, A, B]);
  const nOk = ok.filter(Boolean).length, both = useMemo(() => sideBySide(g[0], g[1]), [g]);
  return (
    <>
      <div className="sc-ctl">
        {detSeg(det, setDet)}
        <Seg label="Keep" opts={[["best", "every nearest neighbour"], ["ratio", "ratio test"], ["cross", "cross-check"]]} v={strategy} set={setStrategy} />
        {strategy === "ratio" && <Slider label="ratio" v={ratio} set={setRatio} min={0.4} max={1} step={0.05} />}
        <Seg label="Draw" opts={[["all", "all matches"], ["wrong", "wrong ones only"]]} v={show} set={setShow} />
      </div>
      <GrayView d={both.d} w={both.w} h={both.h} label="green = correct (lands within 3 px of the true position), red = wrong" overlay={lines(ms, A, B, g[0].w + 6, (_, i) => (ok[i] ? (show === "all" ? "rgba(40,170,80,0.85)" : null) : "rgba(224,60,40,0.9)"))} />
      <p className="lk-read">{A.kp.length} keypoints in A, {B.kp.length} in B. Kept matches: <b>{ms.length}</b>, correct: <b>{nOk}</b> → precision <b>{ms.length ? ((100 * nOk) / ms.length).toFixed(0) : 0} %</b>.</p>
    </>
  );
}

function Homography({ g, data, initial }: { g: Gray[]; data: Data; initial: Det }) {
  const [det, setDet] = useState<Det>(initial), [thr, setThr] = useState(3), [iters, setIters] = useState(500), [seed, setSeed] = useState(1), [view, setView] = useState<"lines" | "overlay" | "diff">("lines");
  const A = data[det].poster, B = data[det]["poster-b"];
  const ms = useMatches(A, B, NORM[det], "ratio", 0.75);
  const src = ms.map((m) => [A.kp[m.q][0], A.kp[m.q][1]] as [number, number]), dst = ms.map((m) => [B.kp[m.t][0], B.kp[m.t][1]] as [number, number]);
  const r = useMemo(() => ransacH(src, dst, thr, iters, seed), [ms, thr, iters, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const err = r.H ? cornerError(r.H, POSTER_H, 320, 240) : NaN;
  const both = useMemo(() => sideBySide(g[0], g[1]), [g]);
  const warped = useMemo(() => (r.H && view !== "lines" ? warp(g[0].d, g[0].w, g[0].h, r.H, g[1].w, g[1].h) : null), [r.H, view, g]);
  const comp = useMemo(() => {
    if (!warped) return null;
    const b = g[1].d;
    return warped.map((v, i) => (isNaN(v) ? b[i] * 0.5 : view === "overlay" ? 0.5 * (0.7 * v + 30) + 0.5 * b[i] : 128 + (0.7 * v + 30 - b[i]) * 2));
  }, [warped, view, g]);
  return (
    <>
      <div className="sc-ctl">
        {detSeg(det, setDet)}
        <Slider label="RANSAC threshold" v={thr} set={setThr} min={0.5} max={10} step={0.5} unit=" px" />
        <Slider label="iterations" v={iters} set={setIters} min={5} max={2000} step={5} />
        <div><button type="button" className="btn-ghost" onClick={() => setSeed((s) => s + 1)}>new random samples (seed {seed})</button></div>
        <Seg label="Show" opts={[["lines", "inliers / outliers"], ["overlay", "A warped onto B"], ["diff", "difference (A warped − B)"]]} v={view} set={setView} />
      </div>
      {view === "lines" || !comp
        ? <GrayView d={both.d} w={both.w} h={both.h} label="green = RANSAC inlier, red = outlier" overlay={lines(ms, A, B, g[0].w + 6, (_, i) => (r.inliers[i] ? "rgba(40,170,80,0.85)" : "rgba(224,60,40,0.9)"))} />
        : <GrayView d={comp} w={g[1].w} h={g[1].h} label={view === "overlay" ? "50/50 blend: double edges mean misalignment" : "difference ×2 around mid-grey: flat grey = perfect alignment"} />}
      <p className="lk-read">{ms.length} ratio-test matches → <b>{r.count}</b> inliers. Mean corner error against the true homography: <b>{isNaN(err) ? "–" : err.toFixed(2)} px</b>.
        {r.H && <> Estimated H = [{r.H.map((v) => (Math.abs(v) < 0.01 ? v.toExponential(1) : v.toFixed(3))).join(", ")}]</>}</p>
    </>
  );
}

function Stitch({ g, data }: { g: Gray[]; data: Data }) {
  const [blend, setBlend] = useState<"over" | "avg" | "feather">("feather"), [gain, setGain] = useState(true);
  const L = data.pano["pano-left"], R = data.pano["pano-right"], l = g[2], rimg = g[3];
  const ms = useMatches(R, L, "HAMMING", "ratio", 0.75);
  const r = useMemo(() => ransacH(ms.map((m) => [R.kp[m.q][0], R.kp[m.q][1]] as [number, number]), ms.map((m) => [L.kp[m.t][0], L.kp[m.t][1]] as [number, number]), 3, 1000, 1), [ms, R, L]);
  const out = useMemo(() => {
    if (!r.H) return null;
    const H = r.H, corners = [[0, 0], [rimg.w, 0], [rimg.w, rimg.h], [0, rimg.h]].map(([x, y]) => applyH(H, x, y));
    const W = Math.ceil(Math.max(l.w, ...corners.map((c) => c[0]))), Hh = l.h;
    const wr = warp(rimg.d, rimg.w, rimg.h, H, W, Hh);
    let sl = 0, sr = 0, n = 0;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < l.w; x++) { const v = wr[y * W + x]; if (!isNaN(v)) { sl += l.d[y * l.w + x]; sr += v; n++; } }
    const k = gain && sr ? sl / sr : 1, d = new Float64Array(W * Hh);
    const Hi = inv3(H);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const a = x < l.w ? l.d[y * l.w + x] : NaN, b = wr[y * W + x] * k;
      if (isNaN(a)) d[y * W + x] = isNaN(b) ? 255 : b;
      else if (isNaN(b)) d[y * W + x] = a;
      else if (blend === "over") d[y * W + x] = b;
      else if (blend === "avg") d[y * W + x] = (a + b) / 2;
      else {
        const [u, v] = applyH(Hi, x, y), wa = Math.min(x, l.w - 1 - x, y, l.h - 1 - y) + 1, wb = Math.min(u, rimg.w - 1 - u, v, rimg.h - 1 - v) + 1;
        d[y * W + x] = (a * wa + b * wb) / (wa + wb);
      }
    }
    return { d, w: W, h: Hh, k, overlap: n };
  }, [r.H, l, rimg, blend, gain]);
  return (
    <>
      <div className="sc-ctl">
        <Seg label="Blend in the overlap" opts={[["over", "right image on top (hard seam)"], ["avg", "average"], ["feather", "feather (weights fall to the edges)"]]} v={blend} set={setBlend} />
        <Check label="gain compensation (match the mean brightness in the overlap)" v={gain} set={setGain} />
      </div>
      <div className="lk-grid"><GrayView d={l.d} w={l.w} h={l.h} scale={1} label="left view" /><GrayView d={rimg.d} w={rimg.w} h={rimg.h} scale={1} label="right view (darker, slightly warped)" /></div>
      {out && <GrayView d={out.d} w={out.w} h={out.h} scale={1} label={`panorama ${out.w} × ${out.h}`} />}
      <p className="lk-read">ORB matches after ratio test: {ms.length}; RANSAC inliers: <b>{r.count}</b>.{out && <> Overlap {out.overlap.toLocaleString("en")} px; gain applied to the right image: <b>{out.k.toFixed(3)}</b>.</>}</p>
    </>
  );
}
