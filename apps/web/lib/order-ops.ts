// Which libraries produce and expect BGR or RGB, and whether a conversion is needed. For ColorOrderLab (Chapter 7.3). Unit-tested.

export type Order = "BGR" | "RGB";
export const PRODUCERS: { k: string; label: string; order: Order }[] = [
  { k: "imread", label: "cv2.imread / cv2.VideoCapture", order: "BGR" },
  { k: "pil", label: "Pillow: np.array(Image.open(…))", order: "RGB" },
  { k: "mpl", label: "matplotlib / imageio / scikit-image imread", order: "RGB" },
  { k: "sdk-bgr", label: "Camera SDK, pixel format BGR8", order: "BGR" },
  { k: "sdk-rgb", label: "Camera SDK, pixel format RGB8", order: "RGB" },
];
export const CONSUMERS: { k: string; label: string; expects: Order }[] = [
  { k: "imshow", label: "cv2.imshow / cv2.imwrite", expects: "BGR" },
  { k: "cvt", label: "cv2.cvtColor(img, COLOR_BGR2HSV / GRAY / Lab)", expects: "BGR" },
  { k: "plt", label: "plt.imshow / Image.fromarray(…).save", expects: "RGB" },
  { k: "model", label: "a deep-learning model trained on RGB", expects: "RGB" },
  { k: "draw", label: "cv2.rectangle(img, …, color=(0, 0, 255))", expects: "BGR" },
];

export function needSwap(from: Order, to: Order): boolean { return from !== to; }

/** What a pure red object (R 220) looks like to the consumer, as an RGB triple for display. */
export function perceived(from: Order, to: Order): [number, number, number] {
  return needSwap(from, to) ? [0, 0, 220] : [220, 0, 0];
}

export function fix(from: Order, to: Order): string {
  if (!needSwap(from, to)) return "No conversion needed.";
  return `Convert first: cv2.cvtColor(img, cv2.COLOR_${from}2${to}) or img[..., ::-1]`;
}
