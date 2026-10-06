"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CourseIndex } from "@/lib/course-types";
import { allChapters, countComplete, isComplete, percent, readProgress, type ProgressState } from "@/lib/progress";
import { partFacts, formatMinutes } from "@/lib/course-stats";

export function ProgressDashboard({ course }: { course: CourseIndex }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  if (!progress) return null;

  const chapters = allChapters(course);
  const done = countComplete(progress, chapters);
  const pct = percent(done, chapters.length);
  const lastVisited = progress.lastVisited ? chapters.find((c) => c.href === progress.lastVisited) : undefined;
  const completed = chapters.filter((c) => isComplete(progress, c.href));

  return (
    <div className="dashboard">
      <div className="dashboard-totals">
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{pct}%</span>
          <span className="dashboard-stat-label">Overall progress</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">
            {done}/{chapters.length}
          </span>
          <span className="dashboard-stat-label">Lessons complete</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{lastVisited ? `${lastVisited.number}` : "--"}</span>
          <span className="dashboard-stat-label">Last lesson</span>
        </div>
      </div>

      <h2>By part</h2>
      <div className="dashboard-parts">
        {course.parts.map((part) => {
          const facts = partFacts(part);
          const partDone = part.modules.flatMap((m) => m.chapters).filter((c) => c.available && isComplete(progress, c.href)).length;
          const partPct = percent(partDone, facts.lessonsAvailable);
          return (
            <div className="dashboard-part-row" key={part.id}>
              <span className="dashboard-part-letter">{part.letter}</span>
              <span className="dashboard-part-title">{part.title}</span>
              <div className="progress-bar dashboard-part-bar">
                <div className="progress-bar-fill" style={{ width: `${partPct}%` }} />
              </div>
              <span className="dashboard-part-count tabular-nums">
                {partDone}/{facts.lessonsAvailable}
              </span>
            </div>
          );
        })}
      </div>

      <h2>Completed lessons</h2>
      {completed.length === 0 ? (
        <p className="sg-note">No lessons marked complete yet.</p>
      ) : (
        <ul className="dashboard-completed">
          {completed.map((c) => (
            <li key={c.slug}>
              <Link href={c.href}>
                {c.number} {c.title}
              </Link>
              {c.minutes != null && <span className="dashboard-completed-time">{formatMinutes(c.minutes)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
