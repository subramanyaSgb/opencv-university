export interface GlossaryItem {
  term: string;
  desc: string;
  example?: string;
}

/** Term cards: name, plain meaning, a short example. */
export function Glossary({ items }: { items: GlossaryItem[] }) {
  return (
    <dl className="gloss">
      {items.map((it) => (
        <div key={it.term} className="gloss-item">
          <dt>{it.term}</dt>
          <dd>
            {it.desc}
            {it.example && <code className="gloss-ex">{it.example}</code>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
