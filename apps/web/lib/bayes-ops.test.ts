import { test } from "node:test";
import assert from "node:assert/strict";
import { afterAlarms, counts, posterior } from "./bayes-ops.ts";

const near = (a: number, b: number, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} vs ${b}`);

test("the chapter's example: 0.1 % defects, 99 % detection, 2 % false alarms", () => {
  const p = posterior(0.001, 0.99, 0.02);
  near(p.pAlarm, 0.02097, 1e-9);
  assert.equal(Math.round(p.defectGivenAlarm * 1000) / 1000, 0.047);
  const c = counts(100000, 0.001, 0.99, 0.02);
  near(c.tp, 99, 1e-9); near(c.fn, 1, 1e-9); near(c.fp, 1998, 1e-9);
});

test("two independent alarms: 0.710", () => {
  assert.equal(Math.round(afterAlarms(0.001, 0.99, 0.02, 2) * 1000) / 1000, 0.71);
  near(afterAlarms(0.001, 0.99, 0.02, 0), 0.001);
});

test("a passed part is very likely good", () => {
  const p = posterior(0.001, 0.99, 0.02);
  assert.ok(p.defectGivenPass < 2e-5);
});
