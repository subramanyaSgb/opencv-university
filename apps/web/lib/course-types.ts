export interface ChapterRef {
  number: string;
  slug: string;
  title: string;
  href: string;
  available: boolean;
  /** Minutes to complete, read from the chapter's own `meta.minutes`. Absent if unavailable. */
  minutes?: number;
}

export interface ModuleRef {
  id: string;
  number: number;
  title: string;
  summary: string;
  chapters: ChapterRef[];
}

export interface PartRef {
  id: string;
  letter: string;
  title: string;
  modules: ModuleRef[];
}

export interface CourseIndex {
  title: string;
  parts: PartRef[];
}

/** The `export const meta` object at the top of every chapter MDX file. */
export interface ChapterMeta {
  number: string;
  title: string;
  minutes: number;
  objectives: string[];
}

/** One `<Definition term="...">...</Definition>` pulled from its chapter at build time. */
export interface GlossaryEntry {
  term: string;
  definition: string;
  chapterNumber: string;
  chapterTitle: string;
  chapterHref: string;
}
