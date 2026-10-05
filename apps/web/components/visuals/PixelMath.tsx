import { inkFor } from "@/lib/pixel-ops";

export interface PixelMathOp {
  label: string;
  expr: string;
  result: number | string;
}

function Swatch({ v }: { v: number }) {
  const c = Math.max(0, Math.min(255, v));
  return (
    <span className="swatch" style={{ background: `rgb(${c},${c},${c})`, color: inkFor(c) }}>
      {v}
    </span>
  );
}

/** One pixel value, several operations: each card shows the sum and the gray before and after. */
export function PixelMath({ value, ops }: { value: number; ops: PixelMathOp[] }) {
  return (
    <figure className="vis pmath">
      <div className="pmath-start">
        <span>pixel =</span> <Swatch v={value} />
      </div>
      <div className="pmath-grid">
        {ops.map((o) => (
          <div key={o.expr} className="pmath-card">
            <div className="pmath-label">{o.label}</div>
            <code className="pmath-expr">{o.expr}</code>
            <div className="pmath-row">
              <Swatch v={value} />
              <span className="pmath-arrow" aria-hidden="true">→</span>
              {typeof o.result === "number" ? <Swatch v={o.result} /> : <span className="pmath-answer">{o.result}</span>}
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
