"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Circle, CircleDot } from "lucide-react";
import type { CourseIndex, ModuleRef } from "@/lib/course-types";
import { readProgress, isComplete, type ProgressState } from "@/lib/progress";
import { readOpenModules, toggleId, writeOpenModules } from "@/lib/nav-state";

function moduleHrefs(m: ModuleRef): string[] {
  return m.chapters.map((c) => c.href);
}

function findModuleId(course: CourseIndex, pathname: string): string | null {
  for (const part of course.parts) {
    for (const mod of part.modules) {
      if (moduleHrefs(mod).includes(pathname)) return mod.id;
    }
  }
  return null;
}

/** The persistent left navigation: Part > Module > Chapter, current lesson highlighted and scrolled into view. */
export function CourseTree({ course }: { course: CourseIndex }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState<ProgressState>({ completed: [], lastVisited: null });
  const [open, setOpen] = useState<Set<string>>(() => {
    const id = findModuleId(course, pathname);
    return id ? new Set([id]) : new Set();
  });

  useEffect(() => {
    setProgress(readProgress());
  }, [pathname]);

  // On load and on every route change: the current chapter's module opens, merged with
  // whatever the reader had already opened to browse (so manual exploration survives navigation).
  useEffect(() => {
    const id = findModuleId(course, pathname);
    const persisted = readOpenModules();
    const next = new Set(persisted);
    if (id) next.add(id);
    setOpen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Scroll the current lesson into view once it's actually in the DOM (its module is open).
  useEffect(() => {
    navRef.current?.querySelector('a[aria-current="page"]')?.scrollIntoView({ block: "center" });
  }, [open]);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const nextIds = toggleId(Array.from(prev), id);
      writeOpenModules(nextIds);
      return new Set(nextIds);
    });
  };

  return (
    <nav className="course-tree" aria-label="Course contents" ref={navRef}>
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
                  <span className="ct-module-num tabular-nums">{mod.number}</span>
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
                              <span className="ct-chapter-num tabular-nums">{ch.number}</span>
                              <span className="ct-chapter-title">{ch.title}</span>
                            </Link>
                          ) : (
                            <span className="ct-chapter is-soon">
                              <Circle size={14} strokeWidth={2} className="ct-status is-soon" aria-hidden="true" />
                              <span className="ct-chapter-num tabular-nums">{ch.number}</span>
                              <span className="ct-chapter-title">{ch.title}</span>
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
