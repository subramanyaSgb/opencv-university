import { test } from "node:test";
import assert from "node:assert/strict";
import { explain, FILES, FLAGS, TABLE } from "./imread-table.ts";

test("table is complete", () => {
  for (const f of Object.keys(FILES) as (keyof typeof FILES)[]) for (const g of FLAGS) assert.ok(TABLE[f][g], `${f} ${g}`);
});

test("key facts measured on OpenCV 4.13.0", () => {
  assert.deepEqual(TABLE["gray16.png"]["IMREAD_COLOR (default)"], [[200, 320, 3], "uint8", 15]);
  assert.deepEqual(TABLE["alpha.png"].IMREAD_UNCHANGED[0], [200, 320, 4]);
  assert.deepEqual(TABLE["rotated.jpg"].IMREAD_UNCHANGED[0], [200, 320, 3]); // UNCHANGED ignores orientation
  assert.ok(explain("rotated.jpg", "IMREAD_COLOR (default)").includes("rotated"));
});
