import Link from "next/link";
import { course } from "@/generated/content-index";

// Minimal course listing for Phase 0. The full course map with progress is Phase 1.
export default function Home() {
  return (
    <div className="home">
      <h1>{course.title}</h1>
      <p className="lede">
        Image processing and computer vision with OpenCV, from absolute zero to production level. Simple first,
        then deep.
      </p>
      {course.parts.map((part) => (
        <section key={part.id} className="home-part">
          <h2>
            Part {part.letter}: {part.title}
          </h2>
          {part.modules.map((m) => (
            <div key={m.id} className="home-module">
              <h3>
                {m.number}. {m.title}
              </h3>
              <p>{m.summary}</p>
              <ol className="home-chapters">
                {m.chapters.map((ch) => (
                  <li key={ch.slug}>
                    <span className="ch-num">{ch.number}</span>
                    {ch.available ? (
                      <Link href={ch.href}>{ch.title}</Link>
                    ) : (
                      <span className="ch-soon">
                        {ch.title} <em>coming soon</em>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
