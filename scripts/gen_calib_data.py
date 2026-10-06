"""Real cv2.calibrateCamera results on a synthetic multi-view chessboard, with a known true
camera (Module 41.4, CalibLab): apps/web/public/data/calib-data.json.

A known K_true/dist_true camera observes a real 9x6 chessboard from 15 random poses, with
realistic 0.2 px corner-detection noise added. Calibrating with 3, 5, 10 and 15 of those views
shows how the recovered intrinsics' real accuracy improves with more views.
"""
import json

import cv2
import numpy as np

K_true = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])
dist_true = np.array([0.1, -0.05, 0.001, 0.0005, 0.0])
cols, rows, sq = 9, 6, 25.0
objp = np.zeros((rows * cols, 3), np.float64)
objp[:, :2] = np.mgrid[0:cols, 0:rows].T.reshape(-1, 2) * sq

rng = np.random.default_rng(3)
n_views = 15
objpoints, imgpoints = [], []
for _ in range(n_views):
    rvec = rng.normal(0, 0.3, 3)
    tvec = np.array([rng.normal(0, 60), rng.normal(0, 40), 400 + rng.normal(0, 80)])
    img_pts, _ = cv2.projectPoints(objp, rvec, tvec, K_true, dist_true)
    img_pts = img_pts.reshape(-1, 2) + rng.normal(0, 0.2, (len(objp), 2))
    objpoints.append(objp.astype(np.float32))
    imgpoints.append(img_pts.reshape(-1, 1, 2).astype(np.float32))

results = []
for nv in (3, 5, 10, 15):
    ret, K_est, dist_est, _, _ = cv2.calibrateCamera(objpoints[:nv], imgpoints[:nv], (640, 480), None, None)
    results.append({
        "n_views": nv, "rms": float(ret),
        "fx": float(K_est[0, 0]), "fy": float(K_est[1, 1]),
        "cx": float(K_est[0, 2]), "cy": float(K_est[1, 2]),
        "fx_error": float(abs(K_est[0, 0] - K_true[0, 0])),
    })

out = {"k_true": {"fx": 800.0, "fy": 800.0, "cx": 320.0, "cy": 240.0}, "results": results}
json.dump(out, open("apps/web/public/data/calib-data.json", "w"), separators=(",", ":"))
for r in results:
    print(f"n_views={r['n_views']}: RMS={r['rms']:.4f}, fx={r['fx']:.2f} (true 800), fx error={r['fx_error']:.3f}")
