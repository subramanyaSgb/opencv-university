import type { ReactNode } from "react";

export interface NestLayer {
  label: string;
  note?: string;
  /** Text shown in the space beside the inner layer, e.g. "Other methods". */
  side?: string;
}

/** Layers drawn as boxes inside boxes: AI ⊃ Machine learning ⊃ Deep learning. */
export function Nested({ layers, caption }: { layers: NestLayer[]; caption?: string }) {
  const render = (i: number): ReactNode => {
    const l = layers[i];
    return (
      <div className={`nest nest-${i}`}>
        <div className="nest-head">
          <span className="nest-label">{l.label}</span>
          {l.note && <span className="nest-note">{l.note}</span>}
        </div>
        {i + 1 < layers.length && (
          <div className="nest-body">
            {render(i + 1)}
            {l.side && <div className="nest-side">{l.side}</div>}
          </div>
        )}
      </div>
    );
  };
  return (
    <figure className="vis nested">
      {render(0)}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
