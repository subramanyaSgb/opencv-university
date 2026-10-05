// Content linter: every chapter MDX must follow the chapter shape (see CLAUDE.md).
// Usage: npm run lint:content
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { lintChapter } from "./lib/chapter-lint.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const contentDir = join(root, "content");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name.startsWith("_")) return []; // templates are checked by unit tests
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
  });
}

let errors = 0;
const files = walk(contentDir);
for (const file of files) {
  const issues = lintChapter(readFileSync(file, "utf8"));
  const rel = relative(root, file);
  if (!issues.length) { console.log(`✓ ${rel}`); continue; }
  for (const i of issues) {
    if (i.level === "error") errors++;
    console.log(`${i.level === "error" ? "✗" : "!"} ${rel}: ${i.message}`);
  }
}
console.log(`\n${files.length} chapter file(s), ${errors} error(s).`);
process.exit(errors ? 1 : 0);
