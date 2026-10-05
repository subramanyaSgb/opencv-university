import { css, reverse, type RGB } from "@/lib/color-ops";

const NAMES = { R: "Red", G: "Green", B: "Blue" } as const;

export interface ChannelOrderProps {
  order: "RGB" | "BGR";
  /** Values in the same order as `order`. Omit to show the order only. */
  values?: [number, number, number];
  /** Show the index (0, 1, 2) under each box. */
  indices?: boolean;
  /** Index to emphasise, e.g. 2 for image[r, c, 2]. */
  highlight?: number;
  /** Show the resulting colour swatch (needs values). */
  swatch?: boolean;
  label?: string;
}

/** A pixel's channel boxes in RGB or BGR order, with optional values, indices and colour. */
export function ChannelOrder({ order, values, indices = false, highlight, swatch = true, label }: ChannelOrderProps) {
  const letters = order.split("") as ("R" | "G" | "B")[];
  const rgb: RGB | null = values ? (order === "RGB" ? values : reverse(values)) : null;
  return (
    <figure className="vis co">
      {label && <div className="vis-title">{label}</div>}
      <div className="co-row">
        <span className="co-br">[</span>
        {letters.map((L, i) => (
          <span key={i} className={`co-box co-${L.toLowerCase()}${highlight === i ? " is-hl" : ""}`}>
            <small>{NAMES[L]}</small>
            <strong>{values ? values[i] : L}</strong>
            {indices && <span className="co-idx">index {i}</span>}
          </span>
        ))}
        <span className="co-br">]</span>
        {rgb && swatch && (
          <>
            <span className="co-eq" aria-hidden="true">=</span>
            <span className="co-swatch" style={{ background: css(rgb) }} aria-label={`colour red ${rgb[0]}, green ${rgb[1]}, blue ${rgb[2]}`} />
          </>
        )}
      </div>
    </figure>
  );
}

/** BGR values → reversed → RGB values, with crossing lines. */
export function ChannelSwap({ bgr }: { bgr: [number, number, number] }) {
  const rgb = reverse(bgr);
  return (
    <figure className="vis cswap">
      <ChannelOrder order="BGR" values={bgr} label="BGR (OpenCV)" />
      <svg viewBox="0 0 240 46" className="cswap-lines" aria-hidden="true">
        <path d="M55 4 C55 26 201 20 201 42" />
        <path d="M128 4 L128 42" />
        <path d="M201 4 C201 26 55 20 55 42" />
      </svg>
      <ChannelOrder order="RGB" values={rgb} label="RGB" />
    </figure>
  );
}
