/** Rod ends seen end-on: rows × cols circles, each marked as detected, with the count. */
export function DotGrid({ rows, cols, detected = true, label, caption }: { rows: number; cols: number; detected?: boolean; label?: string; caption?: string }) {
  const r = 14, gap = 8, pad = 16;
  const W = pad * 2 + cols * (2 * r) + (cols - 1) * gap;
  const H = pad * 2 + rows * (2 * r) + (rows - 1) * gap;
  return (
    <figure className="vis dots">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${rows * cols} rod ends${detected ? ", each detected" : ""}`}>
        <rect width={W} height={H} rx="10" fill="#151a20" />
        {Array.from({ length: rows }, (_, i) =>
          Array.from({ length: cols }, (_, j) => {
            const cx = pad + r + j * (2 * r + gap);
            const cy = pad + r + i * (2 * r + gap);
            return (
              <g key={`${i}-${j}`}>
                <circle cx={cx} cy={cy} r={r - 2} fill="#c9ced6" />
                {detected && <circle cx={cx} cy={cy} r={r + 1} fill="none" stroke="#3fb950" strokeWidth="2.5" />}
              </g>
            );
          }),
        )}
      </svg>
      {label && <div className="dots-label">{label}</div>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
