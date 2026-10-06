import { test } from "node:test";
import assert from "node:assert/strict";
import { extractDefinition, extractMinutes } from "./build-content-index.mjs";

test("extractMinutes reads minutes from a meta export", () => {
  const src = `export const meta = {\n  number: "1.1",\n  title: "X",\n  minutes: 40,\n  objectives: [],\n};\n`;
  assert.equal(extractMinutes(src), 40);
});

test("extractMinutes returns undefined when there is no meta export", () => {
  assert.equal(extractMinutes("# Just a heading\n"), undefined);
});

test("extractMinutes is not confused by a later unrelated object with its own fields", () => {
  const src = `export const meta = {\n  minutes: 25,\n};\nconst other = { minutes: 999 };\n`;
  assert.equal(extractMinutes(src), 25);
});

test("extractDefinition reads the term and body", () => {
  const src = `# 1.1 Title\n\n<Definition term="Eigenvector">a direction that a matrix only stretches.</Definition>\n\nMore text.\n`;
  assert.deepEqual(extractDefinition(src), { term: "Eigenvector", definition: "a direction that a matrix only stretches." });
});

test("extractDefinition returns undefined when there is no Definition block", () => {
  assert.equal(extractDefinition("# Just a heading\n"), undefined);
});
