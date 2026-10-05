// Pure pixel logic for the figure components. No React, no DOM: unit-tested in pixel-ops.test.ts.
// Semantics follow OpenCV 4.13.0 on 8-bit (uint8) images.

export type PointOp = "invert" | "brighten" | "multiply" | "threshold";

/** How 8-bit addition handles results outside 0..255. */
export type Arithmetic = "saturate" | "wrap";

export interface OpParams {
  /** Value added by "brighten" (may be negative). */
  amount: number;
  /** Threshold for "threshold" (OpenCV THRESH_BINARY: out = 255 if p > t else 0). */
  threshold: number;
  /** "saturate" = cv2.add (clip to 0..255); "wrap" = NumPy uint8 `+` (modulo 256). */
  arithmetic: Arithmetic;
  /** Factor for "multiply" (cv2.multiply: round half to even, then clip to 0..255). */
  factor: number;
}

export const DEFAULT_PARAMS: OpParams = { amount: 50, threshold: 128, arithmetic: "saturate", factor: 0.5 };

export const OP_LABELS: Record<PointOp, string> = {
  invert: "Invert",
  brighten: "Brighten",
  multiply: "Multiply",
  threshold: "Threshold",
};

/** Saturate to the uint8 range, like OpenCV's saturate_cast<uchar>. */
export function clampU8(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}

/** Round half to even, like OpenCV's cvRound (2.5 -> 2, 3.5 -> 4). */
export function roundHalfEven(v: number): number {
  const f = Math.floor(v);
  const diff = v - f;
  if (Math.abs(diff - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(v);
}

/** Wrap to the uint8 range, like NumPy uint8 arithmetic (modulo 256). */
export function wrapU8(v: number): number {
  return ((Math.round(v) % 256) + 256) % 256;
}

export function applyPointOp(op: PointOp, p: number, params: OpParams = DEFAULT_PARAMS): number {
  switch (op) {
    case "invert":
      return 255 - p;
    case "brighten": {
      const raw = p + params.amount;
      return params.arithmetic === "wrap" ? wrapU8(raw) : clampU8(raw);
    }
    case "multiply":
      return Math.min(255, Math.max(0, roundHalfEven(p * params.factor)));
    case "threshold":
      return p > params.threshold ? 255 : 0;
  }
}

/** "0.5" not "0.50000001" */
function fmtNum(v: number): string {
  return String(Math.round(v * 1000) / 1000);
}

/** The calculation for one pixel, with real numbers: "255 − 230 = 25". */
export function explainPointOp(op: PointOp, p: number, params: OpParams = DEFAULT_PARAMS): string {
  const out = applyPointOp(op, p, params);
  switch (op) {
    case "invert":
      return `255 − ${p} = ${out}`;
    case "brighten": {
      const raw = p + params.amount;
      const sign = params.amount < 0 ? "−" : "+";
      const sum = `${p} ${sign} ${Math.abs(params.amount)} = ${raw}`;
      if (raw === out) return sum;
      return params.arithmetic === "wrap"
        ? `${sum} → wraps around to ${out}`
        : `${sum} → clipped to ${out}`;
    }
    case "multiply": {
      const raw = p * params.factor;
      const sum = `${p} × ${fmtNum(params.factor)} = ${fmtNum(raw)}`;
      return Number.isInteger(raw) && raw === out ? sum : `${sum} → ${out}`;
    }
    case "threshold":
      return p > params.threshold
        ? `${p} > ${params.threshold} → ${out}`
        : `${p} ≤ ${params.threshold} → ${out}`;
  }
}

/** The rule applied to every pixel p, as shown between the two grids. */
export function formulaFor(op: PointOp, params: OpParams = DEFAULT_PARAMS): string {
  switch (op) {
    case "invert":
      return "out = 255 − p";
    case "brighten": {
      const sign = params.amount < 0 ? "−" : "+";
      const rule = params.arithmetic === "wrap" ? "wraps (NumPy uint8)" : "clipped to 0..255 (cv2.add)";
      return `out = p ${sign} ${Math.abs(params.amount)}, ${rule}`;
    }
    case "multiply":
      return `out = p × ${fmtNum(params.factor)}, rounded, clipped (cv2.multiply)`;
    case "threshold":
      return `out = 255 if p > ${params.threshold}, else 0`;
  }
}

export type Grid = number[][];

/** Throws if the grid is empty, ragged, or has values outside 0..255 integers. */
export function validateGrid(values: Grid): void {
  if (!values.length || !values[0].length) throw new Error("PixelGrid: values must not be empty");
  const cols = values[0].length;
  values.forEach((row, r) => {
    if (row.length !== cols) throw new Error(`PixelGrid: row ${r} has ${row.length} values, expected ${cols}`);
    row.forEach((v, c) => {
      if (!Number.isInteger(v) || v < 0 || v > 255) {
        throw new Error(`PixelGrid: value at row ${r}, col ${c} must be an integer 0..255 (got ${v})`);
      }
    });
  });
}

export function mapGrid(grid: Grid, fn: (v: number, r: number, c: number) => number): Grid {
  return grid.map((row, r) => row.map((v, c) => fn(v, r, c)));
}

export function setPixel(grid: Grid, r: number, c: number, v: number): Grid {
  return mapGrid(grid, (old, rr, cc) => (rr === r && cc === c ? clampU8(v) : old));
}

export interface GridStats {
  mean: number;
  min: number;
  max: number;
  count: number;
}

export function gridStats(grid: Grid): GridStats {
  const flat = grid.flat();
  const sum = flat.reduce((a, b) => a + b, 0);
  return { mean: sum / flat.length, min: Math.min(...flat), max: Math.max(...flat), count: flat.length };
}

/** Number of pixels strictly greater than t (same test as THRESH_BINARY). */
export function countAbove(grid: Grid, t: number): number {
  return grid.flat().filter((v) => v > t).length;
}

/** Text colour that stays readable on a gray cell of value v. */
export function inkFor(v: number): "#000" | "#fff" {
  return v >= 128 ? "#000" : "#fff";
}

/** Move a selection with arrow keys, staying inside the grid. */
export function moveSelection(
  sel: [number, number],
  key: string,
  rows: number,
  cols: number,
): [number, number] {
  const [r, c] = sel;
  switch (key) {
    case "ArrowUp":
      return [Math.max(0, r - 1), c];
    case "ArrowDown":
      return [Math.min(rows - 1, r + 1), c];
    case "ArrowLeft":
      return [r, Math.max(0, c - 1)];
    case "ArrowRight":
      return [r, Math.min(cols - 1, c + 1)];
    default:
      return sel;
  }
}

/** Slider position (0..100 %) from a pointer x inside an element. */
export function sliderPercent(clientX: number, left: number, width: number): number {
  if (width <= 0) return 50;
  return Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
}
