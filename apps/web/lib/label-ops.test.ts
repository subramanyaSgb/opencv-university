import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { label, stats } from "./label-ops.ts";

const R = JSON.parse(readFileSync(new URL("./label-ref.json", import.meta.url), "utf8"));

// OpenCV's block-based algorithms number components in a slightly different order; compare the partitions and the statistics.
test("components and stats equal cv2.connectedComponentsWithStats up to label order (4 and 8 connectivity)", () => {
  for (const c of [4, 8] as const) {
    const { labels, n } = label(R.crop, 160, 100, c), ref: number[] = R[`l${c}`];
    assert.equal(n, R[`n${c}`]);
    const map = new Map<number, number>();
    labels.forEach((v, i) => { const r = ref[i]; if (map.has(v)) assert.equal(map.get(v), r); else map.set(v, r); });
    assert.equal(new Set(map.values()).size, map.size, "one-to-one");
    const st = stats(labels, n, 160, 100);
    st.forEach((s, i) => {
      const j = map.get(i)!;
      assert.deepEqual([s.x, s.y, s.w, s.h, s.area], R[`st${c}`][j]);
      assert.ok(Math.abs(s.cx - R[`ce${c}`][j][0]) < 1e-9 && Math.abs(s.cy - R[`ce${c}`][j][1]) < 1e-9);
    });
  }
});
