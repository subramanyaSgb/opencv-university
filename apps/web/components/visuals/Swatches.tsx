import { css, inkOn, type RGB } from "@/lib/color-ops";

export interface SwatchItem {
  /** A gray value 0..255, or a colour given in R, G, B order. */
  value: number | RGB;
  label: string;
  /** Optional small line under the label, e.g. "[255, 0, 0]". */
  sub?: string;
}

const toRGB = (v: number | RGB): RGB => (typeof v === "number" ? [v, v, v] : v);

/** A row of colour or gray swatches with labels. */
export function SwatchRow({ items, caption, size = "md" }: { items: SwatchItem[]; caption?: string; size?: "sm" | "md" }) {
  return (
    <figure className={`vis sw sw-${size}`}>
      <div className="sw-row">
        {items.map((it, i) => {
          const rgb = toRGB(it.value);
          return (
            <div key={i} className="sw-item">
              <span className="sw-chip" style={{ background: css(rgb), color: inkOn(rgb) }}>
                {typeof it.value === "number" ? it.value : ""}
              </span>
              <span className="sw-label">{it.label}</span>
              {it.sub && <code className="sw-sub">{it.sub}</code>}
            </div>
          );
        })}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export interface MixItem {
  /** Colours being added, R, G, B order. */
  parts: RGB[];
  partLabels: string[];
  result: RGB;
  label: string;
}

/** "Red + Green → Yellow" as swatch equations. */
export function ColorMix({ items, caption }: { items: MixItem[]; caption?: string }) {
  return (
    <figure className="vis mix">
      <div className="mix-grid">
        {items.map((m, i) => (
          <div key={i} className="mix-card">
            <div className="mix-row">
              {m.parts.map((p, j) => (
                <span key={j} className="mix-part">
                  {j > 0 && <span className="mix-op">+</span>}
                  <span className="mix-dot" style={{ background: css(p) }} title={m.partLabels[j]} />
                </span>
              ))}
              <span className="mix-op">→</span>
              <span className="mix-dot mix-res" style={{ background: css(m.result) }} />
            </div>
            <div className="mix-text">
              {m.partLabels.join(" + ")} → <strong>{m.label}</strong>
            </div>
          </div>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Three overlapping coloured lights on black: additive mixing. */
export function AdditiveMix({ caption }: { caption?: string }) {
  return (
    <figure className="vis addmix">
      <svg viewBox="0 0 300 260" role="img" aria-label="Red, green and blue lights overlapping: red and green make yellow, red and blue make magenta, green and blue make cyan, all three make white">
        <rect width="300" height="260" rx="12" fill="#000" />
        <g style={{ mixBlendMode: "screen", isolation: "isolate" }}>
          <circle cx="115" cy="105" r="72" fill="#ff0000" style={{ mixBlendMode: "screen" }} />
          <circle cx="185" cy="105" r="72" fill="#00ff00" style={{ mixBlendMode: "screen" }} />
          <circle cx="150" cy="165" r="72" fill="#0000ff" style={{ mixBlendMode: "screen" }} />
        </g>
        <text x="72" y="70" fill="#fff" fontSize="13" fontWeight="700" fontFamily="system-ui, sans-serif">R</text>
        <text x="220" y="70" fill="#000" fontSize="13" fontWeight="700" fontFamily="system-ui, sans-serif">G</text>
        <text x="146" y="225" fill="#fff" fontSize="13" fontWeight="700" fontFamily="system-ui, sans-serif">B</text>
        <text x="150" y="128" textAnchor="middle" fill="#000" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">white</text>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
