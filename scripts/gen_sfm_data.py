"""Real cv2.findEssentialMat / recoverPose / triangulatePoints results on synthetic
two-view scenes with known ground truth (Module 43.1, SfmLab):
apps/web/public/data/sfm-data.json.
"""
import json

import cv2
import numpy as np

K = np.array([[800.0, 0, 320], [0, 800, 240], [0, 0, 1]])


def project(pts3d, R, t, K):
    rvec, _ = cv2.Rodrigues(R)
    img, _ = cv2.projectPoints(pts3d, rvec, t, K, None)
    return img.reshape(-1, 2)


def run_scene(seed, baseline, rot_y, noise_std):
    rng = np.random.default_rng(seed)
    N = 80
    pts3d = rng.uniform(low=[-2, -2, 5], high=[2, 2, 10], size=(N, 3))
    R1, t1 = np.eye(3), np.zeros((3, 1))
    R2_true = cv2.Rodrigues(np.array([0.0, rot_y, 0.0]))[0]
    t2_true = np.array([[baseline], [0.02 if baseline else 0.0], [0.0]])

    pts1 = project(pts3d, R1, t1, K)
    pts2 = project(pts3d, R2_true, t2_true, K)
    pts1n = pts1 + rng.normal(0, noise_std, pts1.shape)
    pts2n = pts2 + rng.normal(0, noise_std, pts2.shape)

    E, _ = cv2.findEssentialMat(pts1n, pts2n, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
    n_inliers, R_est, t_est, _ = cv2.recoverPose(E, pts1n, pts2n, K)

    rot_err_deg = float(np.degrees(np.arccos(np.clip((np.trace(R_est.T @ R2_true) - 1) / 2, -1, 1))))
    if baseline > 0:
        t_true_dir = t2_true.ravel() / np.linalg.norm(t2_true.ravel())
        t_err_deg = float(np.degrees(np.arccos(np.clip(np.dot(t_est.ravel(), t_true_dir), -1, 1))))
    else:
        t_err_deg = None  # translation direction is undefined for pure rotation

    P1 = K @ np.hstack([R1, t1])
    P2_est = K @ np.hstack([R_est, t_est])
    pts4d = cv2.triangulatePoints(P1, P2_est, pts1n.T, pts2n.T)
    w = pts4d[3]
    pts3d_est = (pts4d[:3] / w).T

    if baseline > 0:
        scale = float(np.median(
            np.linalg.norm(pts3d_est - pts3d_est.mean(0), axis=1)
            / np.linalg.norm(pts3d - pts3d.mean(0), axis=1)
        ))
        pts3d_rescaled = pts3d_est / scale
        err = np.linalg.norm(pts3d_rescaled - pts3d, axis=1)
        mean_err = float(err.mean())
        max_err = float(err.max())
        rel_err_pct = float(mean_err / np.linalg.norm(pts3d, axis=1).mean() * 100)
    else:
        scale, mean_err, max_err, rel_err_pct = None, None, None, None

    return {
        "n_cheirality_inliers": int(n_inliers),
        "n_points": int(len(pts1n)),
        "rotation_error_deg": round(rot_err_deg, 4),
        "translation_angle_error_deg": round(t_err_deg, 4) if t_err_deg is not None else None,
        "recovered_scale_factor": round(scale, 6) if scale is not None else None,
        "mean_3d_error": round(mean_err, 5) if mean_err is not None else None,
        "max_3d_error": round(max_err, 5) if max_err is not None else None,
        "relative_error_pct": round(rel_err_pct, 3) if rel_err_pct is not None else None,
        "gt_depth_sample": [round(float(z), 3) for z in pts3d[:5, 2]],
        "est_depth_sample_unit_scale": [round(float(z), 3) for z in pts3d_est[:5, 2]],
        "pts1_sample": [[round(float(x), 2), round(float(y), 2)] for x, y in pts1n[:5]],
        "pts2_sample": [[round(float(x), 2), round(float(y), 2)] for x, y in pts2n[:5]],
    }


scenes = {
    "wide-baseline": run_scene(seed=7, baseline=1.0, rot_y=0.05, noise_std=0.5),
    "narrow-baseline": run_scene(seed=11, baseline=0.05, rot_y=0.01, noise_std=0.5),
    "pure-rotation": run_scene(seed=3, baseline=0.0, rot_y=0.1, noise_std=0.0),
}

out = {"K": K.tolist(), "scenes": scenes}
json.dump(out, open("apps/web/public/data/sfm-data.json", "w"), separators=(",", ":"))
for name, s in scenes.items():
    print(name, json.dumps(s, indent=None))
