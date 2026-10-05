import { Fragment } from "react";

export type FlowTone = "plain" | "world" | "data" | "process" | "result";

export type FlowStep = string | { label: string; note?: string; tone?: FlowTone; tag?: string };

export interface FlowProps {
  steps: FlowStep[];
  /** "down" (default) stacks steps; "right" lays them out in a row (wraps to a column on phones). */
  direction?: "down" | "right";
  /** Give the last step the "result" colour (default true). */
  highlightLast?: boolean;
  title?: string;
  caption?: string;
}

/** A pipeline drawn as connected boxes. Replaces text-arrow diagrams. */
export function Flow({ steps, direction = "down", highlightLast = true, title, caption }: FlowProps) {
  const items = steps.map((s) => (typeof s === "string" ? { label: s } : s));
  return (
    <figure className={`vis flow flow-${direction}`}>
      {title && <div className="vis-title">{title}</div>}
      <ol className="flow-list">
        {items.map((s, i) => {
          const last = i === items.length - 1;
          const tone = s.tone ?? (last && highlightLast && items.length > 1 ? "result" : "plain");
          return (
            <Fragment key={i}>
              <li className={`flow-step tone-${tone}`}>
                {s.tag && <span className="flow-tag">{s.tag}</span>}
                <span className="flow-label">{s.label}</span>
                {s.note && <span className="flow-note">{s.note}</span>}
              </li>
              {!last && (
                <li className="flow-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M12 4v14m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
