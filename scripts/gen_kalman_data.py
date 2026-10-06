"""Real cv2.KalmanFilter results on a synthetic constant-velocity target with noisy
measurements and a simulated measurement dropout (Module 40.5, KalmanLab):
apps/web/public/data/kalman-data.json.
"""
import json

import cv2
import numpy as np

rng = np.random.default_rng(11)
N = 40
VELOCITY = 5.0
NOISE_STD = 8.0
DROPOUT = (15, 22)  # measurements missing for frames 15..21 inclusive

true_x = np.arange(N) * VELOCITY
measured_x = true_x + rng.normal(0, NOISE_STD, N)

kf = cv2.KalmanFilter(2, 1, 0)
kf.transitionMatrix = np.array([[1, 1], [0, 1]], np.float32)
kf.measurementMatrix = np.array([[1, 0]], np.float32)
kf.processNoiseCov = np.array([[1e-4, 0], [0, 1e-4]], np.float32)
kf.measurementNoiseCov = np.array([[NOISE_STD ** 2]], np.float32)
kf.errorCovPost = np.eye(2, dtype=np.float32) * 100
kf.statePost = np.array([[measured_x[0]], [0]], np.float32)

kalman_x, had_measurement = [measured_x[0]], [True]
for t in range(1, N):
    pred = kf.predict()
    if DROPOUT[0] <= t < DROPOUT[1]:
        kf.statePost = pred
        kf.errorCovPost = kf.errorCovPre
        kalman_x.append(float(pred[0, 0]))
        had_measurement.append(False)
    else:
        kf.correct(np.array([[measured_x[t]]], np.float32))
        kalman_x.append(float(kf.statePost[0, 0]))
        had_measurement.append(True)

freeze_x = list(measured_x[:DROPOUT[0]])
for t in range(DROPOUT[0], N):
    if DROPOUT[0] <= t < DROPOUT[1]:
        freeze_x.append(freeze_x[-1])
    else:
        freeze_x.append(float(measured_x[t]))

out = {
    "true_x": true_x.tolist(),
    "measured_x": measured_x.tolist(),
    "kalman_x": kalman_x,
    "freeze_x": freeze_x,
    "had_measurement": had_measurement,
    "dropout": list(DROPOUT),
}
json.dump(out, open("apps/web/public/data/kalman-data.json", "w"), separators=(",", ":"))

err_measured = np.abs(measured_x - true_x)
err_kalman = np.abs(np.array(kalman_x) - true_x)
print("mean |error| raw measurement:", round(err_measured.mean(), 2))
print("mean |error| Kalman estimate:", round(err_kalman.mean(), 2))
print("Kalman error during dropout:", np.round(err_kalman[DROPOUT[0]:DROPOUT[1]], 2))
freeze_err = np.abs(np.array(freeze_x) - true_x)
print("freeze-last-position error during dropout:", np.round(freeze_err[DROPOUT[0]:DROPOUT[1]], 2))
