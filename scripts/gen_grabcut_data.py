"""Precompute OpenCV 4.13 GrabCut results for SegmentLab mode "grabcut" (Chapter 27.5).

Run: python scripts/gen_grabcut_data.py  (writes apps/web/lib/grabcut-data.json)
Each case: a rectangle (x, y, w, h), optional strokes (x, y, radius, 0 = sure background / 1 = sure foreground),
and the foreground mask after 1 and 5 iterations, run-length encoded row by row (alternating 0-run, 1-run lengths).
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
img = cv2.imread(str(ROOT / "assets/images/generated/sample-seg.png"))
ids = cv2.imread(str(ROOT / "assets/images/generated/sample-seg-ids.png"), cv2.IMREAD_GRAYSCALE)
H, W = ids.shape

CASES = [
    {"key": "orange", "label": "orange, tight box", "rect": [18, 24, 76, 64], "strokes": [], "target": [1]},
    {"key": "crimson", "label": "crimson, tight box", "rect": [137, 39, 48, 47], "strokes": [], "target": [3]},
    {"key": "crimson-loose", "label": "crimson, loose box (red inside)", "rect": [100, 25, 90, 70], "strokes": [], "target": [3]},
    {"key": "stroke-small", "label": "loose box + small background stroke on red", "rect": [100, 25, 90, 70], "strokes": [[118, 50, 6, 0]], "target": [3]},
    {"key": "stroke-big", "label": "loose box + larger background stroke on red", "rect": [100, 25, 90, 70], "strokes": [[118, 50, 16, 0]], "target": [3]},
    {"key": "orange-loose", "label": "orange, loose box (green box inside)", "rect": [10, 15, 110, 140], "strokes": [], "target": [1]},
]


def rle(mask):
    flat, out, cur, n = mask.ravel().astype(np.uint8), [], 0, 0
    for v in flat:
        if v == cur:
            n += 1
        else:
            out.append(n); cur, n = v, 1
    out.append(n)
    return out


cases = []
for c in CASES:
    res = {}
    for it in (1, 5):
        cv2.setRNGSeed(0)
        bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
        x, y, w, h = c["rect"]
        if c["strokes"]:
            m = np.zeros((H, W), np.uint8)
            m[y:y + h, x:x + w] = cv2.GC_PR_FGD
            for sx, sy, r, v in c["strokes"]:
                cv2.circle(m, (sx, sy), r, cv2.GC_FGD if v else cv2.GC_BGD, -1)
            cv2.grabCut(img, m, None, bgd, fgd, it, cv2.GC_INIT_WITH_MASK)
        else:
            m = np.zeros((H, W), np.uint8)
            cv2.grabCut(img, m, tuple(c["rect"]), bgd, fgd, it, cv2.GC_INIT_WITH_RECT)
        fg = (m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)
        g = np.isin(ids, c["target"])
        res[str(it)] = {"rle": rle(fg), "iou": round(float((fg & g).sum() / (fg | g).sum()), 3), "area": int(fg.sum())}
    cases.append({k: c[k] for k in ("key", "label", "rect", "strokes")} | {"result": res})

(ROOT / "apps/web/lib/grabcut-data.json").write_text(json.dumps({"w": W, "h": H, "cases": cases}, separators=(",", ":")))
print([(c["key"], c["result"]["1"]["iou"], c["result"]["5"]["iou"]) for c in cases])
