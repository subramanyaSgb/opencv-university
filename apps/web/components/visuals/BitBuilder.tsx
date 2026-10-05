"use client";

import { useState } from "react";
import { inkFor } from "@/lib/pixel-ops";

const PLACES = [128, 64, 32, 16, 8, 4, 2, 1];

/** Eight switchable bits build one 8-bit pixel value (0..255) and show its gray. */
export function BitBuilder({ initial = 128 }: { initial?: number }) {
  const [bits, setBits] = useState<number[]>(PLACES.map((p) => (initial & p ? 1 : 0)));
  const value = bits.reduce((sum, b, i) => sum + b * PLACES[i], 0);
  const terms = bits.map((b, i) => (b ? PLACES[i] : 0)).filter(Boolean);

  return (
    <figure className="vis bits">
      <div className="vis-title">Build a pixel from 8 bits. Tap a bit to flip it.</div>
      <div className="bits-row">
        {bits.map((b, i) => (
          <button
            key={i}
            type="button"
            className={`bit${b ? " is-on" : ""}`}
            aria-pressed={b === 1}
            aria-label={`Bit worth ${PLACES[i]}: ${b}`}
            onClick={() => setBits(bits.map((x, j) => (j === i ? 1 - x : x)))}
          >
            <span className="bit-place">{PLACES[i]}</span>
            <span className="bit-val">{b}</span>
          </button>
        ))}
      </div>
      <div className="bits-result">
        <span className="bits-sum">{terms.length ? terms.join(" + ") : "0"} =</span>
        <span className="bits-value" style={{ background: `rgb(${value},${value},${value})`, color: inkFor(value) }}>
          {value}
        </span>
      </div>
      <div className="bits-actions">
        <button type="button" className="btn-ghost" onClick={() => setBits(PLACES.map(() => 0))}>
          All 0 → black
        </button>
        <button type="button" className="btn-ghost" onClick={() => setBits(PLACES.map(() => 1))}>
          All 1 → white
        </button>
      </div>
      <figcaption>8 bits give 2⁸ = 256 different patterns, so one pixel can hold any value from 0 to 255.</figcaption>
    </figure>
  );
}
