"""Precompute OpenCV 4.13 contour results for ContourLab (Module 24).

Run: python scripts/gen_contour_data.py  (writes apps/web/lib/contour-data.json)
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
img = cv2.imread(str(ROOT / "assets/images/generated/sample-parts.png"), cv2.IMREAD_GRAYSCALE)
r2 = lambda v: round(float(v), 2)
out = {"w": img.shape[1], "h": img.shape[0], "modes": {}}
for name, mode in [("external", cv2.RETR_EXTERNAL), ("list", cv2.RETR_LIST), ("ccomp", cv2.RETR_CCOMP), ("tree", cv2.RETR_TREE)]:
    contours, hier = cv2.findContours(img, mode, cv2.CHAIN_APPROX_NONE)
    simple, _ = cv2.findContours(img, mode, cv2.CHAIN_APPROX_SIMPLE)
    items = []
    for i, c in enumerate(contours):
        m = cv2.moments(c)
        area = cv2.contourArea(c)
        item = {
            "pts": c.reshape(-1, 2).tolist(),
            "simple": len(simple[i]),
            "hier": hier[0][i].tolist(),  # next, previous, first child, parent
            "area": r2(area),
            "perimeter": r2(cv2.arcLength(c, True)),
            "centroid": [r2(m["m10"] / m["m00"]), r2(m["m01"] / m["m00"])] if m["m00"] else None,
            "rect": list(cv2.boundingRect(c)),
            "minRect": [[r2(v) for v in cv2.minAreaRect(c)[0]], [r2(v) for v in cv2.minAreaRect(c)[1]], r2(cv2.minAreaRect(c)[2])],
            "circle": [r2(cv2.minEnclosingCircle(c)[0][0]), r2(cv2.minEnclosingCircle(c)[0][1]), r2(cv2.minEnclosingCircle(c)[1])],
            "hull": cv2.convexHull(c).reshape(-1, 2).tolist(),
            "hullArea": r2(cv2.contourArea(cv2.convexHull(c))),
            "hu": [float(f"{v:.4g}") for v in cv2.HuMoments(m).ravel()],
        }
        if len(c) >= 5:
            (ex, ey), (ea, eb), eang = cv2.fitEllipse(c)
            item["ellipse"] = [r2(ex), r2(ey), r2(ea), r2(eb), r2(eang)]
        hi = cv2.convexHull(c, returnPoints=False)
        d = cv2.convexityDefects(c, hi) if len(hi) > 3 else None
        item["defects"] = [] if d is None else [[int(s), int(e), int(f), r2(depth / 256)] for s, e, f, depth in d.reshape(-1, 4) if depth / 256 > 1]
        items.append(item)
    out["modes"][name] = items
(ROOT / "apps/web/lib/contour-data.json").write_text(json.dumps(out, separators=(",", ":")))
print({k: len(v) for k, v in out["modes"].items()})
