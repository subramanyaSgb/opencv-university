/** An image drawn to scale with its width (columns) and height (rows) dimensioned. */
export function SizeDiagram({ width, height, caption }: { width: number; height: number; caption?: string }) {
  const iw = 340;
  const ih = Math.round((iw * height) / width);
  const ml = 20, mt = 44, mr = 120, mb = 16;
  const W = ml + iw + mr;
  const H = mt + ih + mb;
  return (
    <figure className="vis size">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Image ${width} pixels wide and ${height} pixels high`}>
        <defs>
          <marker id="sz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="ax-fill" />
          </marker>
        </defs>
        <rect x={ml} y={mt} width={iw} height={ih} rx="6" className="sz-img" />
        <text x={ml + iw / 2} y={mt + ih / 2 + 6} textAnchor="middle" className="sz-word">IMAGE</text>
        <line x1={ml} y1={mt - 16} x2={ml + iw} y2={mt - 16} className="ax-line" markerStart="url(#sz-arrow)" markerEnd="url(#sz-arrow)" />
        <text x={ml + iw / 2} y={mt - 24} textAnchor="middle" className="ax-label sz-strong">Width = {width} (columns)</text>
        <line x1={ml + iw + 16} y1={mt} x2={ml + iw + 16} y2={mt + ih} className="ax-line" markerStart="url(#sz-arrow)" markerEnd="url(#sz-arrow)" />
        <text x={ml + iw + 26} y={mt + ih / 2 - 6} className="ax-label sz-strong">Height</text>
        <text x={ml + iw + 26} y={mt + ih / 2 + 12} className="ax-label sz-strong">= {height}</text>
        <text x={ml + iw + 26} y={mt + ih / 2 + 30} className="ax-label">(rows)</text>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
