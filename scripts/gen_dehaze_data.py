"""Real, from-scratch Dark Channel Prior dehazing results vs haze density and the real
sky-region failure (Module 48.3, DehazeLab): apps/web/public/data/dehaze-data.json.
"""
import json

import cv2
import numpy as np


def dark_channel(img, patch=15):
    min_channel = img.min(axis=2)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (patch, patch))
    return cv2.erode(min_channel, kernel)


def estimate_A(hazy, dark, top_frac=0.001):
    n = max(int(dark.size * top_frac), 1)
    idx = np.argsort(dark.ravel())[-n:]
    return hazy.reshape(-1, 3)[idx].max(axis=0)


def estimate_transmission(hazy, A, omega=0.95, patch=15):
    normed = hazy / A[None, None, :]
    return 1 - omega * dark_channel(normed, patch)


def dehaze(hazy, t0=0.1, patch=15):
    dark = dark_channel(hazy, patch)
    A_est = estimate_A(hazy, dark)
    t_est = estimate_transmission(hazy, A_est, patch=patch)
    t_clamped = np.maximum(t_est, t0)
    rec = (hazy - A_est[None, None, :]) / t_clamped[..., None] + A_est[None, None, :]
    return np.clip(rec, 0, 255), A_est, t_est


rng = np.random.default_rng(40)
H, W = 150, 200
yy, xx = np.mgrid[0:H, 0:W]
J = np.stack([100 + 60 * np.sin(xx / 15) + 20 * np.cos(yy / 10), 90 + 50 * np.cos(xx / 12), 110 + 40 * np.sin(yy / 18)], axis=-1)
J = np.clip(J + rng.normal(0, 8, J.shape), 0, 255)
depth = (yy / H) * 20.0 + 1.0
A_TRUE = 220.0

density_results = []
for beta in [0.02, 0.05, 0.1, 0.2]:
    t = np.exp(-beta * depth)[..., None]
    hazy = np.clip(J * t + A_TRUE * (1 - t), 0, 255)
    rec, A_est, t_est = dehaze(hazy)
    density_results.append({
        "beta": beta,
        "mae_hazy": round(float(np.mean(np.abs(hazy - J))), 2),
        "mae_dehazed": round(float(np.mean(np.abs(rec - J))), 2),
        "A_est": [round(float(v), 1) for v in A_est],
    })

sky_mask = yy < H * 0.2
J_sky = J.copy()
J_sky[sky_mask] = A_TRUE + rng.normal(0, 3, (int(sky_mask.sum()), 3))
J_sky = np.clip(J_sky, 0, 255)
t = np.exp(-0.1 * depth)[..., None]
hazy_sky = np.clip(J_sky * t + A_TRUE * (1 - t), 0, 255)
rec_sky, A_est2, t_est2 = dehaze(hazy_sky)

sky_result = {
    "true_transmission": round(float(t[sky_mask, 0].mean()), 4),
    "estimated_transmission": round(float(t_est2[sky_mask].mean()), 4),
    "mae_sky": round(float(np.mean(np.abs(rec_sky[sky_mask] - J_sky[sky_mask]))), 2),
    "mae_non_sky": round(float(np.mean(np.abs(rec_sky[~sky_mask] - J_sky[~sky_mask]))), 2),
}

out = {"a_true": A_TRUE, "density": density_results, "sky_failure": sky_result}
json.dump(out, open("apps/web/public/data/dehaze-data.json", "w"), separators=(",", ":"))
print(json.dumps(out, indent=None))
