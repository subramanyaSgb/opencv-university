import { test } from "node:test";
import assert from "node:assert/strict";
import { blobPixel, PRESETS, blobShape } from "./blob-ops.ts";

const close = (a: number[], b: number[], tol = 1e-5) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < tol, `${v} vs ${b[i]}`));

// expected values from cv2.dnn.blobFromImage / blobFromImageWithParams 4.13.0 on a BGR pixel (10, 20, 30)
test("mean is applied after the swap", () => {
  close(blobPixel([10, 20, 30], { scale: [0.5, 0.5, 0.5], mean: [1, 2, 3], swapRB: true }).out, [14.5, 9, 3.5]);
  close(blobPixel([10, 20, 30], { scale: [0.5, 0.5, 0.5], mean: [1, 2, 3], swapRB: false }).out, [4.5, 9, 13.5]);
});

test("ImageNet preset matches Image2BlobParams", () => {
  const p = PRESETS.find((x) => x.key === "imagenet")!.params;
  close(blobPixel([10, 20, 30], p).out, [-1.6041614, -1.6855743, -1.6301525]);
});

test("NCHW shape", () => {
  assert.deepEqual(blobShape(1, 3, 64, 48), [1, 3, 48, 64]);
});
