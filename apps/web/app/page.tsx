import Link from "next/link";
import { BarChart3, BookOpen, Code2, Compass, Library, SquareCheckBig } from "lucide-react";
import { course } from "@/generated/content-index";
import { HeroCTA } from "@/components/home/HeroCTA";
import { PartGrid } from "@/components/home/PartGrid";
import { courseFacts } from "@/lib/course-stats";

const STUDY_TOOLS = [
  { href: "/progress", label: "Progress", desc: "Totals, per-part completion, last lesson", Icon: BarChart3 },
  { href: "/glossary", label: "Glossary", desc: "Every term defined in the course", Icon: Library },
  { href: "/reference", label: "Quick reference", desc: "Index into every OpenCV API notes section", Icon: Compass },
  { href: "/exercises", label: "Exercises", desc: "Index into every lesson's exercises", Icon: SquareCheckBig },
];

const HOW_IT_WORKS = [
  { n: 1, title: "Learn the idea", desc: "Plain-language definition, an analogy, a worked example on a tiny image you can do by hand.", Icon: BookOpen },
  { n: 2, title: "Run the code", desc: "NumPy from scratch first, then the OpenCV call -- every parameter explained, real output pasted in.", Icon: Code2 },
  { n: 3, title: "Check yourself", desc: "A short quiz and 2 to 4 exercises per lesson, at least one of them coding.", Icon: SquareCheckBig },
];

export default function Home() {
  const facts = courseFacts(course);
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">Internal training &middot; Phase 0 &middot; v0.1 &middot; Updated {updated}</p>
        <h1>{course.title}</h1>
        <p className="lede">
          Image processing and computer vision with OpenCV, from absolute zero to production level. Simple
          first, then deep. Python basics are assumed; nothing else is.
        </p>
        <HeroCTA course={course} />
        <p className="facts-strip">
          {facts.lessons} lessons &middot; {facts.modules} chapters &middot; {facts.parts} parts &middot; ~
          {facts.hours}h &middot; exercises in every lesson
        </p>
      </section>

      <section className="how-it-works">
        <h2 className="section-label">How this course works</h2>
        <div className="how-it-works-grid">
          {HOW_IT_WORKS.map((step) => (
            <div className="how-step" key={step.n}>
              <step.Icon size={20} strokeWidth={1.75} className="how-step-icon" aria-hidden="true" />
              <span className="how-step-n tabular-nums">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-label">Curriculum</h2>
        <PartGrid course={course} />
      </section>

      <section className="study-tools">
        <h2 className="section-label">Study tools</h2>
        <div className="study-tools-grid">
          {STUDY_TOOLS.map((tool) => (
            <Link href={tool.href} className="study-tool" key={tool.href}>
              <tool.Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="study-tool-label">{tool.label}</span>
              <span className="study-tool-desc">{tool.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <nav className="home-footer-links" aria-label="Footer">
          <Link href="/learn/part-a">Part A: Foundations</Link>
          <Link href="/glossary">Glossary</Link>
          <Link href="/reference">Quick reference</Link>
          <Link href="/styleguide">Styleguide</Link>
        </nav>
        <p className="sg-note">OpenCV University &middot; v0.1 &middot; Updated {updated}</p>
      </footer>
    </div>
  );
}
