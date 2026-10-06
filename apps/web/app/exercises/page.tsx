import type { Metadata } from "next";
import Link from "next/link";
import { course } from "@/generated/content-index";
import { allChapters } from "@/lib/progress";

export const metadata: Metadata = { title: "Exercises" };

/** An index into every lesson's own Exercises section -- 2 to 4 per lesson, at least one coding. */
export default function ExercisesPage() {
  const chapters = allChapters(course);
  return (
    <div className="lookup-page">
      <h1>Exercises</h1>
      <p className="lede">
        Every lesson ends with 2 to 4 exercises, at least one of them coding, answers inside a solution
        toggle. This page is an index into those sections.
      </p>
      {course.parts.map((part) => {
        const partChapters = chapters.filter((c) => part.modules.some((m) => m.chapters.includes(c)));
        if (partChapters.length === 0) return null;
        return (
          <section key={part.id} className="reference-part">
            <h2>
              Part {part.letter}: {part.title}
            </h2>
            <ul className="reference-list">
              {partChapters.map((c) => (
                <li key={c.slug}>
                  <Link href={`${c.href}#exercises`}>
                    {c.number} {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
