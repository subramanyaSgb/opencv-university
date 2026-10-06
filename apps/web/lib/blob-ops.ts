/** cv2.dnn.blobFromImage(WithParams) for one pixel (Chapter 8.7): optional R/B swap, subtract mean, multiply by scale. */
export interface BlobParams { scale: [number, number, number]; mean: [number, number, number]; swapRB: boolean }

export function blobPixel(bgr: [number, number, number], p: BlobParams) {
  const x = p.swapRB ? [bgr[2], bgr[1], bgr[0]] : [...bgr];
  const centred = x.map((v, i) => v - p.mean[i]);
  const out = centred.map((v, i) => v * p.scale[i]);
  return { ordered: x, centred, out };
}

export const PRESETS: { key: string; label: string; params: BlobParams; note: string }[] = [
  { key: "01", label: "0…1, RGB", params: { scale: [1 / 255, 1 / 255, 1 / 255], mean: [0, 0, 0], swapRB: true }, note: "scalefactor=1/255, swapRB=True: many detectors (YOLO-style)" },
  { key: "pm1", label: "−1…1, RGB", params: { scale: [1 / 127.5, 1 / 127.5, 1 / 127.5], mean: [127.5, 127.5, 127.5], swapRB: true }, note: "scalefactor=1/127.5, mean=127.5: MobileNet-style" },
  { key: "caffe", label: "Caffe BGR mean", params: { scale: [1, 1, 1], mean: [104, 117, 123], swapRB: false }, note: "scalefactor=1, mean=(104, 117, 123), BGR kept: classic Caffe models" },
  { key: "imagenet", label: "ImageNet mean/std", params: { scale: [1 / (255 * 0.229), 1 / (255 * 0.224), 1 / (255 * 0.225)], mean: [0.485 * 255, 0.456 * 255, 0.406 * 255], swapRB: true }, note: "per-channel scale and mean via Image2BlobParams: PyTorch/torchvision models" },
];

/** Blob shape for N images of channels c resized to (w, h): NCHW. */
export const blobShape = (n: number, c: number, w: number, h: number) => [n, c, h, w];
