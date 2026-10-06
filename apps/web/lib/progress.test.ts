import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allChapters,
  countComplete,
  findContinue,
  isComplete,
  percent,
  setLastVisited,
  toggleComplete,
  type ProgressState,
} from "./progress.ts";
import type { CourseIndex } from "./course-types.ts";

const course: CourseIndex = {
  title: "Test course",
  parts: [
    {
      id: "part-a",
      letter: "A",
      title: "Foundations",
      modules: [
        {
          id: "01-intro",
          number: 1,
          title: "Intro",
          summary: "",
          chapters: [
            { number: "1.1", slug: "1.1", title: "One", href: "/learn/a/1/1.1", available: true },
            { number: "1.2", slug: "1.2", title: "Two", href: "/learn/a/1/1.2", available: true },
            { number: "1.3", slug: "1.3", title: "Three", href: "/learn/a/1/1.3", available: false },
          ],
        },
      ],
    },
  ],
};

const empty: ProgressState = { completed: [], lastVisited: null };

test("toggleComplete adds then removes", () => {
  const added = toggleComplete(empty, "/a");
  assert.equal(isComplete(added, "/a"), true);
  const removed = toggleComplete(added, "/a");
  assert.equal(isComplete(removed, "/a"), false);
});

test("allChapters excludes unavailable chapters", () => {
  assert.deepEqual(
    allChapters(course).map((c) => c.href),
    ["/learn/a/1/1.1", "/learn/a/1/1.2"],
  );
});

test("countComplete and percent", () => {
  const state = toggleComplete(empty, "/learn/a/1/1.1");
  const chapters = allChapters(course);
  assert.equal(countComplete(state, chapters), 1);
  assert.equal(percent(1, 2), 50);
  assert.equal(percent(0, 0), 0);
});

test("findContinue resumes an incomplete last-visited chapter", () => {
  const state = setLastVisited(empty, "/learn/a/1/1.2");
  const next = findContinue(course, state);
  assert.equal(next?.href, "/learn/a/1/1.2");
});

test("findContinue falls back to the first incomplete chapter", () => {
  let state = toggleComplete(empty, "/learn/a/1/1.1");
  state = setLastVisited(state, "/learn/a/1/1.1");
  const next = findContinue(course, state);
  assert.equal(next?.href, "/learn/a/1/1.2");
});

test("findContinue returns null when every chapter is complete", () => {
  let state = toggleComplete(empty, "/learn/a/1/1.1");
  state = toggleComplete(state, "/learn/a/1/1.2");
  assert.equal(findContinue(course, state), null);
});
