import type { ChapterRef, CourseIndex, ModuleRef, PartRef } from "./course-types";

export interface BreadcrumbLocation {
  part: PartRef;
  module: ModuleRef;
  chapter: ChapterRef;
}

/** Finds the part/module/chapter for a `/learn/...` pathname, or null off the course. */
export function locateBreadcrumb(course: CourseIndex, pathname: string): BreadcrumbLocation | null {
  for (const part of course.parts) {
    for (const mod of part.modules) {
      const chapter = mod.chapters.find((c) => c.href === pathname);
      if (chapter) return { part, module: mod, chapter };
    }
  }
  return null;
}
