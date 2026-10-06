import { BINDING_RESULTS } from "./binding-data.ts";

export const FUNCS = ["cvtColor BGR→GRAY", "GaussianBlur 3×3", "threshold 100", "Canny", "rectangle (draws in place)"] as const;
export const DTYPES = ["uint8", "int8", "uint16", "int16", "int32", "float16", "float32", "float64", "int64", "bool"] as const;
export const SHAPES = ["(h, w)", "(h, w, 1)", "(h, w, 3)", "(h, w, 4)"] as const;
export const LAYOUTS = ["contiguous", "every 2nd column (a[:, ::2])", "transposed (a.T)"] as const;

export const HINTS: Record<string, string> = {
  bool: "NumPy bool arrays are rejected. Convert masks first: mask.astype(np.uint8) * 255.",
  layout: "Functions that write into your array (drawing, dst=) need a Mat-compatible layout: rows contiguous, pixels packed. Draw on np.ascontiguousarray(a) or a.copy().",
  int64out: "int64 cannot be wrapped as a Mat for output (OpenCV has no 64-bit integer depth). Use uint8, int32 or float32.",
  int64in: "Inputs of dtype int64 are converted to int32 (CV_32S) first; this function does not support CV_32S.",
  channels: "Wrong number of channels: BGR→GRAY needs a 3- or 4-channel image.",
  depth: "This function has no implementation for this depth. Convert to uint8 or float32 first.",
  depthCanny: "Canny accepts only uint8. Convert with np.clip(a, 0, 255).astype(np.uint8) or cv2.convertScaleAbs(a).",
  depthCvt: "cvtColor accepts uint8, uint16 and float32. Convert with a.astype(np.float32) (keep the value range in mind).",
};

const DEPTH: Record<string, [string, number]> = {
  uint8: ["8U", 0], int8: ["8S", 1], uint16: ["16U", 2], int16: ["16S", 3], int32: ["32S", 4],
  float32: ["32F", 5], float64: ["64F", 6], float16: ["16F", 7], int64: ["32S", 4],
};

/** The Mat type the binding builds for an input array, or null if it is rejected. */
export function matType(dtype: string, shape: string): { name: string; number: number; converted: boolean } | null {
  const d = DEPTH[dtype];
  if (!d) return null;
  const cn = shape === "(h, w)" ? 1 : Number(shape.match(/(\d)\)$/)![1]);
  return { name: `CV_${d[0]}C${cn}`, number: d[1] + (cn - 1) * 8, converted: dtype === "int64" };
}

export function lookup(fn: string, dtype: string, shape: string, layout: string) {
  const r = BINDING_RESULTS[`${fn}|${dtype}|${shape}|${layout}`];
  if (!r) return null;
  return r[0] === 1 ? { ok: true as const, result: r[1] } : { ok: false as const, error: r[1], hint: HINTS[r[2] === "depth" && fn === "Canny" ? "depthCanny" : r[2] === "depth" && fn.startsWith("cvtColor") ? "depthCvt" : (r[2] ?? "depth")] };
}

/** Is the array a copy-free view for OpenCV? (rows may have any step, but pixels within a row must be packed.) */
export function needsCopy(layout: string) {
  return layout !== "contiguous";
}
