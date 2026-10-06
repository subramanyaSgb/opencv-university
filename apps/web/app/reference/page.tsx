import type { Metadata } from "next";
import Link from "next/link";
import { course } from "@/generated/content-index";
import { allChapters } from "@/lib/progress";

export const metadata: Metadata = { title: "Quick reference" };

/**
 * An index into every lesson's own "OpenCV API notes" section -- not a separate
 * cheat sheet. We don't synthesize API summaries here; each lesson's notes are
 * already checked against the pinned OpenCV build, so this just points at them.
 */
export default function ReferencePage() {
  const chapters = allChapters(course);
  return (
    <div className="lookup-page">
      <h1>Quick reference</h1>
      <p className="lede">
        Every lesson ends with an "OpenCV API notes" section: signature, parameters, dtype/channels, output,
        defaults, speed tips -- checked against the pinned OpenCV build. This page is an index into those
        sections, grouped by part, not a separate summary.
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
                  <Link href={`${c.href}#opencv-api-notes`}>
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
