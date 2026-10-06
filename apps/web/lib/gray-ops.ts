/** Grey conversions for Chapter 10.5. Colours in B, G, R order (0..255). */
import { toLab } from "./cvd-ops.ts";
export type Trip = [number, number, number];

export const METHODS = [
  { key: "bt601", label: "BT.601 (cv2 default)", note: "0.299 R + 0.587 G + 0.114 B" },
  { key: "bt709", label: "BT.709", note: "0.2126 R + 0.7152 G + 0.0722 B" },
  { key: "mean", label: "average", note: "(R + G + B) / 3" },
  { key: "max", label: "max (HSV V)", note: "max(R, G, B)" },
  { key: "lstar", label: "Lab L*", note: "perceived lightness, scaled to 0–255" },
  { key: "r", label: "R channel", note: "red only" },
  { key: "g", label: "G channel", note: "green only" },
  { key: "b", label: "B channel", note: "blue only" },
] as const;
export type Method = (typeof METHODS)[number]["key"];

export function gray([b, g, r]: Trip, m: Method): number {
  switch (m) {
    case "bt601": return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    case "bt709": return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    case "mean": return Math.round((r + g + b) / 3);
    case "max": return Math.max(r, g, b);
    case "lstar": return Math.round((toLab([r, g, b])[0] * 255) / 100);
    case "r": return r;
    case "g": return g;
    case "b": return b;
  }
}
