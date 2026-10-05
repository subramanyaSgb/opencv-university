import { css, inkOn, reverse, type RGB } from "@/lib/color-ops";

/**
 * A grid of colour pixels. `values` are written in the order given by `order`
 * (what the code would store); the cell is painted with the true colour.
 */
export function ColorGrid({ values, order = "RGB", caption, label }: { values: RGB[][]; order?: "RGB" | "BGR"; caption?: string; label?: string }) {
  const cols = values[0]?.length ?? 0;
  return (
    <figure className="vis cg">
      {label && <div className="vis-title">{label}</div>}
      <div className="cg-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 9rem))` }}>
        {values.map((row, r) =>
          row.map((v, c) => {
            const rgb = order === "RGB" ? v : reverse(v);
            return (
              <span key={`${r}-${c}`} className="cg-cell" style={{ background: css(rgb), color: inkOn(rgb) }}>
                <code>[{v.join(", ")}]</code>
              </span>
            );
          }),
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
