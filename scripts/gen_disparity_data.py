"""Real cv2.StereoBM/StereoSGBM dense disparity results on a synthetic, known-disparity
textured plane (Module 42.3, DisparityLab): apps/web/public/data/disparity-data.json.
"""
import json

import cv2
import numpy as np

rng = np.random.default_rng(9)
H, W = 240, 320
NUM_DISP = 32
TRUE_DISPARITY = 16
texture = rng.integers(0, 255, (H, W + NUM_DISP + 20), dtype=np.uint8)
left = texture[:, NUM_DISP + 10:NUM_DISP + 10 + W]
right = texture[:, NUM_DISP + 10 - TRUE_DISPARITY:NUM_DISP + 10 - TRUE_DISPARITY + W]

results = []
for label, uniqueness, texture_thresh in [("BM default", 15, 10), ("BM relaxed", 0, 0)]:
    stereo = cv2.StereoBM_create(numDisparities=NUM_DISP, blockSize=15)
    stereo.setUniquenessRatio(uniqueness)
    stereo.setTextureThreshold(texture_thresh)
    disp = stereo.compute(left, right).astype(np.float32) / 16.0
    valid = disp > 0
    results.append({"label": label, "valid_fraction": float(valid.mean()),
                     "mean_disparity": float(disp[valid].mean()) if valid.any() else None})

sgbm = cv2.StereoSGBM_create(minDisparity=0, numDisparities=NUM_DISP, blockSize=15)
disp_sgbm = sgbm.compute(left, right).astype(np.float32) / 16.0
valid_sgbm = disp_sgbm > 0
results.append({"label": "SGBM default", "valid_fraction": float(valid_sgbm.mean()),
                 "mean_disparity": float(disp_sgbm[valid_sgbm].mean())})

out = {"true_disparity": TRUE_DISPARITY, "results": results}
json.dump(out, open("apps/web/public/data/disparity-data.json", "w"), separators=(",", ":"))
for r in results:
    print(f"{r['label']}: valid={r['valid_fraction']*100:.1f}%, mean_disparity={r['mean_disparity']:.2f} (true {TRUE_DISPARITY})")
