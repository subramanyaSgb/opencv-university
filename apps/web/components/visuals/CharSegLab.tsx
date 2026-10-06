"use client";

import { useMemo, useState } from "react";
import { GrayView, Slider } from "./lab-kit";

const W = 42, H = 30, BRIDGE_X0 = 20, BRIDGE_W = 2;

function build(bridgeHeight: number): Uint8ClampedArray {
  const d = new Uint8ClampedArray(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const inLeft = x < 20, inRight = x >= 22;
      const inBridge = x >= BRIDGE_X0 && x < BRIDGE_X0 + BRIDGE_W && y >= H - bridgeHeight;
      d[y * W + x] = inLeft || inRight || inBridge ? 255 : 0;
    }
  }
  return d;
}
/** 4-connected component count on a binary (0/255) image. */
function countComponents(d: ArrayLike<number>, w: number, h: number): number {
  const seen = new Uint8Array(w * h);
  let count = 0;
  for (let start = 0; start < w * h; start++) {
    if (d[start] === 0 || seen[start]) continue;
    count++;
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w, y = Math.floor(p / w);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const np = ny * w + nx;
        if (!seen[np] && d[np] > 0) { seen[np] = 1; stack.push(np); }
      }
    }
  }
  return count;
}

/** CharSegLab (Module 38.2): two "characters" with an adjustable connecting bridge (simulating touching
 *  serifs) -- connected-components count vs the projection profile's local minimum (valley) as a split
 *  point, run live. */
export function CharSegLab({ caption }: { caption?: string }) {
  const [bridgeHeight, setBridgeHeight] = useState(10);

  const d = useMemo(() => build(bridgeHeight), [bridgeHeight]);
  const nComponents = useMemo(() => countComponents(d, W, H), [d]);
  const projection = useMemo(() => {
    const p = new Array(W).fill(0);
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (d[y * W + x] > 0) p[x]++;
    return p;
  }, [d]);
  const valleyX = projection.indexOf(Math.min(...projection));
  const maxP = Math.max(...projection);

  return (
    <figure className="fig lklab">
      <Slider label="Bridge height (touching serif)" v={bridgeHeight} set={setBridgeHeight} min={0} max={30} step={2} unit=" px" />
      <GrayView d={d} w={W} h={H} scale={8} label={`${W}x${H}; connected components (4-connectivity): ${nComponents}`} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: "3em", marginTop: "0.4em" }}>
        {projection.map((v, x) => (
          <div key={x} title={`col ${x}: ${v}`} style={{ width: 6, height: `${Math.max(2, (v / maxP) * 100)}%`, background: x === valleyX ? "#e0393e" : "#3aa0ff" }} />
        ))}
      </div>
      <p className="lk-read">
        Projection profile (blue bars); the lowest column (red, x={valleyX}, height {projection[valleyX]}) is the recovered split point —
        correct even when connected components reports only <b>{nComponents}</b> blob{nComponents === 1 ? "" : "s"} because the bridge connects them.
        At bridge height 0 the two characters are fully separate (2 components); raise it and watch the valley shrink until, eventually, it is no longer clearly distinguishable from the characters' own strokes.
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
