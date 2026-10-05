import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lintChapter, parseChapter, TAIL_SECTIONS } from "./lib/chapter-lint.mjs";

const template = readFileSync(new URL("../content/_templates/chapter.mdx", import.meta.url), "utf8")
  .replace("# n.m Chapter title", "# 9.9 Chapter title");
const errors = (src) => lintChapter(src).filter((i) => i.level === "error").map((i) => i.message);

test("template: 2 lesson sections, mini exercise, 8 reference sections", () => {
  assert.equal(TAIL_SECTIONS.length, 8);
  assert.equal(parseChapter(template).sections.length, 2 + 1 + 8);
});

test("the chapter template passes the linter", () => {
  assert.deepEqual(errors(template), []);
});

test("a missing reference section is reported", () => {
  assert.match(errors(template.replace("## Where it fails", "## Limits")).join("\n"), /missing section "## Where it fails"/);
});

test("lesson numbering must be consecutive", () => {
  assert.match(errors(template.replace("## 2. Second idea", "## 3. Second idea")).join("\n"), /should be numbered 2/);
});

test("a chapter without lesson sections is reported", () => {
  const noLesson = template.replace("## 1. First idea", "First idea").replace("## 2. Second idea", "Second idea");
  assert.ok(errors(noLesson).some((m) => /no lesson sections/.test(m)));
});

test("headings inside code fences are ignored", () => {
  assert.deepEqual(errors(template.replace("## Code\n", "## Code\n\n```python\n## not a heading\n```\n")), []);
});

test("reference sections out of order are reported", () => {
  const a = "## Where it fails", b = "## OpenCV API notes";
  const swapped = template.replace(a, "@@A").replace(b, a).replace("@@A", b);
  assert.ok(errors(swapped).some((m) => /out of order/.test(m)));
});
