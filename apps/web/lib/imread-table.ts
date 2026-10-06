// What cv2.imread returns for four kinds of files under six flags. Measured with opencv-python 4.13.0.92
// (files made in Chapter 7.2's Code example 1). Used by ImreadLab. Unit-tested for consistency.

export const FLAGS = ["IMREAD_COLOR (default)", "IMREAD_GRAYSCALE", "IMREAD_UNCHANGED", "IMREAD_ANYDEPTH", "IMREAD_REDUCED_COLOR_2", "COLOR | IGNORE_ORIENTATION"] as const;
export type Flag = (typeof FLAGS)[number];
export const FILES = {
  "color8.png": "8-bit colour PNG (200 × 320)",
  "gray16.png": "16-bit gray PNG, 12-bit data (max 4085)",
  "alpha.png": "8-bit PNG with an alpha channel (BGRA)",
  "rotated.jpg": "JPEG with EXIF orientation 6 (rotate 90°)",
} as const;
export type File = keyof typeof FILES;
type R = [number[], string, number];

export const TABLE: Record<File, Record<Flag, R>> = {
  "color8.png": { "IMREAD_COLOR (default)": [[200, 320, 3], "uint8", 255], IMREAD_GRAYSCALE: [[200, 320], "uint8", 168], IMREAD_UNCHANGED: [[200, 320, 3], "uint8", 255], IMREAD_ANYDEPTH: [[200, 320], "uint8", 168], IMREAD_REDUCED_COLOR_2: [[100, 160, 3], "uint8", 255], "COLOR | IGNORE_ORIENTATION": [[200, 320, 3], "uint8", 255] },
  "gray16.png": { "IMREAD_COLOR (default)": [[200, 320, 3], "uint8", 15], IMREAD_GRAYSCALE: [[200, 320], "uint8", 15], IMREAD_UNCHANGED: [[200, 320], "uint16", 4085], IMREAD_ANYDEPTH: [[200, 320], "uint16", 4085], IMREAD_REDUCED_COLOR_2: [[100, 160, 3], "uint8", 15], "COLOR | IGNORE_ORIENTATION": [[200, 320, 3], "uint8", 15] },
  "alpha.png": { "IMREAD_COLOR (default)": [[200, 320, 3], "uint8", 255], IMREAD_GRAYSCALE: [[200, 320], "uint8", 168], IMREAD_UNCHANGED: [[200, 320, 4], "uint8", 255], IMREAD_ANYDEPTH: [[200, 320], "uint8", 168], IMREAD_REDUCED_COLOR_2: [[100, 160, 3], "uint8", 255], "COLOR | IGNORE_ORIENTATION": [[200, 320, 3], "uint8", 255] },
  "rotated.jpg": { "IMREAD_COLOR (default)": [[320, 200, 3], "uint8", 255], IMREAD_GRAYSCALE: [[320, 200], "uint8", 173], IMREAD_UNCHANGED: [[200, 320, 3], "uint8", 255], IMREAD_ANYDEPTH: [[320, 200], "uint8", 173], IMREAD_REDUCED_COLOR_2: [[160, 100, 3], "uint8", 255], "COLOR | IGNORE_ORIENTATION": [[200, 320, 3], "uint8", 255] },
};

/** A one-line explanation of what happened. */
export function explain(file: File, flag: Flag): string {
  const [shape, dtype, max] = TABLE[file][flag];
  const notes: string[] = [];
  if (file === "gray16.png" && dtype === "uint8") notes.push(`16-bit data squeezed to 8 bits (top 8 bits kept): max ${max} instead of 4085.`);
  if (file === "gray16.png" && dtype === "uint16") notes.push("16-bit values kept.");
  if (file === "alpha.png") notes.push(shape[2] === 4 ? "Alpha channel kept (B, G, R, A)." : "Alpha channel dropped.");
  if (file === "rotated.jpg") notes.push(shape[0] === 320 ? "EXIF orientation applied: the image is rotated." : "Stored orientation: not rotated.");
  if (shape.length === 2 && file !== "gray16.png") notes.push("Converted to one gray channel.");
  if (flag === "IMREAD_REDUCED_COLOR_2") notes.push("Decoded at half size (fast for large JPEGs).");
  return notes.join(" ") || "Read as stored.";
}
