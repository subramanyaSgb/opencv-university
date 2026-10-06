"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle, CircleDot } from "lucide-react";
import type { CourseIndex, ModuleRef } from "@/lib/course-types";
import { countComplete, isComplete, readProgress, type ProgressState } from "@/lib/progress";

function statusOf(progress: ProgressState, href: string): "done" | "in-progress" | "not-started" {
  if (isComplete(progress, href)) return "done";
  if (progress.lastVisited === href) return "in-progress";
  return "not-started";
}

function ModuleRow({ mod, progress }: { mod: ModuleRef; progress: ProgressState }) {
  const available = mod.chapters.filter((c) => c.available);
  const done = countComplete(progress, available);

  return (
    <details className="outline-module" open={done > 0 && done < available.length}>
      <summary className="outline-module-head">
        <span className="outline-module-num">{mod.number}</span>
        <span className="outline-module-main">
          <span className="outline-module-title">{mod.title}</span>
          <span className="outline-module-summary">{mod.summary}</span>
        </span>
        <span className="outline-module-meta">
          {available.length > 0 ? `${done}/${available.length} lessons` : "Coming soon"}
        </span>
      </summary>
      <ol className="outline-chapters">
        {mod.chapters.map((ch) => {
          const status = ch.available ? statusOf(progress, ch.href) : "not-started";
          return (
            <li key={ch.slug} className="outline-chapter">
              {ch.available ? (
                <Link href={ch.href} className="outline-chapter-link">
                  <StatusIcon status={status} />
                  <span className="ch-num">{ch.number}</span>
                  <span>{ch.title}</span>
                </Link>
              ) : (
                <span className="outline-chapter-link is-soon">
                  <StatusIcon status="not-started" muted />
                  <span className="ch-num">{ch.number}</span>
                  <span>
                    {ch.title} <em className="ch-soon-label">Coming soon</em>
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function StatusIcon({ status, muted }: { status: "done" | "in-progress" | "not-started"; muted?: boolean }) {
  if (status === "done") return <Check size={15} strokeWidth={2.5} className="status-icon is-done" aria-hidden="true" />;
  if (status === "in-progress") return <CircleDot size={15} strokeWidth={2} className="status-icon is-in-progress" aria-hidden="true" />;
  return <Circle size={15} strokeWidth={2} className={`status-icon${muted ? " is-muted" : ""}`} aria-hidden="true" />;
}

export function CourseOutline({ course }: { course: CourseIndex }) {
  const [progress, setProgress] = useState<ProgressState>({ completed: [], lastVisited: null });

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  return (
    <>
      {course.parts.map((part) => (
        <section key={part.id} className="home-part">
          <h2>
            Part {part.letter}: {part.title}
          </h2>
          {part.modules.map((mod) => (
            <ModuleRow key={mod.id} mod={mod} progress={progress} />
          ))}
        </section>
      ))}
    </>
  );
}
