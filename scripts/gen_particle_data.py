"""A real, from-scratch particle filter vs a Kalman filter fed a naive averaged measurement,
under a genuine measurement ambiguity (a similar-looking decoy for several frames)
(Module 40.6, ParticleLab): apps/web/public/data/particle-data.json.

Neither cv2 nor any other library implements the particle filter here -- it is built from
scratch in NumPy (the resample-propagate-weight loop), matching this course's "from scratch
first" convention, then compared against a real cv2.KalmanFilter.
"""
import json

import cv2
import numpy as np

rng = np.random.default_rng(21)
N = 40
VELOCITY = 5.0
NOISE_STD = 5.0
AMBIG = (15, 22)
DECOY_OFFSET = 30.0

true_x = np.arange(N) * VELOCITY
measured_x = true_x + rng.normal(0, NOISE_STD, N)

naive_meas = measured_x.copy()
decoy_x = [None] * N
for t in range(*AMBIG):
    decoy = true_x[t] + DECOY_OFFSET + rng.normal(0, NOISE_STD)
    decoy_x[t] = float(decoy)
    naive_meas[t] = (measured_x[t] + decoy) / 2

# --- Kalman, fed the naive averaged measurement during the ambiguity -------------------
kf = cv2.KalmanFilter(2, 1, 0)
kf.transitionMatrix = np.array([[1, 1], [0, 1]], np.float32)
kf.measurementMatrix = np.array([[1, 0]], np.float32)
kf.processNoiseCov = np.array([[1e-4, 0], [0, 1e-4]], np.float32)
kf.measurementNoiseCov = np.array([[NOISE_STD ** 2]], np.float32)
kf.errorCovPost = np.eye(2, dtype=np.float32) * 100
kf.statePost = np.array([[naive_meas[0]], [0]], np.float32)
kalman_est = [float(naive_meas[0])]
for t in range(1, N):
    kf.predict()
    kf.correct(np.array([[naive_meas[t]]], np.float32))
    kalman_est.append(float(kf.statePost[0, 0]))

# --- Particle filter, from scratch, OR-likelihood across all real candidates -----------
n_particles = 1000
particles = rng.normal(measured_x[0], 10, (n_particles, 2))
particles[:, 1] = VELOCITY + rng.normal(0, 1, n_particles)


def likelihood(px, candidates, sigma=NOISE_STD):
    like = np.zeros_like(px)
    for c in candidates:
        like += np.exp(-0.5 * ((px - c) / sigma) ** 2)
    return like


pf_est = [float(measured_x[0])]
for t in range(1, N):
    particles[:, 0] += particles[:, 1] + rng.normal(0, 0.5, n_particles)
    particles[:, 1] += rng.normal(0, 0.2, n_particles)
    candidates = [measured_x[t], decoy_x[t]] if decoy_x[t] is not None else [measured_x[t]]
    w = likelihood(particles[:, 0], candidates) + 1e-300
    w /= w.sum()
    pf_est.append(float(np.sum(particles[:, 0] * w)))
    idx = rng.choice(n_particles, n_particles, p=w)
    particles = particles[idx]

out = {
    "true_x": true_x.tolist(), "measured_x": measured_x.tolist(), "decoy_x": decoy_x,
    "kalman_x": kalman_est, "particle_x": pf_est, "ambiguity": list(AMBIG),
}
json.dump(out, open("apps/web/public/data/particle-data.json", "w"), separators=(",", ":"))

err_k = np.abs(np.array(kalman_est) - true_x)
err_p = np.abs(np.array(pf_est) - true_x)
print("mean error: Kalman", round(err_k.mean(), 2), " Particle filter", round(err_p.mean(), 2))
print("during ambiguity, Kalman error:", np.round(err_k[AMBIG[0]:AMBIG[1]], 1))
print("during ambiguity, PF error:    ", np.round(err_p[AMBIG[0]:AMBIG[1]], 1))
