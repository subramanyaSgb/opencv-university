import { test } from "node:test";
import assert from "node:assert/strict";
import { locateBreadcrumb } from "./breadcrumb.ts";
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
          chapters: [{ number: "1.1", slug: "1.1", title: "One", href: "/learn/a/1/1.1", available: true }],
        },
      ],
    },
  ],
};

test("locates the part/module/chapter for a chapter href", () => {
  const loc = locateBreadcrumb(course, "/learn/a/1/1.1");
  assert.equal(loc?.part.id, "part-a");
  assert.equal(loc?.module.id, "01-intro");
  assert.equal(loc?.chapter.slug, "1.1");
});

test("returns null for a path outside the course", () => {
  assert.equal(locateBreadcrumb(course, "/"), null);
});
