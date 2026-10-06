/** Simplified memory model for Chapter 8.8: eager (one full image per intermediate) vs Fluid (a few lines per stage). */
export interface Stage { key: string; label: string; rows: number; gapi: string; reduce?: boolean }

export const STAGES: Stage[] = [
  { key: "diff", label: "absDiff(ref, test)", rows: 1, gapi: "cv2.gapi.absDiff" },
  { key: "blur", label: "blur 5 × 5", rows: 5, gapi: "cv2.gapi.blur" },
  { key: "thr", label: "threshold", rows: 1, gapi: "cv2.gapi.threshold" },
  { key: "erode", label: "erode 3 × 3", rows: 3, gapi: "cv2.gapi.erode" },
  { key: "dilate", label: "dilate 3 × 3", rows: 3, gapi: "cv2.gapi.dilate" },
  { key: "count", label: "countNonZero", rows: 1, gapi: "cv2.gapi.countNonZero", reduce: true },
];

/** Bytes held for intermediate results (8-bit, 1 channel), excluding inputs and the final output. */
export function memory(active: Stage[], w: number, h: number) {
  const imageStages = active.filter((s) => !s.reduce);
  const intermediates = Math.max(0, imageStages.length - (active.some((s) => s.reduce) ? 0 : 1));
  const eager = intermediates * w * h;
  // Fluid: each consumer keeps a window of `rows` lines of its input
  const consumers = active.slice(1);
  const fluid = consumers.reduce((acc, s) => acc + s.rows * w, 0);
  return { eager, fluid, intermediates };
}
