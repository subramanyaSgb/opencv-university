/** Simulated cv::Mat headers and reference-counted pixel buffers (Chapter 8.2). 8-bit, 1 channel. */
export interface Buf { id: string; rows: number; cols: number; data: number[]; refs: number; freed: boolean }
export interface Hdr { name: string; buf: string | null; r0: number; c0: number; rows: number; cols: number }
export interface MatState { bufs: Buf[]; hdrs: Hdr[] }
export interface Step { code: string; note: string; state: MatState }

const clone = (s: MatState): MatState => ({ bufs: s.bufs.map((b) => ({ ...b, data: [...b.data] })), hdrs: s.hdrs.map((h) => ({ ...h })) });
const buf = (s: MatState, id: string | null) => s.bufs.find((b) => b.id === id)!;
const hdr = (s: MatState, n: string) => s.hdrs.find((h) => h.name === n)!;

/** Write v at (r, c) of header n (coordinates relative to the header). */
export function setAt(s: MatState, n: string, r: number, c: number, v: number) {
  const h = hdr(s, n); const b = buf(s, h.buf);
  b.data[(h.r0 + r) * b.cols + (h.c0 + c)] = v;
}
export function setAll(s: MatState, n: string, v: number) {
  const h = hdr(s, n);
  for (let r = 0; r < h.rows; r++) for (let c = 0; c < h.cols; c++) setAt(s, n, r, c, v);
}
/** Detach a header from its buffer; the buffer is freed when no header refers to it. */
export function release(s: MatState, n: string) {
  const h = hdr(s, n);
  if (h.buf === null) return;
  const b = buf(s, h.buf);
  b.refs -= 1;
  if (b.refs === 0) b.freed = true;
  h.buf = null; h.rows = 0; h.cols = 0; h.r0 = 0; h.c0 = 0;
}
/** step = bytes per row of the underlying buffer; continuous when the header covers whole rows. */
export function info(s: MatState, n: string) {
  const h = hdr(s, n);
  if (h.buf === null) return { empty: true, step: 0, continuous: false, offset: 0 };
  const b = buf(s, h.buf);
  return { empty: false, step: b.cols, continuous: h.cols === b.cols || h.rows === 1, offset: h.r0 * b.cols + h.c0 };
}
/** Value seen through header n at (r, c). */
export function at(s: MatState, n: string, r: number, c: number) {
  const h = hdr(s, n); const b = buf(s, h.buf);
  return b.data[(h.r0 + r) * b.cols + (h.c0 + c)];
}

/** The scripted C++ session of Chapter 8.2, one state per line. */
export function script(): Step[] {
  const steps: Step[] = [];
  let s: MatState = { bufs: [], hdrs: [] };
  const push = (code: string, note: string) => { steps.push({ code, note, state: clone(s) }); };

  s.bufs.push({ id: "buffer 1", rows: 3, cols: 5, data: Array(15).fill(0), refs: 1, freed: false });
  s.hdrs.push({ name: "A", buf: "buffer 1", r0: 0, c0: 0, rows: 3, cols: 5 });
  push("cv::Mat A(3, 5, CV_8UC1, cv::Scalar(0));", "Allocates a header A and a 3 × 5 pixel buffer (15 bytes). Reference count 1.");

  s.hdrs.push({ name: "B", buf: "buffer 1", r0: 0, c0: 0, rows: 3, cols: 5 }); buf(s, "buffer 1").refs++;
  push("cv::Mat B = A;", "Copies only the header. B points at the same pixels; the reference count becomes 2. No pixels are copied.");

  setAt(s, "B", 0, 0, 7);
  push("B.at<uchar>(0, 0) = 7;", "Writing through B changes the shared buffer: A(0, 0) is now 7 too.");

  s.bufs.push({ id: "buffer 2", rows: 3, cols: 5, data: [...buf(s, "buffer 1").data], refs: 1, freed: false });
  s.hdrs.push({ name: "C", buf: "buffer 2", r0: 0, c0: 0, rows: 3, cols: 5 });
  push("cv::Mat C = A.clone();", "clone() allocates a new buffer and copies the pixels. C is independent of A.");

  s.hdrs.push({ name: "R", buf: "buffer 1", r0: 1, c0: 1, rows: 2, cols: 3 }); buf(s, "buffer 1").refs++;
  push("cv::Mat R = A(cv::Rect(1, 1, 3, 2));", "An ROI header: 2 rows × 3 columns starting at x = 1, y = 1. Same buffer (count 3), data pointer offset by 1 · 5 + 1 = 6 bytes, step still 5, not continuous.");

  setAll(s, "R", 9);
  push("R.setTo(9);", "Filling the ROI fills that rectangle of A: this is how you process part of an image in place.");

  setAt(s, "C", 2, 4, 5);
  push("C.at<uchar>(2, 4) = 5;", "Only buffer 2 changes; A, B and R do not see it.");

  release(s, "A");
  push("A.release();", "A becomes empty. The buffer survives because B and R still use it (count 2).");

  release(s, "B");
  push("B = cv::Mat();", "Assigning an empty Mat also releases: count 1.");

  release(s, "R");
  push("R.release();", "The last reference is gone: buffer 1 is freed automatically. No delete, no leak.");
  return steps;
}

/** OpenCV type number: depth code + (channels − 1) · 8, e.g. CV_8UC3 = 16. */
export const DEPTHS = [
  { name: "8U", code: 0, bytes: 1 }, { name: "8S", code: 1, bytes: 1 }, { name: "16U", code: 2, bytes: 2 }, { name: "16S", code: 3, bytes: 2 },
  { name: "32S", code: 4, bytes: 4 }, { name: "32F", code: 5, bytes: 4 }, { name: "64F", code: 6, bytes: 8 }, { name: "16F", code: 7, bytes: 2 },
];
export const makeType = (depth: number, cn: number) => depth + (cn - 1) * 8;
