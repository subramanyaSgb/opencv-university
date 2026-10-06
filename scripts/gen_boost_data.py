"""AdaBoost (cv2.ml.Boost, REAL type, depth-1 stumps) decision regions and training accuracy for BoostLab
(Module 36.6), at several weak-learner counts and two weightTrimRate settings, on a binary Woven-vs-Blotchy
subset of the 36.1-36.5 texture-tile feature space (cv2.ml.Boost is a 2-class algorithm -- see the chapter's
"Where it fails"): apps/web/public/data/boost-data.json (fetched by the lab at run time)."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"
TILE = 8
NAMES = ["woven", "blotchy"]
X_DOMAIN = (80.0, 200.0)
Y_DOMAIN = (0.0, 60.0)
GRID = 60
WEAK_COUNTS = [1, 5, 10, 30, 100]

def tile_features(img):
    h, w = img.shape
    feats = []
    for ty in range(h // TILE):
        for tx in range(w // TILE):
            patch = img[ty * TILE:(ty + 1) * TILE, tx * TILE:(tx + 1) * TILE].astype(np.float64)
            feats.append((patch.mean(), patch.std()))
    return np.array(feats)

classes = {n: tile_features(cv2.imread(G + f"sample-texture-{n}.png", cv2.IMREAD_GRAYSCALE)) for n in NAMES}
X = np.vstack([classes[n] for n in NAMES]).astype(np.float32)
y = np.array(sum(([i] * len(classes[n]) for i, n in enumerate(NAMES)), []), dtype=np.int32)

gx = np.linspace(X_DOMAIN[0], X_DOMAIN[1], GRID, dtype=np.float32)
gy = np.linspace(Y_DOMAIN[0], Y_DOMAIN[1], GRID, dtype=np.float32)
grid_pts = np.array([[x, yv] for yv in gy for x in gx], dtype=np.float32)

def run(weak_count, trim_rate):
    bst = cv2.ml.Boost_create()
    bst.setBoostType(cv2.ml.Boost_REAL)
    bst.setWeakCount(weak_count)
    bst.setMaxDepth(1)
    bst.setWeightTrimRate(trim_rate)
    bst.train(X, cv2.ml.ROW_SAMPLE, y)
    acc = float((bst.predict(X)[1].ravel() == y).mean())
    region = bst.predict(grid_pts)[1].ravel().astype(int).tolist()
    return {"trainAccuracy": round(acc, 4), "region": region}

out = {
    "names": NAMES, "xDomain": list(X_DOMAIN), "yDomain": list(Y_DOMAIN), "grid": GRID,
    "points": [{"x": float(x), "y": float(s), "label": NAMES[int(l)]} for (x, s), l in zip(X.tolist(), y.tolist())],
    "weakCounts": WEAK_COUNTS,
    "default": {str(k): run(k, 0.95) for k in WEAK_COUNTS},
    "disabledTrim": {str(k): run(k, 1.0) for k in WEAK_COUNTS},
}
json.dump(out, open("apps/web/public/data/boost-data.json", "w"), separators=(",", ":"))
print("default (weightTrimRate=0.95):", {k: v["trainAccuracy"] for k, v in out["default"].items()})
print("disabled (weightTrimRate=1.0):", {k: v["trainAccuracy"] for k, v in out["disabledTrim"].items()})
