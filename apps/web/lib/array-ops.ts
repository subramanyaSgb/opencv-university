// Memory layout of NumPy-style C-ordered arrays, for ArrayLab (Chapter 6.1). Unit-tested.

export type DType = "uint8" | "uint16" | "int16" | "int32" | "float32" | "float64" | "bool";
export const ITEMSIZE: Record<DType, number> = { uint8: 1, uint16: 2, int16: 2, int32: 4, float32: 4, float64: 8, bool: 1 };
export const RANGE: Record<DType, string> = {
  uint8: "0 … 255", uint16: "0 … 65 535", int16: "−32 768 … 32 767", int32: "about ±2.1 billion",
  float32: "±3.4e38, ~7 digits", float64: "±1.8e308, ~16 digits", bool: "False / True",
};
/** OpenCV image functions (cvtColor, most filters) generally accept these depths. */
export const OPENCV_OK: Record<DType, string> = {
  uint8: "everywhere", uint16: "most functions", int16: "some (Sobel output, …)", int32: "few (labels, sums)",
  float32: "most functions", float64: "many, not cvtColor", bool: "not accepted: convert to uint8",
};

/** Strides in bytes for a C-ordered (row-major) array. */
export function strides(shape: number[], itemsize: number): number[] {
  const s: number[] = [];
  let acc = itemsize;
  for (let i = shape.length - 1; i >= 0; i--) { s[i] = acc; acc *= shape[i]; }
  return s;
}

/** Byte offset of an index = Σ index[i] × stride[i]. */
export const offset = (index: number[], st: number[]) => index.reduce((s, v, i) => s + v * st[i], 0);
export const nbytes = (shape: number[], itemsize: number) => shape.reduce((a, b) => a * b, 1) * itemsize;
