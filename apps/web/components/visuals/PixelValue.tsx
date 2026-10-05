import { inkFor } from "@/lib/pixel-ops";

/**
 * One pixel's stored value(s). A number = grayscale (one gray swatch).
 * A triple = colour in OpenCV order [B, G, R]: three channel boxes and the colour they make.
 */
export function PixelValue({ value, label }: { value: number | [number, number, number]; label?: string }) {
  if (typeof value === "number") {
    return (
      <figure className="vis pv">
        {label && <div className="vis-title">{label}</div>}
        <div className="pv-row">
          <span className="pv-swatch" style={{ background: `rgb(${value},${value},${value})`, color: inkFor(value) }}>{value}</span>
          <span className="pv-note">one number</span>
        </div>
      </figure>
    );
  }
  const [b, g, r] = value;
  return (
    <figure className="vis pv">
      {label && <div className="vis-title">{label}</div>}
      <div className="pv-row">
        <span className="pv-ch pv-b"><small>B</small>{b}</span>
        <span className="pv-ch pv-g"><small>G</small>{g}</span>
        <span className="pv-ch pv-r"><small>R</small>{r}</span>
        <span className="pv-eq" aria-hidden="true">=</span>
        <span className="pv-swatch" style={{ background: `rgb(${r},${g},${b})` }} aria-label={`colour with blue ${b}, green ${g}, red ${r}`} />
      </div>
    </figure>
  );
}
