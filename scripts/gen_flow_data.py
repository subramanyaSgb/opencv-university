"""Real cv2.calcOpticalFlowPyrLK / calcOpticalFlowFarneback results (Module 40.3, FlowLab):
apps/web/public/data/flow-data.json.

Two real cases: a clean whole-scene pan with known ground truth (sample-scene.png shifted by
a known (dx, dy)), and the real sample-ball-25fps.mp4 clip (frame 10 -> 11), where the ball's
real motion should stand out from the flat background in the dense flow field.
"""
import json

import cv2
import numpy as np

STEP = 16  # sampling grid for the arrow visualisation


def sample_grid(flow):
    h, w = flow.shape[:2]
    pts = []
    for y in range(STEP // 2, h, STEP):
        for x in range(STEP // 2, w, STEP):
            dx, dy = flow[y, x]
            pts.append([x, y, float(dx), float(dy)])
    return pts


out = {"cases": {}}

# --- Case 1: clean whole-scene pan, known ground truth ---------------------------------
base = cv2.imread("assets/images/generated/sample-scene.png", cv2.IMREAD_GRAYSCALE)
H, W = base.shape
dx_true, dy_true = 3.0, -1.0
matrix = np.float32([[1, 0, dx_true], [0, 1, dy_true]])
shifted = cv2.warpAffine(base, matrix, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

p0 = cv2.goodFeaturesToTrack(base, maxCorners=40, qualityLevel=0.1, minDistance=10)
p1, status, err = cv2.calcOpticalFlowPyrLK(base, shifted, p0, None)
good = status.flatten() == 1
sparse = [[float(p0[i, 0, 0]), float(p0[i, 0, 1]), float(p1[i, 0, 0] - p0[i, 0, 0]), float(p1[i, 0, 1] - p0[i, 0, 1])]
          for i in range(len(p0)) if good[i]]

flow = cv2.calcOpticalFlowFarneback(base, shifted, None, 0.5, 3, 15, 3, 5, 1.2, 0)
margin = 20
central = flow[margin:H - margin, margin:W - margin]
out["cases"]["pan"] = {
    "width": W, "height": H, "true_dx": dx_true, "true_dy": dy_true,
    "sparse": sparse, "dense": sample_grid(flow),
    "lk_mean": [float(np.mean([s[2] for s in sparse])), float(np.mean([s[3] for s in sparse]))],
    "farneback_mean_central": [float(central[:, :, 0].mean()), float(central[:, :, 1].mean())],
}

# --- Case 2: the real sample-ball-25fps.mp4 clip, frame 10 -> 11 -----------------------
cap = cv2.VideoCapture("assets/videos/generated/sample-ball-25fps.mp4")
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
cap.release()

flow2 = cv2.calcOpticalFlowFarneback(frames[10], frames[11], None, 0.5, 3, 15, 3, 5, 1.2, 0)
out["cases"]["ball"] = {
    "width": frames[0].shape[1], "height": frames[0].shape[0],
    "dense": sample_grid(flow2),
}

json.dump(out, open("apps/web/public/data/flow-data.json", "w"), separators=(",", ":"))
print("pan: LK mean", out["cases"]["pan"]["lk_mean"], " Farneback mean (central)", out["cases"]["pan"]["farneback_mean_central"])
print("ball: dense flow points:", len(out["cases"]["ball"]["dense"]))
