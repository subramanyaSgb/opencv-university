import { Children, isValidElement, type ReactNode } from "react";

/** Plain text of a React node tree (used for heading ids). */
export function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return Children.toArray(node).map(textOf).join("");
}

/** "⚠️ Common mistakes" -> "common-mistakes" */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EMOJI_PREFIX = /^[\p{Extended_Pictographic}‍️]+\s*/u;

/**
 * Strips a leading emoji marker from heading display text (content still authors
 * "⚠️ Common mistakes" per the writing-style convention; this is presentation only).
 */
export function stripEmojiPrefix<T>(node: T): T {
  if (typeof node === "string") return node.replace(EMOJI_PREFIX, "") as T;
  if (Array.isArray(node) && typeof node[0] === "string") {
    return [node[0].replace(EMOJI_PREFIX, ""), ...node.slice(1)] as T;
  }
  return node;
}
