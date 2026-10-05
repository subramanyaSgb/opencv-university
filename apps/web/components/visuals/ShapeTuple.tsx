/** `image.shape → (1080, 1920, 3)` with each number labelled underneath. */
export function ShapeTuple({ values, labels, expr = "image.shape" }: { values: (number | string)[]; labels: string[]; expr?: string }) {
  const tones = ["a", "b", "c", "a"];
  return (
    <figure className="vis shape">
      <div className="shape-row">
        <code className="shape-expr">{expr}</code>
        <span className="shape-arrow" aria-hidden="true">→</span>
        <span className="shape-paren">(</span>
        {values.map((v, i) => (
          <span key={i} className="shape-item">
            <span className={`shape-val tone-${tones[i]}`}>{v}</span>
            <span className="shape-lab">{labels[i]}</span>
            {i < values.length - 1 && <span className="shape-comma">,</span>}
          </span>
        ))}
        <span className="shape-paren">)</span>
      </div>
    </figure>
  );
}
