import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { course } from "@/generated/content-index";
import { moduleFacts, partFacts, formatMinutes } from "@/lib/course-stats";

type Params = { part: string };

export function generateStaticParams(): Params[] {
  return course.parts.map((p) => ({ part: p.id }));
}

function locate(partId: string) {
  return course.parts.find((p) => p.id === partId) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const part = locate((await params).part);
  return part ? { title: `Part ${part.letter}: ${part.title}` } : {};
}

export default async function PartPage({ params }: { params: Promise<Params> }) {
  const part = locate((await params).part);
  if (!part) notFound();
  const facts = partFacts(part);

  return (
    <div className="lookup-page part-page">
      <p className="eyebrow">Part {part.letter}</p>
      <h1>{part.title}</h1>
      <p className="facts-strip">
        {facts.modules} modules &middot; {facts.lessonsAvailable} of {facts.lessonsTotal} lessons available
        {facts.minutes > 0 && <> &middot; {formatMinutes(facts.minutes)}</>}
      </p>

      <div className="table-wrap">
        <table className="part-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Module</th>
              <th>Lessons</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {part.modules.map((mod) => {
              const mf = moduleFacts(mod);
              const status = mf.lessonsAvailable === 0 ? "Coming soon" : mf.lessonsAvailable < mf.lessonsTotal ? "In progress" : "Available";
              const firstAvailable = mod.chapters.find((c) => c.available);
              return (
                <tr key={mod.id}>
                  <td className="tabular-nums">{mod.number}</td>
                  <td>
                    {firstAvailable ? (
                      <Link href={firstAvailable.href}>{mod.title}</Link>
                    ) : (
                      <span>{mod.title}</span>
                    )}
                  </td>
                  <td className="tabular-nums">
                    {mf.lessonsAvailable}/{mf.lessonsTotal}
                  </td>
                  <td className="tabular-nums">{mf.minutes > 0 ? formatMinutes(mf.minutes) : "--"}</td>
                  <td>
                    <span className={`status-tag${status === "Available" ? " is-available" : status === "In progress" ? " is-progress" : ""}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
