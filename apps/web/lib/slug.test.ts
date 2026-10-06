import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, stripEmojiPrefix, textOf } from "./slug.ts";

test("textOf reads plain strings", () => {
  assert.equal(textOf("Common mistakes"), "Common mistakes");
});

test("slugify drops emoji and punctuation", () => {
  assert.equal(slugify("⚠️ Common mistakes"), "common-mistakes");
  assert.equal(slugify("1. What is an image?"), "1-what-is-an-image");
});

test("stripEmojiPrefix removes a leading emoji marker and its space", () => {
  assert.equal(stripEmojiPrefix("⚠️ Common mistakes"), "Common mistakes");
  assert.equal(stripEmojiPrefix("🔍 Go deeper"), "Go deeper");
  assert.equal(stripEmojiPrefix("✅ Check yourself"), "Check yourself");
});

test("stripEmojiPrefix leaves plain text untouched", () => {
  assert.equal(stripEmojiPrefix("1. What is an image?"), "1. What is an image?");
});

test("stripEmojiPrefix strips only the first string in an array of nodes", () => {
  assert.deepEqual(stripEmojiPrefix(["⚠️ Common ", "mistakes"]), ["Common ", "mistakes"]);
});
