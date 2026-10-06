import { test } from "node:test";
import assert from "node:assert/strict";
import { script, info, at, makeType } from "./mat-ops.ts";

// expected values from the C++ program in Chapter 8.2 (OpenCV core)
test("header copy shares, clone copies, ROI writes through", () => {
  const st = script();
  const roi = st[5].state; // after R.setTo(9)
  assert.equal(at(roi, "A", 0, 0), 7);
  assert.deepEqual([0, 1, 2, 3, 4].map((c) => at(roi, "A", 1, c)), [0, 9, 9, 9, 0]);
  assert.equal(at(roi, "C", 1, 1), 0);
  assert.deepEqual(info(roi, "R"), { empty: false, step: 5, continuous: false, offset: 6 });
  assert.equal(roi.bufs[0].refs, 3);
});

test("reference counting frees the buffer after the last release", () => {
  const st = script();
  assert.equal(st[7].state.bufs[0].refs, 2);
  assert.equal(st[7].state.bufs[0].freed, false);
  const last = st[st.length - 1].state;
  assert.equal(last.bufs[0].refs, 0);
  assert.equal(last.bufs[0].freed, true);
  assert.equal(last.bufs[1].refs, 1);
  assert.equal(at(last, "C", 2, 4), 5);
});

test("type numbers match cv2 constants", () => {
  assert.equal(makeType(0, 3), 16); // CV_8UC3
  assert.equal(makeType(5, 1), 5);  // CV_32FC1
  assert.equal(makeType(2, 3), 18); // CV_16UC3
  assert.equal(makeType(6, 3), 22); // CV_64FC3
});
