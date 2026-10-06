import { test } from "node:test";
import assert from "node:assert/strict";
import { fix, needSwap, perceived } from "./order-ops.ts";

test("swap only when orders differ", () => {
  assert.equal(needSwap("BGR", "BGR"), false);
  assert.equal(needSwap("BGR", "RGB"), true);
  assert.deepEqual(perceived("BGR", "RGB"), [0, 0, 220]); // red looks blue
  assert.deepEqual(perceived("RGB", "RGB"), [220, 0, 0]);
  assert.equal(fix("BGR", "RGB"), "Convert first: cv2.cvtColor(img, cv2.COLOR_BGR2RGB) or img[..., ::-1]");
});
