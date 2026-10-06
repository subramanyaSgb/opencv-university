import type { ChapterRef, CourseIndex } from "./course-types";

export interface ProgressState {
  completed: string[];
  lastVisited: string | null;
}

const STORAGE_KEY = "ocu-progress";
const EMPTY: ProgressState = { completed: [], lastVisited: null };

function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.completed) && v.completed.every((x) => typeof x === "string") &&
    (v.lastVisited === null || typeof v.lastVisited === "string");
}

export function readProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return isProgressState(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function writeProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, etc.): the in-memory choice still applies this session
  }
}

export function isComplete(state: ProgressState, href: string): boolean {
  return state.completed.includes(href);
}

export function toggleComplete(state: ProgressState, href: string): ProgressState {
  return isComplete(state, href)
    ? { ...state, completed: state.completed.filter((h) => h !== href) }
    : { ...state, completed: [...state.completed, href] };
}

export function setLastVisited(state: ProgressState, href: string): ProgressState {
  return { ...state, lastVisited: href };
}

export function allChapters(course: CourseIndex): ChapterRef[] {
  return course.parts.flatMap((p) => p.modules.flatMap((m) => m.chapters)).filter((c) => c.available);
}

export function countComplete(state: ProgressState, chapters: ChapterRef[]): number {
  return chapters.filter((c) => isComplete(state, c.href)).length;
}

export function percent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

/** The chapter to resume: the last one visited if still incomplete, else the first incomplete chapter. */
export function findContinue(course: CourseIndex, state: ProgressState): ChapterRef | null {
  const chapters = allChapters(course);
  if (chapters.length === 0) return null;
  const last = state.lastVisited ? chapters.find((c) => c.href === state.lastVisited) : undefined;
  if (last && !isComplete(state, last.href)) return last;
  return chapters.find((c) => !isComplete(state, c.href)) ?? null;
}
