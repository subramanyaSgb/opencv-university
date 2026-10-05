"use client";

import { useState } from "react";

export type TaskKind = "ip" | "cv" | "ml" | "dl";

export interface SortTask {
  task: string;
  answer: TaskKind;
  why: string;
}

const KINDS: { key: TaskKind; label: string }[] = [
  { key: "ip", label: "Image processing" },
  { key: "cv", label: "Computer vision" },
  { key: "ml", label: "Machine learning" },
  { key: "dl", label: "Deep learning" },
];

/** TaskSorter: the learner files each task under IP / CV / ML / DL and sees why. */
export function TaskSorter({ tasks, caption }: { tasks: SortTask[]; caption?: string }) {
  const [picked, setPicked] = useState<(TaskKind | null)[]>(() => tasks.map(() => null));
  const done = picked.filter((p) => p !== null).length;
  const right = picked.filter((p, i) => p === tasks[i].answer).length;

  return (
    <figure className="fig sorter">
      <ol className="sorter-list">
        {tasks.map((t, i) => {
          const p = picked[i];
          const ok = p === t.answer;
          return (
            <li key={t.task} className={`sorter-item${p ? (ok ? " is-ok" : " is-bad") : ""}`}>
              <div className="sorter-task">{t.task}</div>
              <div className="sorter-btns" role="group" aria-label={`Category for: ${t.task}`}>
                {KINDS.map((k) => (
                  <button
                    key={k.key}
                    type="button"
                    className={`sorter-btn k-${k.key}${p === k.key ? " is-on" : ""}${p && k.key === t.answer ? " is-answer" : ""}`}
                    aria-pressed={p === k.key}
                    onClick={() => setPicked(picked.map((x, j) => (j === i ? k.key : x)))}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              {p && (
                <div className="sorter-why" role="status">
                  <strong>{ok ? "Correct." : `Better: ${KINDS.find((k) => k.key === t.answer)!.label}.`}</strong> {t.why}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="quiz-summary" aria-live="polite">
        <span>
          {done} of {tasks.length} sorted{done ? ` · ${right} correct` : ""}
        </span>
        {done > 0 && (
          <button type="button" className="btn-ghost" onClick={() => setPicked(tasks.map(() => null))}>
            Reset
          </button>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
