"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseIndex } from "@/lib/course-types";
import { allChapters, countComplete, findContinue, percent, readProgress, type ProgressState } from "@/lib/progress";

export function ContinueCard({ course }: { course: CourseIndex }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  const chapters = allChapters(course);
  const done = progress ? countComplete(progress, chapters) : 0;
  const pct = percent(done, chapters.length);
  const next = progress ? findContinue(course, progress) : chapters[0];

  return (
    <div className="continue-card">
      <div className="continue-progress">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="continue-pct">
          {done} of {chapters.length} lessons · {pct}%
        </span>
      </div>
      {next ? (
        <Link href={next.href} className="btn continue-btn">
          {progress?.lastVisited ? "Continue learning" : "Start the course"}
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      ) : (
        <span className="continue-done">All available lessons complete.</span>
      )}
    </div>
  );
}
