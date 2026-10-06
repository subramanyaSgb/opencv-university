"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseIndex } from "@/lib/course-types";
import { allChapters, findContinue, readProgress, type ProgressState } from "@/lib/progress";

export function HeroCTA({ course }: { course: CourseIndex }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  const chapters = allChapters(course);
  const next = progress ? findContinue(course, progress) : chapters[0];
  const started = Boolean(progress?.lastVisited);

  return (
    <div className="hero-ctas">
      {next && (
        <Link href={next.href} className="btn hero-cta-primary">
          {started ? "Continue" : `Start with ${next.number}`}
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      )}
      <a href="#curriculum" className="btn-ghost hero-cta-secondary">
        Browse curriculum
      </a>
    </div>
  );
}
