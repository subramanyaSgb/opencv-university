"use client";

import { useId, useState, type ReactNode } from "react";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  /** Why the answer is right (and the others are not). */
  explanation: string;
}

export interface QuizProps {
  questions: QuizQuestion[];
}

/** Renders `inline code` in quiz strings. */
function rich(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part,
  );
}

/**
 * Quiz: multiple-choice questions with an explanation after each check.
 * Results stay in the page for now; saving per user arrives with the Phase 2 backend.
 */
export function Quiz({ questions }: QuizProps) {
  const id = useId();
  const empty = () => questions.map(() => null as number | null);
  const [picked, setPicked] = useState<(number | null)[]>(empty);
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));

  const done = checked.every(Boolean);
  const score = questions.filter((q, i) => checked[i] && picked[i] === q.answer).length;

  const reset = () => {
    setPicked(empty());
    setChecked(questions.map(() => false));
  };

  return (
    <div className="quiz">
      {questions.map((q, qi) => {
        const isChecked = checked[qi];
        const correct = picked[qi] === q.answer;
        return (
          <fieldset key={qi} className="quiz-q" disabled={isChecked}>
            <legend>
              <span className="quiz-n">Q{qi + 1}.</span> {rich(q.question)}
            </legend>
            <div className="quiz-options">
              {q.options.map((opt, oi) => {
                const state = !isChecked
                  ? ""
                  : oi === q.answer
                    ? " is-correct"
                    : oi === picked[qi]
                      ? " is-wrong"
                      : "";
                return (
                  <label key={oi} className={`quiz-opt${state}`}>
                    <input
                      type="radio"
                      name={`${id}-q${qi}`}
                      checked={picked[qi] === oi}
                      onChange={() => setPicked(picked.map((p, i) => (i === qi ? oi : p)))}
                    />
                    <span>{rich(opt)}</span>
                  </label>
                );
              })}
            </div>
            {!isChecked ? (
              <button
                type="button"
                className="btn"
                disabled={picked[qi] === null}
                onClick={() => setChecked(checked.map((c, i) => (i === qi ? true : c)))}
              >
                Check answer
              </button>
            ) : (
              <div className={`quiz-feedback ${correct ? "ok" : "bad"}`} role="status">
                <strong>{correct ? "Correct." : `Not quite. The answer is: ${q.options[q.answer]}.`}</strong>{" "}
                {rich(q.explanation)}
              </div>
            )}
          </fieldset>
        );
      })}
      <div className="quiz-summary" aria-live="polite">
        {done ? (
          <>
            <span>
              Score: <strong>{score}</strong> of {questions.length}
              {score === questions.length ? ". Well done." : ". Re-read the sections above, then try again."}
            </span>
            <button type="button" className="btn-ghost" onClick={reset}>
              Try again
            </button>
          </>
        ) : (
          <span>
            {checked.filter(Boolean).length} of {questions.length} answered
          </span>
        )}
      </div>
    </div>
  );
}
