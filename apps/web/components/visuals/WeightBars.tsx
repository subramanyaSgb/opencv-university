/** How much each channel contributes to gray: 0.299 R, 0.587 G, 0.114 B. */
export function WeightBars({ caption }: { caption?: string }) {
  const items = [
    { k: "G", name: "Green", w: 0.587, cls: "wb-g" },
    { k: "R", name: "Red", w: 0.299, cls: "wb-r" },
    { k: "B", name: "Blue", w: 0.114, cls: "wb-b" },
  ];
  return (
    <figure className="vis wb">
      {items.map((it) => (
        <div key={it.k} className="wb-row">
          <span className="wb-name">{it.name}</span>
          <span className="wb-track">
            <span className={`wb-bar ${it.cls}`} style={{ width: `${(it.w / 0.587) * 100}%` }} />
          </span>
          <span className="wb-val">{it.w.toFixed(3)}</span>
        </div>
      ))}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
