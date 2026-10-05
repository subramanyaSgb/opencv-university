/** A small kernel (weights) drawn as a grid, e.g. the 3 × 3 averaging kernel of 1/9s. */
export function KernelGrid({ cells, label, caption }: { cells: string[][]; label?: string; caption?: string }) {
  const cols = cells[0]?.length ?? 0;
  return (
    <figure className="vis kg">
      {label && <div className="vis-title">{label}</div>}
      <div className="kg-wrap">
        <span className="kg-br">[</span>
        <div className="kg-grid" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
          {cells.flat().map((t, i) => (
            <span key={i} className="kg-cell">{t}</span>
          ))}
        </div>
        <span className="kg-br">]</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
