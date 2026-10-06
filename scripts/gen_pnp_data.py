"""Real cv2.solvePnP pose-recovery accuracy vs number of correspondence points
(Module 41.5, PnPLab): apps/web/public/data/pnp-data.json.
"""
import json

import cv2
import numpy as np

K = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])
dist = np.array([0.1, -0.05, 0.001, 0.0005, 0.0])
cols, rows, sq = 9, 6, 25.0
objp = np.zeros((rows * cols, 3), np.float64)
objp[:, :2] = np.mgrid[0:cols, 0:rows].T.reshape(-1, 2) * sq

rvec_true = np.array([0.1, -0.2, 0.05])
tvec_true = np.array([-100.0, -60.0, 500.0])
img_pts, _ = cv2.projectPoints(objp, rvec_true, tvec_true, K, dist)
rng = np.random.default_rng(7)
img_pts_noisy = img_pts.reshape(-1, 2) + rng.normal(0, 0.2, (len(objp), 2))

results = []
for n in (4, 6, 10, 20, 54):
    idx = np.linspace(0, len(objp) - 1, n).astype(int)
    ok, rvec_est, tvec_est = cv2.solvePnP(objp[idx], img_pts_noisy[idx].reshape(-1, 1, 2), K, dist)
    t_err = float(np.linalg.norm(tvec_est.flatten() - tvec_true))
    results.append({"n_points": n, "tvec_error_mm": t_err})

out = {"tvec_true": tvec_true.tolist(), "rvec_true": rvec_true.tolist(), "results": results}
json.dump(out, open("apps/web/public/data/pnp-data.json", "w"), separators=(",", ":"))
for r in results:
    print(f"n_points={r['n_points']}: tvec error {r['tvec_error_mm']:.4f} mm")
