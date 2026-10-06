"use client";

import { useState } from "react";
import { apply, colSums, rowSums, type M, type Op, type Overflow } from "@/lib/matrix-ops";

const A: M = [[50, 80, 120, 160], [60, 100, 150, 200], [70, 120, 180, 240], [80, 140, 210, 250]];
const B: M = [[0, 0, 255, 255], [0, 0, 255, 255], [30, 30, 30, 30], [30, 30, 30, 30]];

const OPS: { k: Op; label: string; expr: string; note: string }[] = [
  { k: "add", label: "A + B", expr: "A + B", note: "Element by element. Brightening, combining exposures." },
  { k: "sub", label: "A − B", expr: "A − B", note: "Element by element. Change detection, background subtraction. Negative results need a rule." },
  { k: "mul", label: "A × B", expr: "A * B", note: "Element by element (NumPy *). Values explode quickly; usually done in float with B scaled to 0–1." },
  { k: "scale", label: "k · A", expr: "k * A", note: "Every value times k: contrast (k > 1) or dimming (k < 1)." },
  { k: "blend", label: "Blend", expr: "(1 − k)·A + k·B", note: "A weighted mix: cv2.addWeighted. Cross-fades, overlays." },
  { k: "mask", label: "Mask", expr: "A where B > 0", note: "Keep A where the mask B is non-zero, else 0: cv2.bitwise_and with a mask." },
  { k: "T", label: "Aᵀ", expr: "A.T", note: "Transpose: rows become columns (mirror about the diagonal)." },
  { k: "flip", label: "Flip", expr: "np.fliplr(A)", note: "Mirror left-right: cv2.flip(A, 1)." },
  { k: "rot", label: "Rotate 90°", expr: "rot90 clockwise", note: "Transpose, then flip left-right: cv2.rotate(A, cv2.ROTATE_90_CLOCKWISE)." },
  { k: "matmul", label: "A @ B", expr: "A @ B", note: "Matrix product: rows of A times columns of B. Not a pixel operation; used for transforms (5.2)." },
];

function Grid({ title, m, sums }: { title: string; m: M; sums?: boolean }) {
  const rs = rowSums(m), cs = colSums(m);
  return (
    <div className="ml-panel">
      <div className="vis-title">{title}</div>
      <div className="ml-grid" style={{ ["--cols" as string]: m[0].length + (sums ? 1 : 0) }}>
        {m.map((r, i) => [
          ...r.map((v, j) => {
            const g = Math.min(255, Math.max(0, v));
            const out = v < 0 || v > 255;
            return <span key={`${i}-${j}`} className={out ? "ml-cell ml-out" : "ml-cell"} style={{ background: `rgb(${g},${g},${g})`, color: g > 140 ? "#16202b" : "#fff" }}>{Number.isInteger(v) ? v : v.toFixed(1)}</span>;
          }),
          sums ? <span key={`r${i}`} className="ml-sum">{rs[i]}</span> : null,
        ])}
        {sums && cs.map((v, j) => <span key={`c${j}`} className="ml-sum">{v}</span>)}
      </div>
    </div>
  );
}

/** MatrixLab: element-wise and matrix operations on two 4 × 4 "images", with overflow rules and row/column sums. */
export function MatrixLab({ caption }: { caption?: string }) {
  const [oi, setOi] = useState(0);
  const [k, setK] = useState(1.5);
  const [mode, setMode] = useState<Overflow>("saturate");
  const op = OPS[oi];
  const usesK = op.k === "scale" || op.k === "blend";
  const kk = op.k === "blend" ? Math.min(1, k / 3) : k;
  const { raw, out } = apply(op.k, A, B, kk, mode);
  const outside = raw.flat().filter((v) => v < 0 || v > 255).length;
  return (
    <figure className="fig matrixlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Operation</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Operation">
            {OPS.map((o, i) => <button key={o.k} type="button" role="radio" aria-checked={oi === i} className={oi === i ? "is-on" : ""} onClick={() => setOi(i)}>{o.label}</button>)}
          </div>
        </div>
        {usesK && (
          <label className="ctl ctl-wide">
            <span>{op.k === "blend" ? "Weight of B" : "k"} <output>{kk.toFixed(2)}</output></span>
            <input type="range" min={0} max={3} step={0.05} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="k" />
          </label>
        )}
        <div className="ctl ctl-full">
          <span>Results outside 0–255</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Overflow rule">
            {([["saturate", "Clip (cv2.add, cv2.multiply)"], ["wrap", "Wrap (NumPy uint8)"], ["none", "Keep (int or float)"]] as const).map(([m, l]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-on" : ""} onClick={() => setMode(m)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-panels">
        <Grid title="A (image)" m={A} />
        {!["scale", "T", "flip", "rot"].includes(op.k) && <Grid title="B (image or mask)" m={B} />}
        <Grid title={`Result: ${op.expr}`} m={out} sums />
      </div>
      <div className="pg-readout" aria-live="polite">
        <span>{op.note} {outside > 0 ? <strong>{outside} of {raw.flat().length} raw results fall outside 0–255{mode === "none" ? " (kept; red outline)" : mode === "saturate" ? " and were clipped" : " and wrapped around"}.</strong> : null} Last column and row: row and column sums (projections).</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
