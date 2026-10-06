"""Real chained cv2.findEssentialMat / recoverPose visual odometry (43.2) around a closed
60-step circular loop, plus a real, simple loop-closure correction (Module 43.3, SlamLab):
apps/web/public/data/slam-data.json.
"""
import json

import cv2
import numpy as np

K = np.array([[800.0, 0, 320], [0, 800, 240], [0, 0, 1]])
NUM_STEPS = 60
STEP_LEN = 1.0
DELTA_YAW = 2 * np.pi / NUM_STEPS
NOISE_STD = 0.5


def project(pts, R, t):
    rvec, _ = cv2.Rodrigues(R)
    img, _ = cv2.projectPoints(pts, rvec, t, K, None)
    return img.reshape(-1, 2)


def run():
    rng = np.random.default_rng(13)
    pts3d = rng.uniform(low=[-40, -8, -40], high=[40, 8, 40], size=(1500, 3))

    poses_true = []
    R_cur, C_cur = np.eye(3), np.array([0.0, 0.0, 0.0])
    poses_true.append((R_cur.copy(), C_cur.copy()))
    for _ in range(NUM_STEPS):
        world_dir = R_cur.T @ np.array([0.0, 0.0, 1.0])
        C_cur = C_cur + world_dir * STEP_LEN
        yaw = cv2.Rodrigues(np.array([0.0, DELTA_YAW, 0.0]))[0]
        R_cur = yaw @ R_cur
        poses_true.append((R_cur.copy(), C_cur.copy()))

    def pts_in_frame(i):
        R, C = poses_true[i]
        t = -R @ C.reshape(3, 1)
        pts2d = project(pts3d, R, t)
        Pc = (R @ pts3d.T + t).T
        valid = (Pc[:, 2] > 0.5) & (pts2d[:, 0] > 0) & (pts2d[:, 0] < 640) & (pts2d[:, 1] > 0) & (pts2d[:, 1] < 480)
        return pts2d + rng.normal(0, NOISE_STD, pts2d.shape), valid

    R_est_accum, C_est = np.eye(3), np.array([0.0, 0.0, 0.0])
    est_positions = [C_est.copy()]
    inliers_log = []

    for i in range(NUM_STEPS):
        pts_a, va = pts_in_frame(i)
        pts_b, vb = pts_in_frame(i + 1)
        valid = va & vb
        pa, pb = pts_a[valid], pts_b[valid]
        E, _ = cv2.findEssentialMat(pa, pb, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
        n_in, R_rel, t_rel, _ = cv2.recoverPose(E, pa, pb, K)
        inliers_log.append(int(n_in))
        true_step = float(np.linalg.norm(poses_true[i + 1][1] - poses_true[i][1]))
        R_next_est = R_rel @ R_est_accum
        world_step_dir = -(R_next_est.T @ t_rel.ravel())
        world_step_dir = world_step_dir / np.linalg.norm(world_step_dir)
        C_est = C_est + world_step_dir * true_step
        R_est_accum = R_next_est
        est_positions.append(C_est.copy())

    est_positions = np.array(est_positions)
    true_positions = np.array([p[1] for p in poses_true])
    err = np.linalg.norm(est_positions - true_positions, axis=1)

    closing_error = est_positions[-1] - est_positions[0]
    corrected = np.array([est_positions[i] - closing_error * (i / NUM_STEPS) for i in range(NUM_STEPS + 1)])
    err_corrected = np.linalg.norm(corrected - true_positions, axis=1)

    return {
        "num_steps": NUM_STEPS,
        "circumference": NUM_STEPS * STEP_LEN,
        "min_inliers": min(inliers_log),
        "mean_inliers": round(sum(inliers_log) / len(inliers_log), 2),
        "max_inliers": max(inliers_log),
        "loop_closure_gap": round(float(np.linalg.norm(closing_error)), 4),
        "mean_error_before": round(float(err.mean()), 4),
        "mean_error_after": round(float(err_corrected.mean()), 4),
        "max_error_before": round(float(err.max()), 4),
        "max_error_after": round(float(err_corrected.max()), 4),
        "true_x": [round(float(p[0]), 4) for p in true_positions],
        "true_z": [round(float(p[2]), 4) for p in true_positions],
        "est_x": [round(float(p[0]), 4) for p in est_positions],
        "est_z": [round(float(p[2]), 4) for p in est_positions],
        "corrected_x": [round(float(p[0]), 4) for p in corrected],
        "corrected_z": [round(float(p[2]), 4) for p in corrected],
        "error_before": [round(float(e), 4) for e in err],
        "error_after": [round(float(e), 4) for e in err_corrected],
    }


out = run()
json.dump(out, open("apps/web/public/data/slam-data.json", "w"), separators=(",", ":"))
print(json.dumps({k: v for k, v in out.items() if not isinstance(v, list)}, indent=None))
