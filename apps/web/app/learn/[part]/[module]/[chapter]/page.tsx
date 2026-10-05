import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterLayout } from "@/components/chapter/ChapterLayout";
import { chapterLoaders, course } from "@/generated/content-index";

type Params = { part: string; module: string; chapter: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return course.parts.flatMap((p) =>
    p.modules.flatMap((m) =>
      m.chapters.filter((c) => c.available).map((c) => ({ part: p.id, module: m.id, chapter: c.slug })),
    ),
  );
}

function locate({ part, module: moduleId, chapter }: Params) {
  const p = course.parts.find((x) => x.id === part);
  const m = p?.modules.find((x) => x.id === moduleId);
  const i = m?.chapters.findIndex((x) => x.slug === chapter) ?? -1;
  if (!p || !m || i < 0) return null;
  return { part: p, module: m, prev: m.chapters[i - 1], next: m.chapters[i + 1] };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const ps = await params;
  const load = chapterLoaders[`${ps.part}/${ps.module}/${ps.chapter}`];
  if (!load) return {};
  const { meta } = await load();
  return { title: `${meta.number} ${meta.title}` };
}

export default async function ChapterPage({ params }: { params: Promise<Params> }) {
  const ps = await params;
  const load = chapterLoaders[`${ps.part}/${ps.module}/${ps.chapter}`];
  const where = locate(ps);
  if (!load || !where) notFound();
  const { default: Content, meta } = await load();
  return (
    <ChapterLayout meta={meta} {...where}>
      <Content />
    </ChapterLayout>
  );
}
