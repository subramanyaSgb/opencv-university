"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { label, stats } from "@/lib/label-ops";
import { histogram, otsu } from "@/lib/thresh-ops";
import { morph, erode, dilate, structuringElement, distanceTransform } from "@/lib/morph-ops";

type Mode = "label" | "count";
const SRC: Record<string, string> = { morph: "/images/sample-morph.png", particles: "/images/sample-particles.png" };
const TRUE_COUNT = 40;

function useGray(src: string) {
  const [g, setG] = useState<{ d: Uint8Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Uint8Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

const hue = (k: number): [number, number, number] => { const a = (k * 137.508) % 360, c = 0.75, x = c * (1 - Math.abs(((a / 60) % 2) - 1)), m = 0.2; const [r, g, b] = a < 60 ? [c, x, 0] : a < 120 ? [x, c, 0] : a < 180 ? [0, c, x] : a < 240 ? [0, x, c] : a < 300 ? [x, 0, c] : [c, 0, x]; return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; };

function LabelCanvas({ labels, w, h, label: aria, onPick, marks }: { labels: Int32Array; w: number; h: number; label: string; onPick?: (l: number) => void; marks?: [number, number][] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const l = labels[i]; im.data.set(l ? [...hue(l), 255] : [0, 0, 0, 255], 4 * i); }
    ctx.putImageData(im, 0, 0);
    if (marks) { ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; for (const [x, y] of marks) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); } }
  }, [labels, w, h, marks]);
  return (
    <canvas ref={ref} width={w} height={h} className="lb-img" role="img" aria-label={aria}
      onClick={(e) => { if (!onPick) return; const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); const x = Math.floor(((e.clientX - r.left) / r.width) * w), y = Math.floor(((e.clientY - r.top) / r.height) * h); onPick(labels[y * w + x]); }} />
  );
}

function GreyCanvas({ d, w, h }: { d: Uint8Array; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h); for (let i = 0; i < w * h; i++) im.data.set([d[i], d[i], d[i], 255], 4 * i); ctx.putImageData(im, 0, 0);
  }, [d, w, h]);
  return <canvas ref={ref} width={w} height={h} className="lb-img" role="img" aria-label="input image" />;
}

/** LabelLab (Module 25). mode "label": connected components of the morphology mask or the particle mask with 4/8 connectivity, area filter, click a component for its statistics. mode "count": counting touching particles by plain labelling, erosion, or distance-transform peaks. */
export function LabelLab({ mode = "label", initialSource = "morph", caption }: { mode?: Mode; initialSource?: "morph" | "particles"; caption?: string }) {
  const [src, setSrc] = useState(mode === "count" ? "particles" : initialSource);
  const g = useGray(SRC[src]);
  const [conn, setConn] = useState<4 | 8>(8), [minArea, setMinArea] = useState(0), [pick, setPick] = useState(0);
  const [method, setMethod] = useState<"plain" | "erode" | "peaks">("peaks"), [r, setR] = useState(4), [win, setWin] = useState(9);

  const mask = useMemo(() => {
    if (!g) return null;
    if (src === "morph") return g.d;
    const t = otsu(histogram(g.d));
    const m = Uint8Array.from(g.d, (v) => (v > t ? 255 : 0));
    return morph(m, g.w, g.h, "open", structuringElement("rect", 3, 3));
  }, [g, src]);

  const res = useMemo(() => {
    if (!g || !mask) return null;
    const { w, h } = g;
    if (mode === "label") {
      const { labels, n } = label(mask, w, h, conn), st = stats(labels, n, w, h);
      const keep = st.map((s, i) => i > 0 && s.area >= minArea);
      const shown = Int32Array.from(labels, (l) => (keep[l] ? l : 0));
      return { labels: shown, st, count: keep.filter(Boolean).length };
    }
    if (method === "plain") { const { labels, n } = label(mask, w, h, 8); return { labels, count: n - 1, marks: undefined as [number, number][] | undefined }; }
    if (method === "erode") { const e = erode(mask, w, h, structuringElement("ellipse", 2 * r + 1, 2 * r + 1)); const { labels, n } = label(e, w, h, 8); return { labels, count: n - 1, marks: undefined }; }
    const D = distanceTransform(mask, w, h, "l2"), Dm = Uint8Array.from(D, (v) => Math.min(255, Math.round(v * 8)));
    const Dd = dilate(Dm, w, h, structuringElement("rect", win, win));
    const peaks = Uint8Array.from(Dm, (v, i) => (v > 32 && v === Dd[i] ? 255 : 0)); // distance > 4 px and a local maximum
    const { labels: pl, n: pn } = label(peaks, w, h, 8), pst = stats(pl, pn, w, h);
    const marks = pst.slice(1).map((s) => [s.cx, s.cy] as [number, number]);
    const { labels } = label(mask, w, h, 8);
    return { labels, count: pn - 1, marks };
  }, [g, mask, mode, conn, minArea, method, r, win]);

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
  const sel = res && "st" in res && res.st && pick > 0 && pick < res.st.length ? res.st[pick] : null;

  return (
    <figure className="fig labellab">
      <div className="sc-ctl">
        {mode === "label" && <>
          {seg("Image", [["morph", "test mask"], ["particles", "particles (Otsu + 3 × 3 opening)"]], src as "morph" | "particles", (k) => { setSrc(k); setPick(0); })}
          {seg("Connectivity", [["8", "8-connected"], ["4", "4-connected"]], String(conn) as "4" | "8", (k) => setConn(k === "4" ? 4 : 8))}
          {sl("minimum area (px)", minArea, setMinArea, 0, 200, 1)}
        </>}
        {mode === "count" && <>
          {seg("Method", [["plain", "label the mask"], ["erode", "erode, then label"], ["peaks", "distance-transform peaks"]], method, setMethod)}
          {method === "erode" && sl("erosion radius (px)", r, setR, 1, 9, 1)}
          {method === "peaks" && sl("peak window (px)", win, setWin, 3, 21, 2)}
        </>}
      </div>
      {g && res && (
        <div className="lb-grid">
          <figure className="lb-view"><GreyCanvas d={g.d} w={g.w} h={g.h} /><figcaption>input</figcaption></figure>
          <figure className="lb-view">
            <LabelCanvas labels={res.labels} w={g.w} h={g.h} label="labels" onPick={mode === "label" ? setPick : undefined} marks={"marks" in res ? res.marks : undefined} />
            <figcaption>{mode === "label" ? `${res.count} components (each colour one label)${minArea ? ` with area ≥ ${minArea}` : ""} · click one` : `count: ${res.count} (true: ${TRUE_COUNT})${method === "peaks" ? " · white dots = peaks" : ""}`}</figcaption>
          </figure>
        </div>
      )}
      {sel && (
        <p className="lb-read">Label {pick}: area {sel.area} px · box x {sel.x}, y {sel.y}, {sel.w} × {sel.h} · centroid ({sel.cx.toFixed(1)}, {sel.cy.toFixed(1)}) · fill {(sel.area / (sel.w * sel.h)).toFixed(2)}</p>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
