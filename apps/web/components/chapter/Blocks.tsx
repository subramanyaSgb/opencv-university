import type { ReactNode } from "react";
import { ChevronDown, Info, KeyRound, Search, TriangleAlert } from "lucide-react";

/** Section 1 of every chapter: "Term = plain-language meaning". */
export function Definition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <p className="definition">
      <strong>{term}</strong> = {children}
    </p>
  );
}

/** Go deeper: collapsed by default so beginners can stop here. */
export function GoDeeper({ children, title = "Maths, theory and history (optional)" }: { children: ReactNode; title?: string }) {
  return (
    <details className="go-deeper">
      <summary>
        <Search size={16} strokeWidth={2} aria-hidden="true" />
        <span>{title}</span>
        <ChevronDown size={16} strokeWidth={2} className="details-chevron" aria-hidden="true" />
      </summary>
      <div className="details-body">{children}</div>
    </details>
  );
}

/** Hidden exercise solution. */
export function Solution({ children }: { children: ReactNode }) {
  return (
    <details className="solution">
      <summary>
        <span>Show solution</span>
        <ChevronDown size={16} strokeWidth={2} className="details-chevron" aria-hidden="true" />
      </summary>
      <div className="details-body">{children}</div>
    </details>
  );
}

const CALLOUT = {
  mistake: { Icon: TriangleAlert, label: "Common mistake" },
  note: { Icon: Info, label: "Note" },
  key: { Icon: KeyRound, label: "Key idea" },
} as const;

/** Inline callout box. Use sparingly. */
export function Callout({ kind = "note", children }: { kind?: keyof typeof CALLOUT; children: ReactNode }) {
  const c = CALLOUT[kind];
  return (
    <aside className={`callout callout-${kind}`}>
      <div className="callout-title">
        <c.Icon size={16} strokeWidth={2} aria-hidden="true" />
        {c.label}
      </div>
      <div>{children}</div>
    </aside>
  );
}
