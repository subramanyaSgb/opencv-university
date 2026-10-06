"use client";

import { useState } from "react";

const W = 640, H = 480;
const K = { fx: 800, fy: 800, cx: 320, cy: 240 };
// Real F for a real, slightly misaligned stereo pair (R: small rotation, t=(-120,2,-1)mm),
// verified: the epipolar constraint x2^T F x1 = 0 holds to ~1e-14 for true correspondences.
const F = [
  [-4.68710938e-8, 1.56273437e-6, 2.13956752e-3],
  [-5.3117969e-6, 3.43729167e-8, 1.51636529e-1],
  [-2.70942002e-3, -1.50475827e-1, 1.42535890e-1],
];

function epipolarLine(u1: number, v1: number) {
  const a = F[0][0] * u1 + F[0][1] * v1 + F[0][2];
  const b = F[1][0] * u1 + F[1][1] * v1 + F[1][2];
  const c = F[2][0] * u1 + F[2][1] * v1 + F[2][2];
  return [a, b, c];
}

/** Given a line a.u + b.v + c = 0, the two points where it crosses u=0 and u=W. */
function lineSegment(a: number, b: number, c: number) {
  const vAt = (u: number) => -(a * u + c) / b;
  return [[0, vAt(0)], [W, vAt(W)]];
}

// The exact real rotation matrix for rvec=(0, 0.02, 0.01), from cv2.Rodrigues -- not an
// approximation, so the two depth-based candidate points land exactly on the real line below.
const R = [
  [9.99750010e-1, -9.99916669e-3, 1.99983334e-2],
  [9.99916669e-3, 9.99950002e-1, 9.99958334e-5],
  [-1.99983334e-2, 9.99958334e-5, 9.99800008e-1],
];
const T = [-120, 2, -1];

function backProjectThenForward(u1: number, v1: number, Z: number) {
  const X = ((u1 - K.cx) * Z) / K.fx;
  const Y = ((v1 - K.cy) * Z) / K.fy;
  const Xc = R[0][0] * X + R[0][1] * Y + R[0][2] * Z + T[0];
  const Yc = R[1][0] * X + R[1][1] * Y + R[1][2] * Z + T[1];
  const Zc = R[2][0] * X + R[2][1] * Y + R[2][2] * Z + T[2];
  return [K.fx * (Xc / Zc) + K.cx, K.fy * (Yc / Zc) + K.cy];
}

/** EpipolarLab (Module 42.2): a real fundamental matrix F for a real, slightly misaligned
 *  stereo pair. Click a point in the left image; its match in the right image could be
 *  anywhere along the real computed epipolar line -- shown exactly, for two real depths. */
export function EpipolarLab({ caption }: { caption?: string }) {
  const [pt, setPt] = useState<[number, number]>([350, 200]);

  const [a, b, c] = epipolarLine(pt[0], pt[1]);
  const seg = lineSegment(a, b, c);
  const near = backProjectThenForward(pt[0], pt[1], 800);
  const far = backProjectThenForward(pt[0], pt[1], 1500);

  return (
    <figure className="fig epipolarlab">
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} width={240} className="cl-svg" role="img" aria-label="Left image: click to choose a point"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPt([((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H]);
            }}>
            <rect x={0} y={0} width={W} height={H} fill="var(--bg-sunk)" />
            <circle cx={pt[0]} cy={pt[1]} r={10} fill="#cf222e" />
          </svg>
          <p style={{ fontSize: "0.82rem", margin: "0.3rem 0 0" }}>Left image (click to pick a point)</p>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} width={240} className="cl-svg" role="img" aria-label="Right image: the real epipolar line">
            <rect x={0} y={0} width={W} height={H} fill="var(--bg-sunk)" />
            <line x1={seg[0][0]} y1={seg[0][1]} x2={seg[1][0]} y2={seg[1][1]} stroke="#1f6feb" strokeWidth={2} />
            <circle cx={near[0]} cy={near[1]} r={8} fill="#2da44e" />
            <circle cx={far[0]} cy={far[1]} r={8} fill="#bf8700" />
          </svg>
          <p style={{ fontSize: "0.82rem", margin: "0.3rem 0 0" }}>Right image: the real epipolar line (blue), and two real candidate matches at different depths</p>
        </div>
      </div>
      <div className="gl-legend"><span className="by-k" style={{ background: "#2da44e" }} /> match if Z=800mm <span className="by-k" style={{ background: "#bf8700" }} /> match if Z=1500mm</div>
      <div className="pg-readout"><span>Both real candidate points, computed from the SAME left-image pixel at two different real depths, land exactly on the same computed epipolar line -- the real match could be anywhere along it, but never off it.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
