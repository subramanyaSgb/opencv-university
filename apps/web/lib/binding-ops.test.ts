import { test } from "node:test";
import assert from "node:assert/strict";
import { lookup, matType, FUNCS, DTYPES, SHAPES, LAYOUTS } from "./binding-ops.ts";

// values recorded from opencv-python-headless 4.13.0.92 (see binding-data.ts)
test("every combination has a recorded result", () => {
  for (const f of FUNCS) for (const d of DTYPES) for (const s of SHAPES) for (const l of LAYOUTS) assert.ok(lookup(f, d, s, l), `${f}|${d}|${s}|${l}`);
});

test("known outcomes", () => {
  assert.deepEqual(lookup("GaussianBlur 3×3", "uint8", "(h, w, 3)", "transposed (a.T)"), { ok: true, result: "(6, 8, 3) uint8" });
  assert.equal(lookup("GaussianBlur 3×3", "uint8", "(h, w, 1)", "contiguous")!.ok && lookup("GaussianBlur 3×3", "uint8", "(h, w, 1)", "contiguous")!.ok === true, true);
  const c = lookup("Canny", "float32", "(h, w)", "contiguous");
  assert.equal(c!.ok, false);
  assert.match((c as { error: string }).error, /CV_8U/);
  const r = lookup("rectangle (draws in place)", "uint8", "(h, w, 3)", "every 2nd column (a[:, ::2])");
  assert.equal(r!.ok, false);
  assert.match((r as { error: string }).error, /Layout of the output array/);
  assert.equal(lookup("cvtColor BGR→GRAY", "uint8", "(h, w, 4)", "contiguous")!.ok, true);
});

test("Mat types built from arrays", () => {
  assert.deepEqual(matType("uint8", "(h, w, 3)"), { name: "CV_8UC3", number: 16, converted: false });
  assert.deepEqual(matType("int64", "(h, w)"), { name: "CV_32SC1", number: 4, converted: true });
  assert.equal(matType("bool", "(h, w)"), null);
});
