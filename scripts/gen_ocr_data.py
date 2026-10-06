"""A from-scratch template-matching mini-OCR (connected components, 38.2, + cv2.matchTemplate, 32.1-32.2)
on the real "LOT42" image, plus a scale-mismatch degradation test, for OcrEngineLab (Module 38.3):
apps/web/public/data/ocr-data.json (fetched by the lab at run time)."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"
CANVAS = 34
CHARS = "LOT0123456789"

def pad_center(glyph):
    h, w = glyph.shape
    if h > CANVAS or w > CANVAS:
        return None
    out = np.zeros((CANVAS, CANVAS), np.uint8)
    y0, x0 = (CANVAS - h) // 2, (CANVAS - w) // 2
    out[y0:y0 + h, x0:x0 + w] = glyph
    return out

def render_char(ch, scale=1.2):
    img = np.full((70, 70), 255, np.uint8)
    cv2.putText(img, ch, (10, 52), cv2.FONT_HERSHEY_SIMPLEX, scale, 0, 2, cv2.LINE_AA)
    _, bw = cv2.threshold(img, 128, 255, cv2.THRESH_BINARY_INV)
    ys, xs = np.where(bw > 0)
    return bw[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

templates = {ch: pad_center(render_char(ch)) for ch in CHARS}

def scores_for(glyph):
    g = pad_center(glyph)
    if g is None:
        return None
    out = {}
    for ch, t in templates.items():
        out[ch] = round(float(cv2.matchTemplate(g.astype(np.float32), t.astype(np.float32), cv2.TM_CCOEFF_NORMED)[0, 0]), 4)
    return out

img = cv2.imread(G + "sample-charseg-text.png", cv2.IMREAD_GRAYSCALE)
_, bw = cv2.threshold(img, 128, 255, cv2.THRESH_BINARY_INV)
n, labels, stats, centroids = cv2.connectedComponentsWithStats(bw)
boxes = sorted([tuple(int(v) for v in stats[i][:4]) for i in range(1, n)], key=lambda b: b[0])

letters = []
for (x, y, w, h) in boxes:
    glyph = bw[y:y + h, x:x + w]
    sc = scores_for(glyph)
    best = max(sc, key=sc.get)
    letters.append({"box": [x, y, w, h], "scores": sc, "predicted": best})

degraded = {}
for scale in (1.2, 1.3, 1.4, 1.5):
    g = render_char("4", scale=scale)
    sc = scores_for(g)
    degraded[str(scale)] = {"shape": list(g.shape), "scores": sc, "predicted": max(sc, key=sc.get) if sc else None}

out = {"chars": CHARS, "image": "sample-charseg-text.png", "letters": letters, "degraded": degraded}
json.dump(out, open("apps/web/public/data/ocr-data.json", "w"), separators=(",", ":"))
print("recognized:", "".join(l["predicted"] for l in letters))
for s, d in degraded.items():
    print("scale", s, "shape", d["shape"], "predicted", d["predicted"])
