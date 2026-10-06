import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import type { ChapterMeta, ChapterRef } from "@/lib/course-types";
import { TableOfContents } from "./TableOfContents";
import { ReadingProgress } from "./ReadingProgress";
import { MarkComplete } from "./MarkComplete";

interface Props {
  meta: ChapterMeta;
  href: string;
  prev?: ChapterRef;
  next?: ChapterRef;
  children: ReactNode;
}

function LearningObjectives({ meta }: { meta: ChapterMeta }) {
  return (
    <div className="learning-objectives">
      <div className="side-title">Learning objectives</div>
      <ul>
        {meta.objectives.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      <div className="side-meta">
        <Clock size={14} strokeWidth={2} aria-hidden="true" /> About {meta.minutes} minutes
      </div>
    </div>
  );
}

function PagerLink({ ch, dir }: { ch?: ChapterRef; dir: "prev" | "next" }) {
  if (!ch) return <span />;
  const body = (
    <>
      <span className="pager-dir">
        {dir === "prev" ? <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" /> : null}
        {dir === "prev" ? "Previous" : "Next"}
        {dir === "next" ? <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /> : null}
      </span>
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

/** The chapter template frame: reading progress, article with inline objectives, contents rail, pager. */
export function ChapterLayout({ meta, href, prev, next, children }: Props) {
  return (
    <>
      <ReadingProgress />
      <div className="chapter-shell">
        <div className="chapter-grid">
          <article className="chapter">
            <details className="toc-mobile">
              <summary>On this page</summary>
              <TableOfContents />
            </details>
            <LearningObjectives meta={meta} />
            {children}
            <MarkComplete href={href} />
            <nav className="pager" aria-label="Chapter navigation">
              <PagerLink ch={prev} dir="prev" />
              <PagerLink ch={next} dir="next" />
            </nav>
          </article>

          <aside className="chapter-side" aria-label="On this page">
            <div className="sticky">
              <div className="side-title">On this page</div>
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
