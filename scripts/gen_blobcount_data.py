"""Real cv2.absdiff + connectedComponentsWithStats blob counts on a synthetic two-object
video (Module 40.1, BlobCountLab): apps/web/public/data/blobcount-data.json.

Two uniform objects move across a textured background at different speeds; two-frame
differencing is run frame by frame, and connected components (area >= 20 px) are counted,
showing the real "one object -> two blobs" effect from 14.5's own ghost/edge finding.
"""
import json

import cv2
import numpy as np

H, W = 120, 200
yy, xx = np.mgrid[0:H, 0:W]
bg = 70 + 0.5 * xx + 12 * np.sin(xx / 5) * np.sin(yy / 7)
rng = np.random.default_rng(3)

N = 40
T = 25
frames, true_counts, true_boxes = [], [], []
for t in range(N):
    f = bg.copy()
    x1, y1, s1 = 10 + 4 * t, 20, 14
    x2, y2, s2 = W - 20 - 2 * t, 80, 10
    boxes = []
    if x1 + s1 < W:
        f[y1:y1 + s1, x1:x1 + s1] = 200
        boxes.append([x1, y1, s1, s1])
    if x2 - s2 > 0:
        f[y2:y2 + s2, max(0, x2 - s2):x2] = 60
        boxes.append([max(0, x2 - s2), y2, s2, s2])
    f += rng.normal(0, 3, f.shape)
    frames.append(np.clip(np.rint(f), 0, 255).astype(np.uint8))
    true_counts.append(len(boxes))
    true_boxes.append(boxes)

out_frames = []
prev = None
for t in range(N):
    gray = frames[t]
    if prev is None:
        out_frames.append({"detected": 0, "boxes": []})
    else:
        mask = (cv2.absdiff(gray, prev) > T).astype(np.uint8) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        n, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)
        boxes = [[int(x), int(y), int(w), int(h)] for x, y, w, h, area in stats[1:] if area >= 20]
        out_frames.append({"detected": len(boxes), "boxes": boxes})
    prev = gray

out = {"width": W, "height": H, "true_counts": true_counts, "true_boxes": true_boxes, "frames": out_frames}
json.dump(out, open("apps/web/public/data/blobcount-data.json", "w"), separators=(",", ":"))
print("true counts (steady state):", true_counts[5])
print("detected blobs at frame 5:", out_frames[5]["detected"])
print("detected blobs at frame 20:", out_frames[20]["detected"])
