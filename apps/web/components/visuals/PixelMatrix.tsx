import { inkFor } from "@/lib/pixel-ops";

export interface PixelMatrixProps {
  /** Grayscale values 0..255, rows of equal length. */
  values: number[][];
  /** Print the number in each cell (default true). Off = the picture a person sees. */
  numbers?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
  caption?: string;
  /** Cells to outline, as [row, column]. */
  highlight?: [number, number][];
}

/** A read-only grid of pixels, each shaded by its own value. */
export function PixelMatrix({ values, numbers = true, size = "md", label, caption, highlight = [] }: PixelMatrixProps) {
  const cols = values[0]?.length ?? 0;
  const hl = new Set(highlight.map(([r, c]) => `${r}-${c}`));
  return (
    <figure className="vis pm">
      {label && <div className="vis-title">{label}</div>}
      <div className={`pm-grid pm-${size}`} style={{ ["--cols" as string]: cols }} role="img"
        aria-label={`${values.length} by ${cols} grayscale pixels: ${values.map((r) => r.join(", ")).join("; ")}`}>
        {values.map((row, r) =>
          row.map((v, c) => (
            <span key={`${r}-${c}`} className={`pm-cell${hl.has(`${r}-${c}`) ? " is-hl" : ""}`}
              style={{ background: `rgb(${v},${v},${v})`, color: inkFor(v) }}>
              {numbers ? v : ""}
            </span>
          )),
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
