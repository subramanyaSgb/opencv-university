export interface EqTerm {
  value: string;
  label?: string;
  /** Operator shown before this term, e.g. "×", "=", "≈". */
  op?: string;
  /** Style as a result. */
  result?: boolean;
}

/** A worked calculation as labelled number cards: 1920 × 1080 = 2,073,600. */
export function Equation({ terms, caption }: { terms: EqTerm[]; caption?: string }) {
  return (
    <figure className="vis eq">
      <div className="eq-row">
        {terms.map((t, i) => (
          <span key={i} className="eq-item">
            {t.op && <span className="eq-op">{t.op}</span>}
            <span className={`eq-term${t.result ? " is-result" : ""}`}>
              <span className="eq-value">{t.value}</span>
              {t.label && <span className="eq-label">{t.label}</span>}
            </span>
          </span>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
