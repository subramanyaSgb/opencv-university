"""Decision-tree (various depths) and random-forest cv2.ml decision regions for TreeLab (Module 36.5),
computed with OpenCV 4.13 on the same 36.1-36.4 texture-tile feature space:
apps/web/public/data/tree-data.json (fetched by the lab at run time). A real CART/forest trainer is too
much to reimplement faithfully in the browser, so (like SvmLab) this precomputes real cv2.ml behaviour."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"
TILE = 8
NAMES = ["woven", "smooth", "blotchy"]
X_DOMAIN = (80.0, 200.0)
Y_DOMAIN = (0.0, 60.0)
GRID = 60
DEPTHS = [1, 2, 3, 5, 10]

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

def region(model):
    _, pred = model.predict(grid_pts)
    return pred.ravel().astype(int).tolist()

trees = {}
for depth in DEPTHS:
    dt = cv2.ml.DTrees_create()
    dt.setMaxDepth(depth)
    dt.setCVFolds(0)
    dt.train(X, cv2.ml.ROW_SAMPLE, y)
    acc = float((dt.predict(X)[1].ravel() == y).mean())
    trees[str(depth)] = {"region": region(dt), "trainAccuracy": round(acc, 4)}

rt = cv2.ml.RTrees_create()
rt.setMaxDepth(10)
rt.train(X, cv2.ml.ROW_SAMPLE, y)
forest_acc = float((rt.predict(X)[1].ravel() == y).mean())
oob = float(rt.getOOBError())
tc = rt.getTermCriteria()

out = {
    "names": NAMES, "xDomain": list(X_DOMAIN), "yDomain": list(Y_DOMAIN), "grid": GRID,
    "points": [{"x": float(x), "y": float(s), "label": NAMES[int(l)]} for (x, s), l in zip(X.tolist(), y.tolist())],
    "trees": trees,
    "forest": {"region": region(rt), "trainAccuracy": round(forest_acc, 4), "oobError": round(oob, 4), "nTrees": int(tc[1])},
}
json.dump(out, open("apps/web/public/data/tree-data.json", "w"), separators=(",", ":"))
print({d: trees[d]["trainAccuracy"] for d in trees}, "forest", forest_acc, "oob", oob, "nTrees", tc[1])
