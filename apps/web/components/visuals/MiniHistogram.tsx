/** A small bar chart of pixel counts per intensity value. */
export function MiniHistogram({ data, caption }: { data: { value: number; count: number }[]; caption?: string }) {
  const max = Math.max(...data.map((d) => d.count));
  return (
    <figure className="vis mh">
      <div className="mh-chart" role="img" aria-label={`Histogram: ${data.map((d) => `${d.count} pixels of value ${d.value}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.value} className="mh-col">
            <span className="mh-count">{d.count}</span>
            <span className="mh-bar" style={{ height: `${(d.count / max) * 100}%` }} />
            <span className="mh-val">
              <span className="mh-sw" style={{ background: `rgb(${d.value},${d.value},${d.value})` }} />
              {d.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mh-axis">intensity → (bar height = number of pixels)</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
