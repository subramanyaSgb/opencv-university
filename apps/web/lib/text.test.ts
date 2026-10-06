import { test } from "node:test";
import assert from "node:assert/strict";
import { stripInlineMarkdown } from "./text.ts";

test("strips bold", () => {
  assert.equal(stripInlineMarkdown("a **bold** word"), "a bold word");
});

test("strips inline code backticks", () => {
  assert.equal(stripInlineMarkdown("call `cv2.imread()` first"), "call cv2.imread() first");
});

test("strips italics without eating bold markers", () => {
  assert.equal(stripInlineMarkdown("**bold** and *italic*"), "bold and italic");
});

test("leaves plain text untouched", () => {
  assert.equal(stripInlineMarkdown("a direction that a matrix only stretches"), "a direction that a matrix only stretches");
});
