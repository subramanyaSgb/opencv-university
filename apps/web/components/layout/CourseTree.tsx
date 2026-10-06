"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Circle, CircleDot } from "lucide-react";
import type { CourseIndex, ModuleRef } from "@/lib/course-types";
import { readProgress, isComplete, type ProgressState } from "@/lib/progress";

function moduleHrefs(m: ModuleRef): string[] {
  return m.chapters.map((c) => c.href);
}

/** The persistent left navigation: Part > Module > Chapter, current lesson highlighted. */
export function CourseTree({ course }: { course: CourseIndex }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState<ProgressState>({ completed: [], lastVisited: null });

  useEffect(() => {
    setProgress(readProgress());
  }, [pathname]);

  const initialOpen = useMemo(() => {
    const open = new Set<string>();
    for (const part of course.parts) {
      for (const mod of part.modules) {
        if (moduleHrefs(mod).includes(pathname)) open.add(mod.id);
      }
    }
    return open;
  }, [course, pathname]);

  const [open, setOpen] = useState<Set<string>>(initialOpen);

  useEffect(() => {
    setOpen((prev) => new Set([...prev, ...initialOpen]));
  }, [initialOpen]);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className="course-tree" aria-label="Course contents">
      {course.parts.map((part) => (
        <div className="ct-part" key={part.id}>
          <div className="ct-part-title">
            Part {part.letter}: {part.title}
          </div>
          {part.modules.map((mod) => {
            const isOpen = open.has(mod.id);
            return (
              <div className="ct-module" key={mod.id}>
                <button
                  type="button"
                  className="ct-module-btn"
                  aria-expanded={isOpen}
                  onClick={() => toggle(mod.id)}
                >
                  <ChevronRight size={14} strokeWidth={2} className={`ct-chevron${isOpen ? " is-open" : ""}`} aria-hidden="true" />
                  <span className="ct-module-num">{mod.number}</span>
                  <span className="ct-module-title">{mod.title}</span>
                </button>
                {isOpen && (
                  <ul className="ct-chapters">
                    {mod.chapters.map((ch) => {
                      const isCurrent = ch.href === pathname;
                      const done = ch.available && isComplete(progress, ch.href);
                      return (
                        <li key={ch.slug}>
                          {ch.available ? (
                            <Link href={ch.href} className="ct-chapter" aria-current={isCurrent ? "page" : undefined}>
                              {done ? (
                                <CircleDot size={14} strokeWidth={2} className="ct-status is-done" aria-hidden="true" />
                              ) : (
                                <Circle size={14} strokeWidth={2} className="ct-status" aria-hidden="true" />
                              )}
                              <span className="ct-chapter-num">{ch.number}</span>
                              <span className="ct-chapter-title" title={ch.title}>
                                {ch.title}
                              </span>
                            </Link>
                          ) : (
                            <span className="ct-chapter is-soon">
                              <Circle size={14} strokeWidth={2} className="ct-status is-soon" aria-hidden="true" />
                              <span className="ct-chapter-num">{ch.number}</span>
                              <span className="ct-chapter-title" title={ch.title}>
                                {ch.title}
                              </span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
