"""Real NumPy point-cloud operations (voxel downsampling, statistical outlier removal,
local-PCA normal estimation) on a synthetic noisy sphere with injected outliers
(Module 44.1, PointCloudLab): apps/web/public/data/pointcloud-data.json.
Core OpenCV 4.13 ships no point-cloud module (that's new in 5.0's `ptcloud`, 8.10) --
every operation here is real, from-scratch NumPy, verified against the known sphere.
"""
import json

import numpy as np

R = 10.0
N_SURF = 4000
N_OUT = 200
NOISE_STD = 0.05


def build_cloud(seed=21):
    rng = np.random.default_rng(seed)
    i = np.arange(N_SURF)
    phi = np.arccos(1 - 2 * (i + 0.5) / N_SURF)
    theta = np.pi * (1 + 5 ** 0.5) * i
    surface = np.stack([R * np.sin(phi) * np.cos(theta), R * np.sin(phi) * np.sin(theta), R * np.cos(phi)], axis=1)
    true_normals = surface / np.linalg.norm(surface, axis=1, keepdims=True)
    pts = surface + rng.normal(0, NOISE_STD, surface.shape)
    outliers = rng.uniform(-20, 20, (N_OUT, 3))
    return rng, pts, true_normals, outliers


def voxel_downsample(points, voxel_size):
    keys = np.floor(points / voxel_size).astype(np.int64)
    uniq, inv = np.unique(keys, axis=0, return_inverse=True)
    out = np.zeros((len(uniq), 3))
    for k in range(len(uniq)):
        out[k] = points[inv == k].mean(axis=0)
    return out


def knn_mean_dist(points, k, chunk=500):
    n = len(points)
    out = np.zeros(n)
    for start in range(0, n, chunk):
        end = min(start + chunk, n)
        d = np.linalg.norm(points[start:end, None, :] - points[None, :, :], axis=2)
        d.sort(axis=1)
        out[start:end] = d[:, 1:k + 1].mean(axis=1)
    return out


def estimate_normal(points, idx, k):
    d = np.linalg.norm(points - points[idx], axis=1)
    nbr_idx = np.argsort(d)[1:k + 1]
    nbrs = points[nbr_idx]
    centroid = nbrs.mean(axis=0)
    cov = (nbrs - centroid).T @ (nbrs - centroid) / len(nbrs)
    w, v = np.linalg.eigh(cov)
    return v[:, 0]


rng, pts, true_normals, outliers = build_cloud()
cloud = np.vstack([pts, outliers])
is_true_outlier = np.array([False] * N_SURF + [True] * N_OUT)

# 1. Voxel downsampling (on clean surface points, no outliers)
downsample_results = []
for voxel_size in [0.5, 1.0, 2.0]:
    down = voxel_downsample(pts, voxel_size)
    radius_err = np.abs(np.linalg.norm(down, axis=1) - R)
    downsample_results.append({
        "voxel_size": voxel_size, "n_out": int(len(down)), "mean_radius_error": round(float(radius_err.mean()), 4),
    })

# 2. Statistical outlier removal
K_SOR = 10
mean_knn = knn_mean_dist(cloud, K_SOR)
g_mean, g_std = float(mean_knn.mean()), float(mean_knn.std())
sor_results = []
for std_ratio in [1.0, 2.0, 3.0]:
    threshold = g_mean + std_ratio * g_std
    flagged = mean_knn > threshold
    tp = int((flagged & is_true_outlier).sum())
    fp = int((flagged & ~is_true_outlier).sum())
    sor_results.append({
        "std_ratio": std_ratio, "n_flagged": int(flagged.sum()),
        "true_outliers_caught": tp, "detection_rate_pct": round(tp / N_OUT * 100, 1),
        "false_positives": fp, "false_positive_rate_pct": round(fp / N_SURF * 100, 2),
    })

# 3. Normal estimation accuracy vs neighbourhood size k
sample_idx = rng.choice(N_SURF, 200, replace=False)
normal_results = []
for k in [5, 10, 20, 40, 80]:
    errs = []
    for idx in sample_idx:
        n_est = estimate_normal(pts, idx, k)
        cos_sim = abs(np.dot(n_est, true_normals[idx]))
        errs.append(np.degrees(np.arccos(np.clip(cos_sim, -1, 1))))
    errs = np.array(errs)
    normal_results.append({"k": k, "mean_angular_error_deg": round(float(errs.mean()), 3), "max_angular_error_deg": round(float(errs.max()), 3)})

# A visualization-sized subsample for the browser (2D projection, x vs y)
viz_idx = rng.choice(N_SURF, 600, replace=False)
viz_cloud_x = [round(float(v), 3) for v in pts[viz_idx, 0]]
viz_cloud_y = [round(float(v), 3) for v in pts[viz_idx, 1]]
viz_outlier_x = [round(float(v), 3) for v in outliers[:, 0]]
viz_outlier_y = [round(float(v), 3) for v in outliers[:, 1]]
# which of the SAME outliers get flagged at std_ratio=2.0 (for the viz toggle)
mean_knn_outliers = mean_knn[N_SURF:]
flagged_viz = (mean_knn_outliers > (g_mean + 2.0 * g_std)).tolist()

out = {
    "sphere_radius": R,
    "n_surface": N_SURF,
    "n_outliers": N_OUT,
    "noise_std": NOISE_STD,
    "downsample": downsample_results,
    "sor_k": K_SOR,
    "sor_global_mean": round(g_mean, 4),
    "sor_global_std": round(g_std, 4),
    "sor": sor_results,
    "normals": normal_results,
    "viz_cloud_x": viz_cloud_x,
    "viz_cloud_y": viz_cloud_y,
    "viz_outlier_x": viz_outlier_x,
    "viz_outlier_y": viz_outlier_y,
    "viz_outlier_flagged": flagged_viz,
}
json.dump(out, open("apps/web/public/data/pointcloud-data.json", "w"), separators=(",", ":"))
print(json.dumps({k: v for k, v in out.items() if not isinstance(v, list)}, indent=None))
print("downsample:", downsample_results)
print("sor:", sor_results)
print("normals:", normal_results)
