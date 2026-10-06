"""Contours of sample-shapes.png for ShapeLab (Module 29), with OpenCV 4.13 reference values for the unit tests.

Run: python scripts/gen_shape_data.py  (writes apps/web/lib/shape-data.json)
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
img = cv2.imread(str(ROOT / "assets/images/generated/sample-shapes.png"), cv2.IMREAD_GRAYSCALE)
cs, _ = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cs = sorted(cs, key=lambda c: (int(cv2.boundingRect(c)[1] > 90), cv2.boundingRect(c)[0]))   # top row, then bottom row
names = ["star", "gear", "bracket", "cross", "oval", "arrow"] * 2
shapes = []
for i, c in enumerate(cs):
    m = cv2.moments(c)
    shapes.append({"name": names[i], "row": i // 6, "pts": c.reshape(-1, 2).tolist(),
                   "m": {k: m[k] for k in ("m00", "m10", "m01", "m20", "m11", "m02", "m30", "m21", "m12", "m03", "nu20", "nu11", "nu02", "nu30", "nu21", "nu12", "nu03")},
                   "hu": cv2.HuMoments(m).ravel().tolist()})
match = {str(k): [[cv2.matchShapes(cs[6 + i], cs[j], k, 0) for j in range(6)] for i in range(6)] for k in (1, 2, 3)}
(ROOT / "apps/web/lib/shape-data.json").write_text(json.dumps({"w": img.shape[1], "h": img.shape[0], "shapes": shapes, "match": match}, separators=(",", ":")))
print(len(shapes), "shapes")
