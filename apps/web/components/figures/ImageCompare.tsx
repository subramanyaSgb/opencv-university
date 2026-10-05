"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { sliderPercent } from "@/lib/pixel-ops";

export interface ImageSource {
  src: string;
  label: string;
}

export interface ImageCompareProps {
  /** The original image (shown left of the divider). */
  before: ImageSource;
  /** One or more processed versions (shown right of the divider). Several = learner picks. */
  after: ImageSource | ImageSource[];
  /** Pixel size of the images (all must match). */
  width: number;
  height: number;
  alt: string;
  caption?: string;
  /** Keep hard pixel edges when scaled up (for tiny images). */
  pixelated?: boolean;
  /** Start position of the divider, 0..100 (default 50). */
  initial?: number;
}

interface Peek {
  x: number;
  y: number;
  before: number[];
  after: number[];
}

/** Read an image's RGBA pixels (same-origin images only). */
function usePixels(src: string, width: number, height: number) {
  const [data, setData] = useState<Uint8ClampedArray | null>(null);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !alive) return;
      ctx.drawImage(img, 0, 0, width, height);
      setData(ctx.getImageData(0, 0, width, height).data);
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src, width, height]);
  return data;
}

function pixelAt(data: Uint8ClampedArray | null, x: number, y: number, width: number): number[] {
  if (!data) return [];
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}

/** Gray images show one number; colour images show B, G, R (OpenCV order). */
function fmt(px: number[]): string {
  if (!px.length) return "…";
  const [r, g, b] = px;
  return r === g && g === b ? String(r) : `B ${b}, G ${g}, R ${r}`;
}

/**
 * ImageCompare: before/after slider. Drag (or use arrow keys) to move the divider.
 * Hover or tap the image to read the pixel value at that point in both images.
 */
export function ImageCompare({
  before,
  after,
  width,
  height,
  alt,
  caption,
  pixelated = false,
  initial = 50,
}: ImageCompareProps) {
  const variants = Array.isArray(after) ? after : [after];
  const [vi, setVi] = useState(0);
  const [pos, setPos] = useState(initial);
  const [peek, setPeek] = useState<Peek | null>(null);
  const dragging = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const current = variants[vi];

  const beforePx = usePixels(before.src, width, height);
  const afterPx = usePixels(current.src, width, height);

  const locate = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const x = Math.min(width - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * width)));
    const y = Math.min(height - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * height)));
    return { r, x, y };
  };

  const onDown = (e: PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { r, x, y } = locate(e);
    setPos(sliderPercent(e.clientX, r.left, r.width));
    setPeek({ x, y, before: pixelAt(beforePx, x, y, width), after: pixelAt(afterPx, x, y, width) });
  };
  const onMove = (e: PointerEvent) => {
    const { r, x, y } = locate(e);
    if (dragging.current) setPos(sliderPercent(e.clientX, r.left, r.width));
    setPeek({ x, y, before: pixelAt(beforePx, x, y, width), after: pixelAt(afterPx, x, y, width) });
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - step));
    else if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + step));
    else if (e.key === "Home") setPos(0);
    else if (e.key === "End") setPos(100);
    else return;
    e.preventDefault();
  };

  // Keep the readout current when the learner switches variant without moving.
  useEffect(() => {
    setPeek((p) =>
      p ? { ...p, before: pixelAt(beforePx, p.x, p.y, width), after: pixelAt(afterPx, p.x, p.y, width) } : p,
    );
  }, [beforePx, afterPx, width]);

  return (
    <figure className="fig image-compare">
      {variants.length > 1 && (
        <div className="fig-controls">
          <div className="seg" role="radiogroup" aria-label="Processed version">
            {variants.map((v, i) => (
              <button
                key={v.src}
                type="button"
                role="radio"
                aria-checked={vi === i}
                className={vi === i ? "is-on" : ""}
                onClick={() => setVi(i)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={box}
        className={`ic-box${pixelated ? " is-pixelated" : ""}`}
        style={{ aspectRatio: `${width} / ${height}`, maxWidth: `${Math.max(width, 480)}px` }}
        role="slider"
        tabIndex={0}
        aria-label={`Before and after comparison: ${alt}. Use left and right arrow keys to move the divider.`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% ${before.label}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={(e) => e.pointerType === "mouse" && !dragging.current && setPeek(null)}
        onKeyDown={onKey}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before.src} alt={`${alt}: ${before.label}`} width={width} height={height} draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={`${alt}: ${current.label}`}
          width={width}
          height={height}
          draggable={false}
          className="ic-after"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        />
        <div className="ic-divider" style={{ left: `${pos}%` }} aria-hidden="true">
          <span className="ic-handle">‹ ›</span>
        </div>
        <span className="ic-label ic-label-left">{before.label}</span>
        <span className="ic-label ic-label-right">{current.label}</span>
      </div>

      <div className="pg-readout" aria-live="polite">
        {peek ? (
          <span>
            Pixel <code>[{peek.y}, {peek.x}]</code> (row {peek.y}, column {peek.x}): {before.label}{" "}
            <strong>{fmt(peek.before)}</strong> → {current.label} <strong>{fmt(peek.after)}</strong>
          </span>
        ) : (
          <span>Drag the divider. Hover or tap the image to read pixel values.</span>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
