/** Two-column comparison: each row is "left ↔ right". */
export function VsTable({ left, right, rows, caption }: { left: string; right: string; rows: [string, string][]; caption?: string }) {
  return (
    <figure className="vis vs">
      <div className="vs-grid" role="table" aria-label={`${left} compared with ${right}`}>
        <div className="vs-head vs-l" role="columnheader">{left}</div>
        <div className="vs-head vs-r" role="columnheader">{right}</div>
        {rows.map(([l, r], i) => (
          <div key={i} className="vs-row" role="row">
            <div className="vs-cell vs-l" role="cell">{l}</div>
            <div className="vs-cell vs-r" role="cell">{r}</div>
          </div>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
