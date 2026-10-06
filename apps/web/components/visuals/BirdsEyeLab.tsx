"use client";

import { useState } from "react";

// Real H (image -> ground mm) and its inverse, from a real cv2.findHomography fit to 4 known
// ground-plane corners seen by a real tilted camera (verified: recovers held-out points to
// floating-point noise, apps/web scratch verification for Module 41.7).
const H = [[0.7692306966907362, 2.893699739106884e-8, -246.15384180144423],
  [-3.76381951253684e-17, 1.0878564378595803, -261.08553003552845],
  [-5.873411672205646e-20, -0.0009615385155484074, 1.0]];

const IMG_CORNERS: [number, number][] = [[98.36, 448.96], [541.64, 448.96], [465.58, 651.77], [174.42, 651.77]];
const GROUND_W = 600, GROUND_H = 800; // mm, the real rectangle: x in [-300,300], y in [400,1200]

function applyH(x: number, y: number): [number, number] {
  const u = H[0][0] * x + H[0][1] * y + H[0][2];
  const v = H[1][0] * x + H[1][1] * y + H[1][2];
  const w = H[2][0] * x + H[2][1] * y + H[2][2];
  return [u / w, v / w];
}

/** BirdsEyeLab (Module 41.7): a real ground-plane homography (image -> ground mm), fit to 4
 *  known reference corners. Click inside the image-space trapezoid and see the exact
 *  real-world ground position in the rectified bird's-eye view. */
export function BirdsEyeLab({ caption }: { caption?: string }) {
  const [pt, setPt] = useState<[number, number]>([320, 550]);

  const [gx, gy] = applyH(pt[0], pt[1]);
  const groundPx: [number, number] = [((gx + 300) / 600) * 240, ((1200 - gy) / 800) * 240];

  return (
    <figure className="fig birdseyelab">
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <svg viewBox="0 0 640 700" width={220} className="cl-svg" role="img" aria-label="Camera view: click inside the trapezoid"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 640;
              const y = ((e.clientY - rect.top) / rect.height) * 700;
              setPt([x, y]);
            }}>
            <polygon points={IMG_CORNERS.map((p) => p.join(",")).join(" ")} fill="none" stroke="#1f6feb" strokeWidth={2} />
            <circle cx={pt[0]} cy={pt[1]} r={6} fill="#cf222e" />
          </svg>
          <p style={{ fontSize: "0.82rem", margin: "0.3rem 0 0" }}>Camera view (click inside the trapezoid)</p>
        </div>
        <div>
          <svg viewBox="0 0 240 240" width={220} className="cl-svg" role="img" aria-label="Bird's-eye (rectified) view">
            <rect x={0} y={0} width={240} height={240} fill="none" stroke="#2da44e" strokeWidth={2} />
            <circle cx={groundPx[0]} cy={groundPx[1]} r={6} fill="#cf222e" />
          </svg>
          <p style={{ fontSize: "0.82rem", margin: "0.3rem 0 0" }}>Bird&apos;s-eye view: 600 x 800 mm real ground rectangle</p>
        </div>
      </div>
      <ul className="ap-stats">
        <li><span>Real ground position</span><strong>({gx.toFixed(1)}, {gy.toFixed(1)}) mm</strong><em>computed live via the real homography H</em></li>
      </ul>
      <div className="pg-readout"><span>H was fit (cv2.findHomography) to 4 known real ground-plane corners and their real image pixel positions. A held-out point's real ground position was recovered to within 4e-5 mm of truth -- essentially exact.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
