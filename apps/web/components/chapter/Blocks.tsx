import type { ReactNode } from "react";

/** Section 1 of every chapter: "Term = plain-language meaning". */
export function Definition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <p className="definition">
      <strong>{term}</strong> = {children}
    </p>
  );
}

/** 🔍 Go deeper: collapsed by default so beginners can stop here. */
export function GoDeeper({ children, title = "Maths, theory and history (optional)" }: { children: ReactNode; title?: string }) {
  return (
    <details className="go-deeper">
      <summary>🔍 {title}</summary>
      <div className="details-body">{children}</div>
    </details>
  );
}

/** Hidden exercise solution. */
export function Solution({ children }: { children: ReactNode }) {
  return (
    <details className="solution">
      <summary>Show solution</summary>
      <div className="details-body">{children}</div>
    </details>
  );
}

const CALLOUT = {
  mistake: { icon: "⚠️", label: "Common mistake" },
  note: { icon: "ℹ️", label: "Note" },
  key: { icon: "🔑", label: "Key idea" },
} as const;

/** Inline callout box. Use sparingly. */
export function Callout({ kind = "note", children }: { kind?: keyof typeof CALLOUT; children: ReactNode }) {
  const c = CALLOUT[kind];
  return (
    <aside className={`callout callout-${kind}`}>
      <div className="callout-title">
        <span aria-hidden="true">{c.icon}</span> {c.label}
      </div>
      <div>{children}</div>
    </aside>
  );
}
