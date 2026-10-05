import Link from "next/link";
import type { ReactNode } from "react";
import type { ChapterMeta, ChapterRef, ModuleRef, PartRef } from "@/lib/course-types";
import { TableOfContents } from "./TableOfContents";

interface Props {
  meta: ChapterMeta;
  part: PartRef;
  module: ModuleRef;
  prev?: ChapterRef;
  next?: ChapterRef;
  children: ReactNode;
}

function Objectives({ meta }: { meta: ChapterMeta }) {
  return (
    <div className="objectives">
      <div className="side-title">You will learn to</div>
      <ul>
        {meta.objectives.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      <div className="side-meta">About {meta.minutes} minutes</div>
    </div>
  );
}

function PagerLink({ ch, dir }: { ch?: ChapterRef; dir: "prev" | "next" }) {
  if (!ch) return <span />;
  const label = dir === "prev" ? "← Previous" : "Next →";
  const body = (
    <>
      <span className="pager-dir">{label}</span>
      <span className="pager-title">
        {ch.number} {ch.title}
      </span>
      {!ch.available && <span className="pager-soon">Coming soon</span>}
    </>
  );
  return ch.available ? (
    <Link href={ch.href} className={`pager-link ${dir}`}>
      {body}
    </Link>
  ) : (
    <span className={`pager-link ${dir} is-disabled`} aria-disabled="true">
      {body}
    </span>
  );
}

/** The chapter template frame: breadcrumb, article, contents sidebar, pager. */
export function ChapterLayout({ meta, part, module, prev, next, children }: Props) {
  return (
    <div className="chapter-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Course</Link>
        <span aria-hidden="true">›</span>
        <span>
          Part {part.letter}: {part.title}
        </span>
        <span aria-hidden="true">›</span>
        <span>
          {module.number}. {module.title}
        </span>
      </nav>

      <div className="chapter-grid">
        <article className="chapter">
          <details className="toc-mobile">
            <summary>On this page</summary>
            <Objectives meta={meta} />
            <TableOfContents />
          </details>
          {children}
          <nav className="pager" aria-label="Chapter navigation">
            <PagerLink ch={prev} dir="prev" />
            <PagerLink ch={next} dir="next" />
          </nav>
        </article>

        <aside className="chapter-side" aria-label="On this page">
          <div className="sticky">
            <Objectives meta={meta} />
            <div className="side-title">On this page</div>
            <TableOfContents />
          </div>
        </aside>
      </div>
    </div>
  );
}
