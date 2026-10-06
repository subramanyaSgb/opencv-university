/** Strips simple inline markdown (bold/italic/code spans) for plain-text display, e.g. in the glossary. */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .trim();
}
