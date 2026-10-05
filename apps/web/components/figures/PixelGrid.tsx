"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import {
  DEFAULT_PARAMS,
  OP_LABELS,
  applyPointOp,
  countAbove,
  explainPointOp,
  formulaFor,
  gridStats,
  inkFor,
  mapGrid,
  moveSelection,
  setPixel,
  validateGrid,
  type Arithmetic,
  type Grid,
  type OpParams,
  type PointOp,
} from "@/lib/pixel-ops";

export interface PixelGridProps {
  /** 8-bit grayscale values, rows of equal length, integers 0..255. */
  values: Grid;
  /** Operations the learner can apply. Omit to show the input grid only. */
  operations?: PointOp[];
  /** Let the learner edit pixel values (default true). */
  editable?: boolean;
  /** Starting parameters (brighten amount, threshold, arithmetic). */
  params?: Partial<OpParams>;
  /** Show the saturate / wrap switch for "brighten" (default true). */
  showArithmetic?: boolean;
  caption?: string;
}

/**
 * PixelGrid: a tiny grayscale image as a grid of numbers.
 * Click or tap a pixel to select it, edit its value, and see the output pixel change.
 */
export function PixelGrid({
  values,
  operations = [],
  editable = true,
  params: initialParams,
  showArithmetic = true,
  caption,
}: PixelGridProps) {
  validateGrid(values);
  const id = useId();
  const rows = values.length;
  const cols = values[0].length;

  const [grid, setGrid] = useState<Grid>(values);
  const [sel, setSel] = useState<[number, number]>([0, 0]);
  const [op, setOp] = useState<PointOp | null>(operations[0] ?? null);
  const [params, setParams] = useState<OpParams>({ ...DEFAULT_PARAMS, ...initialParams });

  const output = useMemo(
    () => (op ? mapGrid(grid, (v) => applyPointOp(op, v, params)) : null),
    [grid, op, params],
  );
  const [sr, sc] = sel;
  const selected = grid[sr][sc];
  const inStats = gridStats(grid);

  const onKey = (e: KeyboardEvent) => {
    const next = moveSelection(sel, e.key, rows, cols);
    if (next !== sel) {
      e.preventDefault();
      setSel(next);
      document.getElementById(`${id}-in-${next[0]}-${next[1]}`)?.focus();
    }
  };

  const renderGrid = (g: Grid, which: "in" | "out") => (
    <div
      className="pg-grid"
      role="grid"
      aria-label={which === "in" ? "Input pixels" : "Output pixels"}
      style={{ ["--cols" as string]: cols }}
      onKeyDown={which === "in" ? onKey : undefined}
    >
      {g.map((row, r) =>
        row.map((v, c) => {
          const isSel = r === sr && c === sc;
          const style = { background: `rgb(${v},${v},${v})`, color: inkFor(v) };
          const label = `row ${r}, column ${c}, value ${v}`;
          return which === "in" ? (
            <button
              key={`${r}-${c}`}
              id={`${id}-in-${r}-${c}`}
              type="button"
              role="gridcell"
              className={`pg-cell${isSel ? " is-selected" : ""}`}
              style={style}
              aria-label={label}
              aria-selected={isSel}
              tabIndex={isSel ? 0 : -1}
              onClick={() => setSel([r, c])}
            >
              {v}
            </button>
          ) : (
            <div
              key={`${r}-${c}`}
              role="gridcell"
              className={`pg-cell${isSel ? " is-selected" : ""}`}
              style={style}
              aria-label={label}
            >
              {v}
            </div>
          );
        }),
      )}
    </div>
  );

  return (
    <figure className="fig pixel-grid">
      {operations.length > 0 && (
        <div className="fig-controls">
          {operations.length > 1 && (
            <div className="seg" role="radiogroup" aria-label="Operation">
              {operations.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={op === o}
                  className={op === o ? "is-on" : ""}
                  onClick={() => setOp(o)}
                >
                  {OP_LABELS[o]}
                </button>
              ))}
            </div>
          )}
          {op === "brighten" && (
            <>
              <label className="ctl">
                <span>
                  Add <output>{params.amount}</output>
                </span>
                <input
                  type="range"
                  min={-100}
                  max={150}
                  value={params.amount}
                  onChange={(e) => setParams({ ...params, amount: Number(e.target.value) })}
                />
              </label>
              {showArithmetic && (
                <div className="seg seg-small" role="radiogroup" aria-label="8-bit arithmetic">
                  {(["saturate", "wrap"] as Arithmetic[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={params.arithmetic === a}
                      className={params.arithmetic === a ? "is-on" : ""}
                      onClick={() => setParams({ ...params, arithmetic: a })}
                    >
                      {a === "saturate" ? "cv2.add (clips)" : "NumPy + (wraps)"}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {op === "multiply" && (
            <label className="ctl">
              <span>
                Factor <output>{params.factor.toFixed(1)}</output>
              </span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={params.factor}
                onChange={(e) => setParams({ ...params, factor: Number(e.target.value) })}
              />
            </label>
          )}
          {op === "threshold" && (
            <label className="ctl">
              <span>
                Threshold <output>{params.threshold}</output>
              </span>
              <input
                type="range"
                min={0}
                max={255}
                value={params.threshold}
                onChange={(e) => setParams({ ...params, threshold: Number(e.target.value) })}
              />
            </label>
          )}
        </div>
      )}

      <div className={`pg-panels${output ? " has-output" : ""}`}>
        <div className="pg-panel">
          <div className="pg-title">Input</div>
          {renderGrid(grid, "in")}
        </div>
        {output && op && (
          <>
            <div className="pg-arrow" aria-hidden="true">
              <span className="pg-formula">{formulaFor(op, params)}</span>
              <span className="pg-arrow-glyph">→</span>
            </div>
            <div className="pg-panel">
              <div className="pg-title">Output</div>
              {renderGrid(output, "out")}
            </div>
          </>
        )}
      </div>

      <div className="pg-readout" aria-live="polite">
        <span>
          Selected pixel <code>[{sr}, {sc}]</code> (row {sr}, column {sc}) = <strong>{selected}</strong>
        </span>
        {op && (
          <span>
            {OP_LABELS[op]}: <strong>{explainPointOp(op, selected, params)}</strong>
          </span>
        )}
      </div>

      {editable && (
        <div className="fig-controls">
          <label className="ctl ctl-wide">
            <span>
              Edit pixel [{sr}, {sc}]
            </span>
            <input
              type="range"
              min={0}
              max={255}
              value={selected}
              aria-label={`Value of pixel row ${sr} column ${sc}`}
              onChange={(e) => setGrid(setPixel(grid, sr, sc, Number(e.target.value)))}
            />
            <input
              type="number"
              min={0}
              max={255}
              value={selected}
              className="num"
              aria-label={`Exact value of pixel row ${sr} column ${sc}`}
              onChange={(e) => setGrid(setPixel(grid, sr, sc, Number(e.target.value)))}
            />
          </label>
          <button type="button" className="btn-ghost" onClick={() => setGrid(values)}>
            Reset
          </button>
        </div>
      )}

      <div className="pg-stats">
        Input mean <strong>{inStats.mean.toFixed(1)}</strong>, min {inStats.min}, max {inStats.max}
        {output && op && (
          <>
            {" · "}Output mean <strong>{gridStats(output).mean.toFixed(1)}</strong>
          </>
        )}
        {op === "threshold" && (
          <>
            {" · "}Bright pixels (p &gt; {params.threshold}):{" "}
            <strong>
              {countAbove(grid, params.threshold)} of {inStats.count}
            </strong>
          </>
        )}
      </div>

      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
