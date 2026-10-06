"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { isComplete, readProgress, setLastVisited, toggleComplete, writeProgress } from "@/lib/progress";

export function MarkComplete({ href }: { href: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const progress = setLastVisited(readProgress(), href);
    writeProgress(progress);
    setDone(isComplete(progress, href));
  }, [href]);

  const toggle = () => {
    const next = toggleComplete(readProgress(), href);
    writeProgress(next);
    setDone(isComplete(next, href));
  };

  return (
    <button type="button" className={`mark-complete${done ? " is-done" : ""}`} onClick={toggle} aria-pressed={done}>
      <Check size={16} strokeWidth={2.25} aria-hidden="true" />
      {done ? "Completed" : "Mark as complete"}
    </button>
  );
}
