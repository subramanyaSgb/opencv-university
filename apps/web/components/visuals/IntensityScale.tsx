export interface IntensityScaleProps {
  marks?: { value: number; label: string }[];
  max?: number;
  caption?: string;
}

const DEFAULT_MARKS = [
  { value: 0, label: "Black" },
  { value: 128, label: "Gray" },
  { value: 255, label: "White" },
];

/** The 8-bit brightness scale from 0 (black) to 255 (white), with labelled marks. */
export function IntensityScale({ marks = DEFAULT_MARKS, max = 255, caption }: IntensityScaleProps) {
  return (
    <figure className="vis iscale">
      <div className="iscale-bar" role="img" aria-label={`Brightness scale from 0 (black) to ${max} (white)`}>
        {marks.map((m) => (
          <span key={m.value} className="iscale-mark" style={{ left: `${(m.value / max) * 100}%` }} />
        ))}
      </div>
      <div className="iscale-labels">
        {marks.map((m) => (
          <span key={m.value} className="iscale-label" style={{ left: `${(m.value / max) * 100}%` }}>
            <span className="iscale-swatch" style={{ background: `rgb(${m.value},${m.value},${m.value})` }} />
            <strong>{m.value}</strong>
            <span>{m.label}</span>
          </span>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
