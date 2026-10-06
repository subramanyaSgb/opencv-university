import type { CourseIndex, ModuleRef, PartRef } from "./course-types";
import { allChapters } from "./progress.ts";

export interface CourseFacts {
  parts: number;
  modules: number;
  lessons: number;
  hours: number;
}

/** Course-wide counts for the home page facts strip: computed from content, never invented. */
export function courseFacts(course: CourseIndex): CourseFacts {
  const chapters = allChapters(course);
  const modules = course.parts.reduce((n, p) => n + p.modules.length, 0);
  const minutes = chapters.reduce((sum, c) => sum + (c.minutes ?? 0), 0);
  return {
    parts: course.parts.length,
    modules,
    lessons: chapters.length,
    hours: Math.round(minutes / 60),
  };
}

export interface ModuleFacts {
  lessonsAvailable: number;
  lessonsTotal: number;
  minutes: number;
}

export function moduleFacts(mod: ModuleRef): ModuleFacts {
  const available = mod.chapters.filter((c) => c.available);
  return {
    lessonsAvailable: available.length,
    lessonsTotal: mod.chapters.length,
    minutes: available.reduce((sum, c) => sum + (c.minutes ?? 0), 0),
  };
}

export interface PartFacts {
  modules: number;
  lessonsAvailable: number;
  lessonsTotal: number;
  minutes: number;
}

export function partFacts(part: PartRef): PartFacts {
  return part.modules.reduce<PartFacts>(
    (acc, mod) => {
      const f = moduleFacts(mod);
      return {
        modules: acc.modules + 1,
        lessonsAvailable: acc.lessonsAvailable + f.lessonsAvailable,
        lessonsTotal: acc.lessonsTotal + f.lessonsTotal,
        minutes: acc.minutes + f.minutes,
      };
    },
    { modules: 0, lessonsAvailable: 0, lessonsTotal: 0, minutes: 0 },
  );
}

/** "45 min" under an hour, "2h 15m" over -- never a bare, unlabelled number. */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
