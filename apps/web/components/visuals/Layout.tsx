import type { ReactNode } from "react";

/** Responsive columns: side by side on wide screens, stacked on phones. `stack` = always one per row. */
export function Columns({ children, stack = false }: { children: ReactNode; stack?: boolean }) {
  return <div className={`cols${stack ? " cols-stack" : ""}`}>{children}</div>;
}

export type PanelTone = "plain" | "a" | "b" | "c" | "good" | "warn";

/** A titled card. Markdown inside works. */
export function Panel({ title, badge, tone = "plain", children }: { title?: string; badge?: string; tone?: PanelTone; children: ReactNode }) {
  return (
    <section className={`panel panel-${tone}`}>
      {(title || badge) && (
        <header className="panel-head">
          {badge && <span className="panel-badge">{badge}</span>}
          {title && <span className="panel-title">{title}</span>}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

/** A row of tags. */
export function Chips({ items, label }: { items: string[]; label?: string }) {
  return (
    <div className="chips-wrap">
      {label && <div className="vis-title">{label}</div>}
      <ul className="chips">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

/** One branch-diagram: a root that splits into columns of items. */
export function Tree({ root, branches }: { root: string; branches: { title: string; items: string[] }[] }) {
  return (
    <figure className="vis tree">
      <div className="tree-root">{root}</div>
      <div className="tree-branches" style={{ ["--n" as string]: branches.length }}>
        {branches.map((b, i) => (
          <div key={b.title} className={`tree-branch tone-${["a", "b", "c", "a", "b"][i]}`}>
            <div className="tree-title">{b.title}</div>
            <ul>
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Numbered summary cards. */
export function Takeaways({ children }: { children: ReactNode }) {
  return <div className="takeaways">{children}</div>;
}

export function Takeaway({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="takeaway">
      <header>
        <span className="takeaway-n">{n}</span>
        <span className="takeaway-title">{title}</span>
      </header>
      <div className="takeaway-body">{children}</div>
    </section>
  );
}
