"""Real chained cv2.findEssentialMat / recoverPose visual-odometry results on a synthetic
20-frame forward-moving camera path with known ground truth (Module 43.2, VoLab):
apps/web/public/data/vo-data.json.
"""
import json

import cv2
import numpy as np

K = np.array([[800.0, 0, 320], [0, 800, 240], [0, 0, 1]])
NUM_FRAMES = 20
STEP = 0.3
NOISE_STD = 0.5


def project(pts3d, R, t, K):
    rvec, _ = cv2.Rodrigues(R)
    img, _ = cv2.projectPoints(pts3d, rvec, t, K, None)
    return img.reshape(-1, 2)


def run():
    rng = np.random.default_rng(5)
    N = 200
    pts3d = rng.uniform(low=[-5, -5, 3], high=[5, 5, 25], size=(N, 3))
    cam_true = [np.array([0.0, 0.0, -i * STEP]) for i in range(NUM_FRAMES)]

    def pts_in_frame(i):
        C = cam_true[i]
        t = -C.reshape(3, 1)
        pts2d = project(pts3d, np.eye(3), t, K)
        Pc = (pts3d + t.ravel()).reshape(-1, 3)
        valid = (Pc[:, 2] > 0.5) & (pts2d[:, 0] > 0) & (pts2d[:, 0] < 640) & (pts2d[:, 1] > 0) & (pts2d[:, 1] < 480)
        return pts2d, valid

    est_oracle = [np.zeros(3)]
    est_naive = [np.zeros(3)]
    inliers_log, npoints_log = [], []
    sign_check = None

    for i in range(NUM_FRAMES - 1):
        pts_a, va = pts_in_frame(i)
        pts_b, vb = pts_in_frame(i + 1)
        valid = va & vb
        pa = pts_a[valid] + rng.normal(0, NOISE_STD, (valid.sum(), 2))
        pb = pts_b[valid] + rng.normal(0, NOISE_STD, (valid.sum(), 2))
        E, _ = cv2.findEssentialMat(pa, pb, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
        n_inliers, R_rel, t_rel, _ = cv2.recoverPose(E, pa, pb, K)
        inliers_log.append(int(n_inliers))
        npoints_log.append(int(valid.sum()))

        true_step = float(np.linalg.norm(cam_true[i + 1] - cam_true[i]))
        true_dir = (cam_true[i + 1] - cam_true[i]) / true_step
        motion_dir = -t_rel.ravel()  # verified: cv2.recoverPose's t points new-camera -> old-camera
        if sign_check is None:
            sign_check = float(np.dot(t_rel.ravel(), true_dir))

        est_oracle.append(est_oracle[-1] + motion_dir * true_step)
        est_naive.append(est_naive[-1] + motion_dir * 1.0)

    est_oracle = np.array(est_oracle)
    est_naive = np.array(est_naive)
    true_pos = np.array(cam_true)
    err_oracle = np.linalg.norm(est_oracle - true_pos, axis=1)
    err_naive_dist_ratio = float(np.linalg.norm(est_naive[-1]) / np.linalg.norm(true_pos[-1]))

    return {
        "num_frames": NUM_FRAMES,
        "true_step": STEP,
        "noise_std": NOISE_STD,
        "sign_check_dot_product": round(sign_check, 6),
        "inliers": inliers_log,
        "n_points": npoints_log,
        "true_z": [round(float(p[2]), 4) for p in true_pos],
        "oracle_scale_z": [round(float(p[2]), 4) for p in est_oracle],
        "oracle_scale_error": [round(float(e), 4) for e in err_oracle],
        "naive_unit_scale_z": [round(float(p[2]), 4) for p in est_naive],
        "naive_unit_scale_final_distance_ratio": round(err_naive_dist_ratio, 4),
    }


out = run()
json.dump(out, open("apps/web/public/data/vo-data.json", "w"), separators=(",", ":"))
print(json.dumps(out, indent=None))
