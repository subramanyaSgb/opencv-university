"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { inkFor, moveSelection } from "@/lib/pixel-ops";
import { normRegion, rectPoints, regionMean, regionShape, sliceExpr, type Region } from "@/lib/grid-ops";

export interface IndexExplorerProps {
  /** Grayscale values 0..255. Omit to use a built-in 8 × 10 test pattern. */
  values?: number[][];
  /** Start in "pixel" (one pixel) or "region" (ROI) mode. */
  mode?: "pixel" | "region";
  caption?: string;
}

/** 8 rows × 10 columns: dark background, a bright block, a mid-gray bar. */
const PATTERN: number[][] = Array.from({ length: 8 }, (_, r) =>
  Array.from({ length: 10 }, (_, c) => {
    if (r >= 2 && r <= 4 && c >= 5 && c <= 8) return 230 - (r - 2) * 10 - (c - 5) * 5;
    if (r === 6 && c >= 1 && c <= 3) return 140;
    return 20 + ((r * 7 + c * 3) % 5) * 6;
  }),
);

/**
 * IndexExplorer: tap a pixel to see image[row, column], the matching (x, y), and the OpenCV point.
 * In region mode, tap two corners to get the NumPy slice, its shape, and the cv2.rectangle points.
 */
export function IndexExplorer({ values = PATTERN, mode: initialMode = "pixel", caption }: IndexExplorerProps) {
  const id = useId();
  const rows = values.length;
  const cols = values[0].length;
  const [mode, setMode] = useState(initialMode);
  const [sel, setSel] = useState<[number, number]>(initialMode === "pixel" ? [2, 6] : [0, 0]);
  const [anchor, setAnchor] = useState<[number, number] | null>(null);
  const [region, setRegion] = useState<Region | null>(initialMode === "region" ? { r0: 2, r1: 4, c0: 5, c1: 8 } : null);
  const [r, c] = sel;

  const pick = (rr: number, cc: number) => {
    setSel([rr, cc]);
    if (mode === "region") {
      if (!anchor) {
        setAnchor([rr, cc]);
        setRegion(normRegion([rr, cc], [rr, cc]));
      } else {
        setRegion(normRegion(anchor, [rr, cc]));
        setAnchor(null);
      }
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (mode !== "pixel") return;
    const next = moveSelection(sel, e.key, rows, cols);
    if (next !== sel) {
      e.preventDefault();
      setSel(next);
      document.getElementById(`${id}-${next[0]}-${next[1]}`)?.focus();
    }
  };

  const inRegion = (rr: number, cc: number) =>
    !!region && rr >= region.r0 && rr <= region.r1 && cc >= region.c0 && cc <= region.c1;

  return (
    <figure className="fig iex">
      <div className="fig-controls">
        <div className="seg" role="radiogroup" aria-label="Mode">
          {(["pixel", "region"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={mode === m ? "is-on" : ""}
              onClick={() => {
                setMode(m);
                setAnchor(null);
                if (m === "region" && !region) setRegion({ r0: 2, r1: 4, c0: 5, c1: 8 });
              }}
            >
              {m === "pixel" ? "Pick a pixel" : "Select a region (ROI)"}
            </button>
          ))}
        </div>
        {mode === "region" && (
          <span className="iex-hint">{anchor ? "Now tap the opposite corner." : "Tap one corner, then the opposite corner."}</span>
        )}
      </div>

      <div className="iex-axes" aria-hidden="true">
        <span>columns: x →</span>
        <span>rows: y ↓</span>
      </div>
      <div className="iex-frame" style={{ ["--cols" as string]: cols }}>
        <span className="iex-corner" aria-hidden="true" />
        <div className="iex-collabels" aria-hidden="true">
          {Array.from({ length: cols }, (_, cc) => (
            <span key={cc} className={(mode === "pixel" && cc === c) || (mode === "region" && region && cc >= region.c0 && cc <= region.c1) ? "is-on" : ""}>{cc}</span>
          ))}
        </div>
        <div className="iex-rowlabels" aria-hidden="true">
          {Array.from({ length: rows }, (_, rr) => (
            <span key={rr} className={(mode === "pixel" && rr === r) || (mode === "region" && region && rr >= region.r0 && rr <= region.r1) ? "is-on" : ""}>{rr}</span>
          ))}
        </div>
        <div className="iex-grid" role="grid" aria-label="Image pixels" onKeyDown={onKey}>
          {values.map((row, rr) =>
            row.map((v, cc) => {
              const isSel = mode === "pixel" && rr === r && cc === c;
              const isReg = mode === "region" && inRegion(rr, cc);
              const isAnchor = mode === "region" && anchor && anchor[0] === rr && anchor[1] === cc;
              return (
                <button
                  key={`${rr}-${cc}`}
                  id={`${id}-${rr}-${cc}`}
                  type="button"
                  role="gridcell"
                  className={`iex-cell${isSel ? " is-sel" : ""}${isReg ? " is-reg" : ""}${isAnchor ? " is-anchor" : ""}`}
                  style={{ background: `rgb(${v},${v},${v})`, color: inkFor(v) }}
                  aria-label={`row ${rr}, column ${cc}, value ${v}`}
                  tabIndex={isSel || (mode === "region" && rr === 0 && cc === 0) ? 0 : -1}
                  onClick={() => pick(rr, cc)}
                >
                  {v}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="iex-read" aria-live="polite">
        {mode === "pixel" ? (
          <>
            <div className="iex-line">
              <span className="iex-k">NumPy</span>
              <code>image[{r}, {c}]</code> = <strong>{values[r][c]}</strong>
            </div>
            <div className="iex-line">
              <span className="iex-k">Meaning</span>
              row {r}, column {c} &nbsp;·&nbsp; y = {r}, x = {c}
            </div>
            <div className="iex-line">
              <span className="iex-k">OpenCV point</span>
              <code>(x, y) = ({c}, {r})</code>
            </div>
          </>
        ) : region ? (
          <>
            <div className="iex-line">
              <span className="iex-k">NumPy slice</span>
              <code>{sliceExpr(region)}</code>
            </div>
            <div className="iex-line">
              <span className="iex-k">ROI shape</span>
              <code>({regionShape(region).join(", ")})</code> &nbsp;·&nbsp; {regionShape(region)[0] * regionShape(region)[1]} of {rows * cols} pixels &nbsp;·&nbsp; mean {regionMean(values, region).toFixed(1)}
            </div>
            <div className="iex-line">
              <span className="iex-k">cv2.rectangle</span>
              <code>
                ({rectPoints(region)[0].join(", ")}), ({rectPoints(region)[1].join(", ")})
              </code>
            </div>
          </>
        ) : null}
      </div>
      <figcaption>
        {caption ?? "Image size: " + cols + " × " + rows + " (width × height), so image.shape is (" + rows + ", " + cols + ")."}
      </figcaption>
    </figure>
  );
}
