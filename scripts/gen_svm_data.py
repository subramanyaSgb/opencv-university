"""Linear and RBF cv2.ml.SVM decision regions and support vectors for SvmLab (Module 36.4), computed with
OpenCV 4.13 on the same 36.1-36.3 texture-tile feature space: apps/web/public/data/svm-data.json
(fetched by the lab at run time). A real SVM solver is too much to reimplement faithfully in the browser,
so (like DescLab/BowLab for SIFT) this precomputes the real cv2.ml.SVM behaviour instead of approximating it."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"
TILE = 8
NAMES = ["woven", "smooth", "blotchy"]
X_DOMAIN = (80.0, 200.0)
Y_DOMAIN = (0.0, 60.0)
GRID = 60

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

svm_lin = cv2.ml.SVM_create()
svm_lin.setType(cv2.ml.SVM_C_SVC)
svm_lin.setKernel(cv2.ml.SVM_LINEAR)
svm_lin.setC(1.0)
svm_lin.train(X, cv2.ml.ROW_SAMPLE, y)

svm_rbf = cv2.ml.SVM_create()
svm_rbf.setType(cv2.ml.SVM_C_SVC)
svm_rbf.setKernel(cv2.ml.SVM_RBF)
svm_rbf.trainAuto(X, cv2.ml.ROW_SAMPLE, y)

gx = np.linspace(X_DOMAIN[0], X_DOMAIN[1], GRID, dtype=np.float32)
gy = np.linspace(Y_DOMAIN[0], Y_DOMAIN[1], GRID, dtype=np.float32)
grid_pts = np.array([[x, yv] for yv in gy for x in gx], dtype=np.float32)

def region(svm):
    _, pred = svm.predict(grid_pts)
    return pred.ravel().astype(int).tolist()

out = {
    "names": NAMES,
    "xDomain": list(X_DOMAIN), "yDomain": list(Y_DOMAIN), "grid": GRID,
    "points": [{"x": float(x), "y": float(s), "label": NAMES[int(l)]} for (x, s), l in zip(X.tolist(), y.tolist())],
    "linear": {"region": region(svm_lin), "supportVectors": svm_lin.getSupportVectors().tolist(),
               "trainAccuracy": round(float((svm_lin.predict(X)[1].ravel() == y).mean()), 4)},
    "rbf": {"region": region(svm_rbf), "supportVectors": svm_rbf.getSupportVectors().tolist(),
            "trainAccuracy": round(float((svm_rbf.predict(X)[1].ravel() == y).mean()), 4),
            "C": round(float(svm_rbf.getC()), 4), "gamma": round(float(svm_rbf.getGamma()), 4)},
}
json.dump(out, open("apps/web/public/data/svm-data.json", "w"), separators=(",", ":"))
print("linear acc", out["linear"]["trainAccuracy"], "n_sv", len(out["linear"]["supportVectors"]))
print("rbf    acc", out["rbf"]["trainAccuracy"], "n_sv", len(out["rbf"]["supportVectors"]), "C", out["rbf"]["C"], "gamma", out["rbf"]["gamma"])
