"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CourseIndex } from "@/lib/course-types";
import { isComplete, readProgress, percent, type ProgressState } from "@/lib/progress";
import { partFacts, formatMinutes } from "@/lib/course-stats";

export function PartGrid({ course }: { course: CourseIndex }) {
  const [progress, setProgress] = useState<ProgressState>({ completed: [], lastVisited: null });

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  return (
    <div className="part-grid" id="curriculum">
      {course.parts.map((part) => {
        const facts = partFacts(part);
        const done = part.modules.flatMap((m) => m.chapters).filter((c) => c.available && isComplete(progress, c.href)).length;
        const pct = percent(done, facts.lessonsAvailable);
        return (
          <Link href={`/learn/${part.id}`} className="part-card" key={part.id}>
            <span className="part-card-letter">{part.letter}</span>
            <span className="part-card-title">{part.title}</span>
            <span className="part-card-stats">
              {facts.modules} modules &middot; {facts.lessonsAvailable} lessons
              {facts.minutes > 0 && <> &middot; {formatMinutes(facts.minutes)}</>}
            </span>
            <div className="progress-bar part-card-bar">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="part-card-count tabular-nums">
              {done}/{facts.lessonsAvailable}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
