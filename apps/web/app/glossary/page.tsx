import type { Metadata } from "next";
import Link from "next/link";
import { glossary } from "@/generated/content-index";
import { stripInlineMarkdown } from "@/lib/text";

export const metadata: Metadata = { title: "Glossary" };

/** Every term defined in the course (one per chapter's Definition block), built at compile time. */
export default function GlossaryPage() {
  const groups = new Map<string, typeof glossary>();
  for (const entry of glossary) {
    const letter = entry.term[0]?.toUpperCase() ?? "#";
    const key = /[A-Z]/.test(letter) ? letter : "#";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  const letters = [...groups.keys()].sort();

  return (
    <div className="lookup-page">
      <h1>Glossary</h1>
      <p className="lede">
        {glossary.length} terms, one per lesson, pulled straight from each lesson's own definition. Not a
        separate reference -- click through to read the full lesson.
      </p>
      <nav className="glossary-jump" aria-label="Jump to letter">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`}>
            {l}
          </a>
        ))}
      </nav>
      {letters.map((letter) => (
        <section key={letter} id={`letter-${letter}`} className="glossary-group">
          <h2>{letter}</h2>
          <dl>
            {groups.get(letter)!.map((entry) => (
              <div className="glossary-entry" key={entry.term}>
                <dt>{entry.term}</dt>
                <dd>
                  {stripInlineMarkdown(entry.definition)}{" "}
                  <Link href={entry.chapterHref} className="glossary-source">
                    {entry.chapterNumber} {entry.chapterTitle}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
