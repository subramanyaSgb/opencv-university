"""Real cv2.stereoCalibrate and cv2.calibrateHandEye results on known synthetic rigs
(Module 41.8, HandEyeLab): apps/web/public/data/handeye-data.json.
"""
import json

import cv2
import numpy as np

K = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])
dist = np.zeros(5)
cols, rows, sq = 9, 6, 25.0
objp = np.zeros((rows * cols, 3), np.float64)
objp[:, :2] = np.mgrid[0:cols, 0:rows].T.reshape(-1, 2) * sq

# --- Stereo: a known, fixed baseline between two cameras ------------------------------
R_stereo_true = cv2.Rodrigues(np.array([0.0, 0.05, 0.0]))[0]
t_stereo_true = np.array([120.0, 0.0, 0.0])
rng = np.random.default_rng(13)
objpoints, imgpoints1, imgpoints2 = [], [], []
for _ in range(12):
    rvec1 = rng.normal(0, 0.3, 3)
    tvec1 = np.array([rng.normal(0, 60), rng.normal(0, 40), 500 + rng.normal(0, 80)])
    img1, _ = cv2.projectPoints(objp, rvec1, tvec1, K, dist)
    R1 = cv2.Rodrigues(rvec1)[0]
    R2 = R_stereo_true @ R1
    t2 = R_stereo_true @ tvec1 + t_stereo_true
    rvec2 = cv2.Rodrigues(R2)[0]
    img2, _ = cv2.projectPoints(objp, rvec2, t2, K, dist)
    objpoints.append(objp.astype(np.float32))
    imgpoints1.append(img1.reshape(-1, 1, 2).astype(np.float32))
    imgpoints2.append(img2.reshape(-1, 1, 2).astype(np.float32))

ret, K1, d1, K2, d2, R_est, t_est, E, F = cv2.stereoCalibrate(
    objpoints, imgpoints1, imgpoints2, K.copy(), dist.copy(), K.copy(), dist.copy(), (640, 480),
    flags=cv2.CALIB_FIX_INTRINSIC)
stereo = {"t_true": t_stereo_true.tolist(), "t_est": t_est.flatten().tolist(), "rms": float(ret)}

# --- Hand-eye: a known, fixed camera-to-gripper transform, with realistic noise -------
rng2 = np.random.default_rng(17)
R_cam2gripper_true = cv2.Rodrigues(np.array([0.05, 0.03, 0.9]))[0]
t_cam2gripper_true = np.array([20.0, -15.0, 50.0])
R_target2base = cv2.Rodrigues(np.array([0.1, 0.1, 0.1]))[0]
t_target2base = np.array([300.0, 0.0, 0.0])


def make_poses(n_poses, noise_deg, noise_mm):
    Rg, tg, Rt, tt = [], [], [], []
    for _ in range(n_poses):
        rv = rng2.normal(0, 0.4, 3)
        R_gripper2base = cv2.Rodrigues(rv)[0]
        t_gripper2base = np.array([rng2.normal(0, 100), rng2.normal(0, 100), rng2.normal(300, 50)])
        R_cam2base = R_gripper2base @ R_cam2gripper_true
        t_cam2base = R_gripper2base @ t_cam2gripper_true + t_gripper2base
        R_base2cam = R_cam2base.T
        t_base2cam = -R_base2cam @ t_cam2base
        R_target2cam = R_base2cam @ R_target2base
        t_target2cam = R_base2cam @ t_target2base + t_base2cam
        noise_rvec = cv2.Rodrigues(R_target2cam)[0].flatten() + rng2.normal(0, np.deg2rad(noise_deg), 3)
        R_target2cam_noisy = cv2.Rodrigues(noise_rvec)[0]
        t_target2cam_noisy = t_target2cam + rng2.normal(0, noise_mm, 3)
        Rg.append(R_gripper2base)
        tg.append(t_gripper2base)
        Rt.append(R_target2cam_noisy)
        tt.append(t_target2cam_noisy)
    return Rg, tg, Rt, tt


handeye_results = []
for n in (3, 5, 10, 20):
    Rg, tg, Rt, tt = make_poses(n, noise_deg=0.1, noise_mm=0.5)
    R_est2, t_est2 = cv2.calibrateHandEye(Rg, tg, Rt, tt)
    t_err = float(np.linalg.norm(t_est2.flatten() - t_cam2gripper_true))
    r_err = float(np.degrees(np.linalg.norm(cv2.Rodrigues(R_cam2gripper_true.T @ R_est2)[0])))
    handeye_results.append({"n_poses": n, "t_error_mm": t_err, "r_error_deg": r_err})

out = {"stereo": stereo, "handeye": handeye_results}
json.dump(out, open("apps/web/public/data/handeye-data.json", "w"), separators=(",", ":"))
print("stereo RMS:", stereo["rms"], " t_true:", stereo["t_true"], " t_est:", stereo["t_est"])
for r in handeye_results:
    print(f"n_poses={r['n_poses']}: t_error={r['t_error_mm']:.3f}mm, r_error={r['r_error_deg']:.4f}deg")
