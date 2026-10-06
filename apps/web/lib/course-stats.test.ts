import { test } from "node:test";
import assert from "node:assert/strict";
import { courseFacts, formatMinutes, moduleFacts, partFacts } from "./course-stats.ts";
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
            { number: "1.1", slug: "1.1", title: "One", href: "/a/1.1", available: true, minutes: 40 },
            { number: "1.2", slug: "1.2", title: "Two", href: "/a/1.2", available: true, minutes: 20 },
            { number: "1.3", slug: "1.3", title: "Three", href: "/a/1.3", available: false },
          ],
        },
      ],
    },
    {
      id: "part-b",
      letter: "B",
      title: "More",
      modules: [
        {
          id: "02-more",
          number: 2,
          title: "More",
          summary: "",
          chapters: [{ number: "2.1", slug: "2.1", title: "X", href: "/b/2.1", available: true, minutes: 30 }],
        },
      ],
    },
  ],
};

test("courseFacts counts only available chapters and sums their minutes to hours", () => {
  const facts = courseFacts(course);
  assert.equal(facts.parts, 2);
  assert.equal(facts.modules, 2);
  assert.equal(facts.lessons, 3);
  assert.equal(facts.hours, Math.round((40 + 20 + 30) / 60));
});

test("moduleFacts counts available vs total lessons separately", () => {
  const f = moduleFacts(course.parts[0].modules[0]);
  assert.equal(f.lessonsAvailable, 2);
  assert.equal(f.lessonsTotal, 3);
  assert.equal(f.minutes, 60);
});

test("partFacts aggregates across all modules in a part", () => {
  const f = partFacts(course.parts[0]);
  assert.equal(f.modules, 1);
  assert.equal(f.lessonsAvailable, 2);
  assert.equal(f.lessonsTotal, 3);
  assert.equal(f.minutes, 60);
});

test("formatMinutes", () => {
  assert.equal(formatMinutes(0), "0 min");
  assert.equal(formatMinutes(45), "45 min");
  assert.equal(formatMinutes(60), "1h");
  assert.equal(formatMinutes(135), "2h 15m");
});
