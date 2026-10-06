"use client";

/** Shared pieces for the 2-D feature-space labs of Module 36: an SVG scatter plot with axes, coloured
 *  classes, an optional decision-region background and a clickable test point. Styles: `.ck-*` in globals.css. */
import { type ReactNode } from "react";
import { useGrays } from "./lab-kit";

export type Pt = { x: number; y: number; label: string };
export const CLASS_COLOURS = ["#3aa0ff", "#e0393e", "#2fae5c", "#caa42a", "#9b59d9"];

export function classColour(labels: string[], label: string): string {
  const i = labels.indexOf(label);
  return CLASS_COLOURS[i % CLASS_COLOURS.length];
}

/** Maps data coordinates to SVG pixel coordinates for a fixed viewBox. */
export function makeScale(xDomain: [number, number], yDomain: [number, number], w: number, h: number, pad = 28) {
  const sx = (x: number) => pad + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * (w - 2 * pad);
  const sy = (y: number) => h - pad - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * (h - 2 * pad);
  return { sx, sy, pad };
}

export function ScatterPlot({
  points, labels, xDomain, yDomain, width = 320, height = 320, xLabel, yLabel,
  test, onPick, background, extra,
}: {
  points: Pt[]; labels: string[]; xDomain: [number, number]; yDomain: [number, number];
  width?: number; height?: number; xLabel?: string; yLabel?: string;
  test?: { x: number; y: number; label?: string };
  onPick?: (x: number, y: number) => void;
  /** Optional pre-rendered background (e.g. a decision-region <image> or <g> of filled cells), in data space, drawn first. */
  background?: ReactNode;
  extra?: ReactNode;
}) {
  const { sx, sy, pad } = makeScale(xDomain, yDomain, width, height);
  return (
    <div className="ck-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="ck-svg"
        onClick={(e) => {
          if (!onPick) return;
          const r = (e.target as SVGSVGElement).closest("svg")!.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * width, py = ((e.clientY - r.top) / r.height) * height;
          const x = xDomain[0] + ((px - pad) / (width - 2 * pad)) * (xDomain[1] - xDomain[0]);
          const y = yDomain[1] - ((py - pad) / (height - 2 * pad)) * (yDomain[1] - yDomain[0]);
          onPick(x, y);
        }}
        style={{ cursor: onPick ? "crosshair" : undefined }}
      >
        {background}
        <rect x={pad} y={pad} width={width - 2 * pad} height={height - 2 * pad} fill="none" stroke="var(--line)" />
        {extra}
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={classColour(labels, p.label)} stroke="#fff" strokeWidth={1} />
        ))}
        {test && (
          <g>
            <circle cx={sx(test.x)} cy={sy(test.y)} r={6.5} fill={test.label ? classColour(labels, test.label) : "none"} stroke="#111" strokeWidth={2} />
            <circle cx={sx(test.x)} cy={sy(test.y)} r={1.5} fill="#111" />
          </g>
        )}
        {xLabel && <text x={width / 2} y={height - 4} textAnchor="middle" className="ck-axis">{xLabel}</text>}
        {yLabel && <text x={10} y={height / 2} textAnchor="middle" transform={`rotate(-90 10 ${height / 2})`} className="ck-axis">{yLabel}</text>}
      </svg>
      <div className="ck-legend">
        {labels.map((l) => (
          <span key={l} className="ck-chip"><span className="ck-dot" style={{ background: classColour(labels, l) }} />{l}</span>
        ))}
        {test && <span className="ck-chip">test point</span>}
      </div>
    </div>
  );
}

// Shared 3-class dataset for Module 36's labs: 8x8-tile (mean, std) features of the three 35.1 texture
// images (81 tiles each). Reused from 36.1 on so later chapters compare against the same feature space.
export const TEXTURE_SOURCES: [string, string][] = [
  ["woven", "/images/sample-texture-woven.png"],
  ["smooth", "/images/sample-texture-smooth.png"],
  ["blotchy", "/images/sample-texture-blotchy.png"],
];
export const TILE = 8;

export function tileFeatures(d: ArrayLike<number>, w: number, h: number, label: string): Pt[] {
  const pts: Pt[] = [];
  for (let ty = 0; ty < Math.floor(h / TILE); ty++) {
    for (let tx = 0; tx < Math.floor(w / TILE); tx++) {
      const vals: number[] = [];
      for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) vals.push(d[(ty * TILE + y) * w + (tx * TILE + x)]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      pts.push({ x: mean, y: Math.sqrt(variance), label });
    }
  }
  return pts;
}

/** Loads the three texture images and returns their combined tile-feature points, or null while loading. */
export function useTextureTiles(): Pt[] | null {
  const imgs = useGrays(TEXTURE_SOURCES.map(([, src]) => src));
  if (!imgs) return null;
  return TEXTURE_SOURCES.flatMap(([label], i) => tileFeatures(imgs[i].d, imgs[i].w, imgs[i].h, label));
}

export function centroidsOf(points: Pt[]): { label: string; x: number; y: number }[] {
  const labels = [...new Set(points.map((p) => p.label))];
  return labels.map((label) => {
    const pts = points.filter((p) => p.label === label);
    return { label, x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length };
  });
}

/** A coarse decision-region background: evaluates `classify(x,y)` on a grid and fills each cell with its class colour at low opacity. */
export function decisionRegion(
  labels: string[], xDomain: [number, number], yDomain: [number, number], width: number, height: number,
  classify: (x: number, y: number) => string, grid = 40, pad = 28,
): ReactNode {
  const { sx: _sx } = makeScale(xDomain, yDomain, width, height, pad);
  const cw = (width - 2 * pad) / grid, ch = (height - 2 * pad) / grid;
  const cells = [];
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const px = pad + (gx + 0.5) * cw, py = pad + (gy + 0.5) * ch;
      const x = xDomain[0] + ((px - pad) / (width - 2 * pad)) * (xDomain[1] - xDomain[0]);
      const y = yDomain[1] - ((py - pad) / (height - 2 * pad)) * (yDomain[1] - yDomain[0]);
      const label = classify(x, y);
      cells.push(<rect key={`${gx}-${gy}`} x={pad + gx * cw} y={pad + gy * ch} width={cw + 0.5} height={ch + 0.5} fill={classColour(labels, label)} opacity={0.16} />);
    }
  }
  return <g>{cells}</g>;
}
