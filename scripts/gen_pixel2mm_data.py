"""Real pixel-to-mm conversion: a naive fixed scale factor (2.4's method) vs the full
calibrated method (undistort + ray-plane intersection at the real known height)
(Module 41.6, PixelToMMLab): apps/web/public/data/pixel2mm-data.json.
"""
import json

import cv2
import numpy as np

K = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])
dist = np.array([0.02, -0.01, 0.0005, 0.0002, 0.0])
rvec = np.array([0.0, 0.0, 0.0])
tvec = np.array([0.0, 0.0, 800.0])
TRUE_LENGTH = 100.0

# naive scale, calibrated once at height 0
a0 = np.array([[-50.0, 0.0, 0.0]])
b0 = np.array([[50.0, 0.0, 0.0]])
ia, _ = cv2.projectPoints(a0, rvec, tvec, K, dist)
ib, _ = cv2.projectPoints(b0, rvec, tvec, K, dist)
px_ref = float(np.linalg.norm(ib.reshape(-1) - ia.reshape(-1)))
scale_mm_per_px = TRUE_LENGTH / px_ref

results = []
for height in range(-60, 61, 10):
    a1 = np.array([[-50.0, 0.0, float(height)]])
    b1 = np.array([[50.0, 0.0, float(height)]])
    ia1, _ = cv2.projectPoints(a1, rvec, tvec, K, dist)
    ib1, _ = cv2.projectPoints(b1, rvec, tvec, K, dist)
    px_part = float(np.linalg.norm(ib1.reshape(-1) - ia1.reshape(-1)))
    naive_reading = px_part * scale_mm_per_px

    pts = np.array([ia1.reshape(-1), ib1.reshape(-1)], np.float64).reshape(-1, 1, 2)
    undist = cv2.undistortPoints(pts, K, dist).reshape(-1, 2)
    s = height + 800.0
    Xw = undist[:, 0] * s
    correct_reading = float(Xw[1] - Xw[0])

    results.append({"height": height, "naive_mm": naive_reading, "correct_mm": correct_reading})

out = {"true_length": TRUE_LENGTH, "scale_mm_per_px": scale_mm_per_px, "results": results}
json.dump(out, open("apps/web/public/data/pixel2mm-data.json", "w"), separators=(",", ":"))
for r in results:
    print(f"height={r['height']:+4d}mm: naive={r['naive_mm']:.2f}mm, correct={r['correct_mm']:.4f}mm (true {TRUE_LENGTH})")
