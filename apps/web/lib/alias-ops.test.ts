import { test } from "node:test";
import assert from "node:assert/strict";
import { aliasFrequency, nyquist } from "./alias-ops.ts";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

test("Code example 2: at 1 sample per pixel, 0.6 → 0.4, 0.8 → 0.2, 1.0 → 0, 1.2 → 0.2", () => {
  close(aliasFrequency(0.6, 1), 0.4);
  close(aliasFrequency(0.8, 1), 0.2);
  close(aliasFrequency(1.0, 1), 0);
  close(aliasFrequency(1.2, 1), 0.2);
  close(aliasFrequency(0.3, 1), 0.3);
});

test("Nyquist is half the sampling rate", () => {
  assert.equal(nyquist(10), 5);
});
