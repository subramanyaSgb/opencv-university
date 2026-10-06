"""Real cv2.HOGDescriptor + cv2.HOGDescriptor_getDefaultPeopleDetector() decision scores, scanned over
sample-synth-pedestrian.png at one scale, for HogSvmLab (Module 37.3):
apps/web/public/data/hogsvm-data.json (fetched by the lab at run time). HOG's exact bilinear-voting
descriptor (35.3) is impractical to reimplement faithfully in the browser, so this precomputes real
cv2.HOGDescriptor output, the same way SvmLab/TreeLab/BoostLab precompute other cv2.ml models."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"
WIN_W, WIN_H, STRIDE = 64, 128, 8

img = cv2.imread(G + "sample-synth-pedestrian.png", cv2.IMREAD_GRAYSCALE)
H, W = img.shape
hog = cv2.HOGDescriptor()
svm = cv2.HOGDescriptor_getDefaultPeopleDetector()
hog.setSVMDetector(svm)
w_vec, b = svm[:-1], float(svm[-1])

grid = []
for y in range(0, H - WIN_H + 1, STRIDE):
    for x in range(0, W - WIN_W + 1, STRIDE):
        desc = hog.compute(img[y:y + WIN_H, x:x + WIN_W])
        score = float(np.dot(desc.ravel(), w_vec) + b)
        grid.append({"x": x, "y": y, "score": round(score, 4)})

whole_resized = cv2.resize(img, (WIN_W, WIN_H))
whole_score = float(np.dot(hog.compute(whole_resized).ravel(), w_vec) + b)

out = {
    "imageSize": [W, H], "winSize": [WIN_W, WIN_H], "stride": STRIDE,
    "grid": grid, "wholeImageResizedScore": round(whole_score, 4),
}
json.dump(out, open("apps/web/public/data/hogsvm-data.json", "w"), separators=(",", ":"))
best = max(grid, key=lambda g: g["score"])
print("n positions", len(grid), "best", best, "worst", min(g["score"] for g in grid), "whole-resized", round(whole_score, 4))
