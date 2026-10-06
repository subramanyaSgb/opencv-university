"""PCA of 5-D GLCM Haralick features (contrast, homogeneity, energy, correlation, entropy; 35.2), computed
per 8x8 tile of the three 35.1 texture images, projected to 2 principal components, for PcaReduceLab
(Module 36.7): apps/web/public/data/pca-data.json (fetched by the lab at run time). Computed with OpenCV
4.13 (cv2.PCACompute2, cv2.PCAProject)."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"
TILE = 8
LEVELS = 8
NAMES = ["woven", "smooth", "blotchy"]

def quantize(img, levels=LEVELS):
    return (img.astype(np.int32) * levels // 256).astype(np.uint8)

def glcm(tile, dx, dy, levels=LEVELS):
    q = quantize(tile, levels)
    H, W = q.shape
    a = q[max(0, -dy):H - max(0, dy), max(0, -dx):W - max(0, dx)]
    b = q[max(0, dy):H - max(0, -dy), max(0, dx):W - max(0, -dx)]
    idx = a.ravel().astype(np.int64) * levels + b.ravel().astype(np.int64)
    return np.bincount(idx, minlength=levels * levels).reshape(levels, levels).astype(np.float64)

def haralick(mat):
    P = mat / mat.sum() if mat.sum() > 0 else mat
    L = P.shape[0]
    i, j = np.arange(L).reshape(-1, 1), np.arange(L).reshape(1, -1)
    contrast = float(np.sum((i - j) ** 2 * P))
    homogeneity = float(np.sum(P / (1 + (i - j) ** 2)))
    energy = float(np.sum(P ** 2))
    mu_i, mu_j = float(np.sum(i * P)), float(np.sum(j * P))
    sd_i, sd_j = float(np.sqrt(np.sum((i - mu_i) ** 2 * P))), float(np.sqrt(np.sum((j - mu_j) ** 2 * P)))
    corr = float(np.sum((i - mu_i) * (j - mu_j) * P) / (sd_i * sd_j)) if sd_i > 0 and sd_j > 0 else 1.0
    entropy = float(-np.sum(P[P > 0] * np.log2(P[P > 0])))
    return [contrast, homogeneity, energy, corr, entropy]

FEATURE_NAMES = ["contrast", "homogeneity", "energy", "correlation", "entropy"]
X, y = [], []
for i, n in enumerate(NAMES):
    img = cv2.imread(G + f"sample-texture-{n}.png", cv2.IMREAD_GRAYSCALE)
    h, w = img.shape
    for ty in range(h // TILE):
        for tx in range(w // TILE):
            tile = img[ty * TILE:(ty + 1) * TILE, tx * TILE:(tx + 1) * TILE]
            X.append(haralick(glcm(tile, 1, 0)))
            y.append(i)
X = np.array(X, dtype=np.float32)
y = np.array(y)

mean, eigvec, eigval = cv2.PCACompute2(X, mean=None)
proj = cv2.PCAProject(X, mean, eigvec)
total = float(eigval.sum())
explained = (eigval.ravel() / total).tolist()

out = {
    "featureNames": FEATURE_NAMES,
    "names": NAMES,
    "explainedVariance": [round(v, 4) for v in explained],
    "eigenvectors": eigvec.tolist(),
    "points": [{"x": round(float(proj[k, 0]), 4), "y": round(float(proj[k, 1]), 4), "label": NAMES[int(y[k])]} for k in range(len(y))],
}
json.dump(out, open("apps/web/public/data/pca-data.json", "w"), separators=(",", ":"))
print("explained variance:", [round(v, 4) for v in explained])
for n in NAMES:
    pts = proj[y == NAMES.index(n)]
    print(n, "PC1 mean/std", round(float(pts[:, 0].mean()), 2), round(float(pts[:, 0].std()), 2))
