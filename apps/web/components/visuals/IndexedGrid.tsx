import { inkFor } from "@/lib/pixel-ops";

type Cell = [number, number];

export interface IndexedGridProps {
  /** Grayscale values 0..255 (used for shading and, by default, the cell text). */
  values: number[][];
  /** What to print in each cell: the value, the (row,col) coordinate, both, or nothing. */
  show?: "values" | "coords" | "both" | "none";
  /** Custom text per cell (overrides `show`). Use "" for empty. */
  text?: string[][];
  /** Shade cells by value (default true). Off = neutral cells, for diagrams. */
  shade?: boolean;
  /** Row labels on the left, column labels underneath (default true). */
  rowLabels?: boolean;
  colLabels?: boolean;
  /** Label words, e.g. "Row" / "Col" (default) or "Row" / "Column". */
  rowWord?: string;
  colWord?: string;
  /** Put column labels above the grid instead of below. */
  colLabelsTop?: boolean;
  /** Emphasise one whole row or column, a list of cells, or a rectangular region (inclusive). */
  highlightRow?: number;
  highlightCol?: number;
  highlight?: Cell[];
  region?: { r0: number; r1: number; c0: number; c1: number };
  /** Draw a dashed row and column just outside the grid to show "out of bounds". */
  ghost?: boolean;
  /** Draw a horizontal arrow along each row, or a vertical arrow down each column. */
  arrows?: "rows" | "cols";
  caption?: string;
  label?: string;
}

/**
 * IndexedGrid: a pixel grid with row and column numbers around it.
 * The workhorse figure for indexing, coordinates and regions.
 */
export function IndexedGrid({
  values,
  show = "values",
  text,
  shade = true,
  rowLabels = true,
  colLabels = true,
  rowWord = "Row",
  colWord = "Col",
  colLabelsTop = false,
  highlightRow,
  highlightCol,
  highlight = [],
  region,
  ghost = false,
  arrows,
  caption,
  label,
}: IndexedGridProps) {
  const rows = values.length;
  const cols = values[0]?.length ?? 0;
  const hl = new Set(highlight.map(([r, c]) => `${r}-${c}`));
  const inRegion = (r: number, c: number) =>
    !!region && r >= region.r0 && r <= region.r1 && c >= region.c0 && c <= region.c1;
  const totalCols = cols + (ghost ? 1 : 0);
  const totalRows = rows + (ghost ? 1 : 0);

  const cellText = (r: number, c: number, v: number) => {
    if (text) return text[r]?.[c] ?? "";
    if (show === "values") return String(v);
    if (show === "coords") return `(${r},${c})`;
    if (show === "both") return (
      <>
        <span className="ig-v">{v}</span>
        <span className="ig-c">({r},{c})</span>
      </>
    );
    return "";
  };

  const colLabelRow = (
    <div className="ig-collabels" style={{ gridTemplateColumns: `repeat(${totalCols}, var(--igc))` }}>
      {Array.from({ length: totalCols }, (_, c) => (
        <span key={c} className={`ig-lab${highlightCol === c ? " is-on" : ""}${c >= cols ? " is-ghost" : ""}`}>
          {colWord} {c}
        </span>
      ))}
    </div>
  );

  return (
    <figure className={`vis ig${show === "coords" || show === "both" ? " ig-wide" : ""}${text ? " ig-text" : ""}`}>
      {label && <div className="vis-title">{label}</div>}
      <div className="ig-wrap" style={{ gridTemplateColumns: rowLabels ? "auto auto" : "auto" }}>
        {colLabels && colLabelsTop && (
          <>
            {rowLabels && <span />}
            {colLabelRow}
          </>
        )}
        {rowLabels && (
          <div className="ig-rowlabels" style={{ gridTemplateRows: `repeat(${totalRows}, var(--igc))` }}>
            {Array.from({ length: totalRows }, (_, r) => (
              <span key={r} className={`ig-lab${highlightRow === r ? " is-on" : ""}${r >= rows ? " is-ghost" : ""}`}>
                {rowWord} {r}
              </span>
            ))}
          </div>
        )}
        <div
          className="ig-grid"
          style={{ gridTemplateColumns: `repeat(${totalCols}, var(--igc))`, gridAutoRows: "var(--igc)" }}
          role="img"
          aria-label={`${rows} by ${cols} pixel grid`}
        >
          {Array.from({ length: totalRows }, (_, r) =>
            Array.from({ length: totalCols }, (_, c) => {
              if (r >= rows || c >= cols) {
                return (
                  <span key={`${r}-${c}`} className="ig-cell is-ghost" aria-hidden="true">
                    ✕
                  </span>
                );
              }
              const v = values[r][c];
              const on = hl.has(`${r}-${c}`) || highlightRow === r || highlightCol === c || inRegion(r, c);
              const style = shade ? { background: `rgb(${v},${v},${v})`, color: inkFor(v) } : undefined;
              return (
                <span
                  key={`${r}-${c}`}
                  className={`ig-cell${shade ? "" : " is-plain"}${on ? " is-on" : ""}${hl.has(`${r}-${c}`) ? " is-target" : ""}`}
                  style={style}
                >
                  {cellText(r, c, v)}
                </span>
              );
            }),
          )}
          {arrows === "rows" &&
            Array.from({ length: rows }, (_, r) => (
              <span key={`ar${r}`} className="ig-arrow-row" style={{ top: `calc(${r} * (var(--igc) + var(--iggap)) + var(--igc) * 0.84 + 3px)` }} aria-hidden="true" />
            ))}
          {arrows === "cols" &&
            Array.from({ length: cols }, (_, c) => (
              <span key={`ac${c}`} className="ig-arrow-col" style={{ left: `calc(${c} * (var(--igc) + var(--iggap)) + var(--igc) * 0.84 + 3px)` }} aria-hidden="true" />
            ))}
        </div>
        {colLabels && !colLabelsTop && (
          <>
            {rowLabels && <span />}
            {colLabelRow}
          </>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
