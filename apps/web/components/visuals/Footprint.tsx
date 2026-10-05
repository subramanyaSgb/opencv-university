/** Which pixels an operation looks at: one pixel, a 3 × 3 neighbourhood, or the whole image. */
export function Footprint({ mode, label, size = 7 }: { mode: "point" | "neighborhood" | "global"; label?: string; size?: number }) {
  const mid = Math.floor(size / 2);
  return (
    <figure className="vis fp">
      <div className="fp-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} role="img"
        aria-label={mode === "point" ? "one pixel highlighted" : mode === "neighborhood" ? "a pixel and its 8 neighbours highlighted" : "every pixel highlighted"}>
        {Array.from({ length: size * size }, (_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const centre = r === mid && c === mid;
          const near = Math.abs(r - mid) <= 1 && Math.abs(c - mid) <= 1;
          const on = mode === "global" || (mode === "neighborhood" ? near : centre);
          return <span key={i} className={`fp-cell${on ? ` on-${mode}` : ""}${centre && mode !== "global" ? " is-centre" : ""}`} />;
        })}
      </div>
      {label && <figcaption className="fp-label">{label}</figcaption>}
    </figure>
  );
}
