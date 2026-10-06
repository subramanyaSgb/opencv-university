"use client";

import { useEffect, useState } from "react";

/** Thin bar at the top of a lesson showing how far through the article the reader has scrolled. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const article = document.querySelector("article.chapter");
    if (!article) return;
    const onScroll = () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      setPct(total <= 0 ? 0 : Math.min(100, Math.max(0, (scrolled / total) * 100)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="reading-progress" role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="reading-progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
