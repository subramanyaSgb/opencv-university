export interface CoordPoint {
  row: number;
  col: number;
  label?: string;
}

export interface CoordAxesProps {
  /** Image size in pixels. */
  width: number;
  height: number;
  points?: CoordPoint[];
  /** Dashed guides from each point to the axes (default true). */
  guides?: boolean;
  caption?: string;
}

/** The image coordinate frame: origin top-left, x (columns) to the right, y (rows) downward. */
export function CoordAxes({ width, height, points = [], guides = true, caption }: CoordAxesProps) {
  const ml = 70, mt = 46, mr = 30, mb = 30;
  const iw = 360;
  const ih = Math.round((iw * height) / width);
  const W = ml + iw + mr;
  const H = mt + ih + mb;
  const px = (c: number) => ml + (width > 1 ? (c / (width - 1)) * iw : 0);
  const py = (r: number) => mt + (height > 1 ? (r / (height - 1)) * ih : 0);
  return (
    <figure className="vis axes">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Image coordinate frame, ${width} by ${height} pixels, origin at the top-left`}>
        <defs>
          <marker id="ax-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="ax-fill" />
          </marker>
        </defs>
        <rect x={ml} y={mt} width={iw} height={ih} rx="4" className="ax-img" />
        {/* x axis along the top */}
        <line x1={ml} y1={mt - 14} x2={ml + iw + 18} y2={mt - 14} className="ax-line" markerEnd="url(#ax-arrow)" />
        <text x={ml + iw / 2} y={mt - 22} textAnchor="middle" className="ax-label">x → columns (0 … {width - 1})</text>
        {/* y axis down the left */}
        <line x1={ml - 14} y1={mt} x2={ml - 14} y2={mt + ih + 18} className="ax-line" markerEnd="url(#ax-arrow)" />
        <text x={ml - 22} y={mt + ih / 2} textAnchor="middle" className="ax-label" transform={`rotate(-90 ${ml - 22} ${mt + ih / 2})`}>
          y ↓ rows (0 … {height - 1})
        </text>
        {points.map((p, i) => {
          const x = px(p.col);
          const y = py(p.row);
          const right = p.col > (width - 1) / 2;
          const below = p.row <= (height - 1) / 2;
          const lx = right ? x - 9 : x + 9;
          const ly = below ? y + 18 : y - 10;
          return (
            <g key={i}>
              {guides && p.col > 0 && p.col < width - 1 && (
                <line x1={x} y1={mt} x2={x} y2={y} className="ax-guide" />
              )}
              {guides && p.row > 0 && p.row < height - 1 && (
                <line x1={ml} y1={y} x2={x} y2={y} className="ax-guide" />
              )}
              <circle cx={x} cy={y} r="5.5" className="ax-dot" />
              <text x={lx} y={ly} textAnchor={right ? "end" : "start"} className="ax-pt">
                {p.label ?? `[${p.row}, ${p.col}]`}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
