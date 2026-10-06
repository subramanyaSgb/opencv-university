"""Real cv2.createBackgroundSubtractorMOG2/KNN results on the same two-object synthetic
video as 40.1 (Module 40.2, BgSubLab): apps/web/public/data/bgsub-data.json.

Closes 40.1's cliffhanger: background subtraction marks one real object as one real blob
(not two, unlike two-frame differencing), at the cost of a learning/adaptation period.
"""
import json

import cv2
import numpy as np

H, W = 120, 200
yy, xx = np.mgrid[0:H, 0:W]
bg = 70 + 0.5 * xx + 12 * np.sin(xx / 5) * np.sin(yy / 7)
rng = np.random.default_rng(3)

N = 60
frames, true_boxes = [], []
for t in range(N):
    f = bg.copy()
    x1, y1, s1 = 10 + 3 * t, 20, 14
    x2, y2, s2 = W - 20 - 2 * t, 80, 10
    boxes = []
    if x1 + s1 < W:
        f[y1:y1 + s1, x1:x1 + s1] = 200
        boxes.append([int(x1), y1, s1, s1])
    if x2 - s2 > 0:
        f[y2:y2 + s2, max(0, x2 - s2):x2] = 60
        boxes.append([int(max(0, x2 - s2)), y2, s2, s2])
    f += rng.normal(0, 3, f.shape)
    frames.append(np.clip(np.rint(f), 0, 255).astype(np.uint8))
    true_boxes.append(boxes)


def run(subtractor):
    out = []
    for f in frames:
        mask = subtractor.apply(f)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        n, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)
        boxes = [[int(x), int(y), int(w), int(h)] for x, y, w, h, area in stats[1:] if area >= 20]
        out.append(boxes)
    return out

mog2 = cv2.createBackgroundSubtractorMOG2(history=30, varThreshold=16, detectShadows=False)
knn = cv2.createBackgroundSubtractorKNN(history=30, dist2Threshold=400, detectShadows=False)

out = {
    "width": W, "height": H,
    "true_boxes": true_boxes,
    "mog2_boxes": run(mog2),
    "knn_boxes": run(knn),
}
json.dump(out, open("apps/web/public/data/bgsub-data.json", "w"), separators=(",", ":"))
for t in (5, 20, 30, 40):
    print(f"frame {t}: true {len(true_boxes[t])}, mog2 {len(out['mog2_boxes'][t])}, knn {len(out['knn_boxes'][t])}")
