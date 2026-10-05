import { PixelMatrix } from "./PixelMatrix";

export interface MatrixTransformProps {
  before: number[][];
  after: number[][];
  /** The rule applied to every pixel, e.g. "new = old × 0.5". */
  rule: string;
  beforeLabel?: string;
  afterLabel?: string;
  size?: "xs" | "sm" | "md" | "lg";
  caption?: string;
  /** Cells to outline in both grids, as [row, column]. */
  highlight?: [number, number][];
}

/** Input pixels → rule → output pixels, all shaded by value. */
export function MatrixTransform({ before, after, rule, beforeLabel = "Before", afterLabel = "After", size = "md", caption, highlight }: MatrixTransformProps) {
  return (
    <figure className="vis mt">
      <div className="mt-row">
        <PixelMatrix values={before} label={beforeLabel} size={size} highlight={highlight} />
        <div className="mt-rule">
          <code>{rule}</code>
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M4 12h14m0 0-6-6m6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <PixelMatrix values={after} label={afterLabel} size={size} highlight={highlight} />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
