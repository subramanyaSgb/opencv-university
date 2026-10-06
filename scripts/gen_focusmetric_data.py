"""Real focus-metric comparison across a blur sweep, with and without noise (Module 50.3,
FocusMetricLab): apps/web/public/data/focusmetric-data.json.
"""
import json

import cv2
import numpy as np

rng = np.random.default_rng(140)
H, W = 150, 200
yy, xx = np.mgrid[0:H, 0:W]
sharp = np.clip(128 + 70 * np.sin(xx / 4) + 50 * np.cos(yy / 3) + 30 * np.sin((xx + yy) / 2.5), 0, 255).astype(np.uint8)
BLUR_LEVELS = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]


def blur_image(img, sigma):
    if sigma <= 0:
        return img.astype(np.float64)
    k = int(sigma * 6) | 1
    return cv2.GaussianBlur(img.astype(np.float64), (k, k), sigma)


def focus_var_laplacian(img):
    return cv2.Laplacian(img, cv2.CV_64F).var()


def focus_tenengrad(img):
    gx = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=3)
    return (gx ** 2 + gy ** 2).mean()


def focus_freq_energy(img):
    Fmag = np.abs(np.fft.fftshift(np.fft.fft2(img)))
    h, w = img.shape
    yy2, xx2 = np.mgrid[0:h, 0:w]
    r = min(h, w) // 8
    mask = ((yy2 - h // 2) ** 2 + (xx2 - w // 2) ** 2) > r ** 2
    return (Fmag[mask] ** 2).sum()


metrics = {"VarLaplacian": focus_var_laplacian, "Tenengrad": focus_tenengrad, "FreqEnergy": focus_freq_energy}
clean_curves = {}
for name, fn in metrics.items():
    vals = np.array([fn(blur_image(sharp, s)) for s in BLUR_LEVELS])
    clean_curves[name] = [round(float(v), 4) for v in (vals / vals[0])]

noise_results = []
for noise_std in [0, 5, 10, 20, 30]:
    row = {"noise_std": noise_std}
    for name in ["VarLaplacian", "Tenengrad"]:
        correct = 0
        for trial in range(300):
            rng2 = np.random.default_rng(1000 + trial)
            scores = [metrics[name](blur_image(sharp, s) + rng2.normal(0, noise_std, (H, W))) for s in BLUR_LEVELS[:7]]
            if BLUR_LEVELS[:7][int(np.argmax(scores))] == 0.0:
                correct += 1
        row[name] = round(100 * correct / 300, 1)
    noise_results.append(row)

out = {"blur_levels": BLUR_LEVELS, "clean_curves": clean_curves, "noise_results": noise_results}
json.dump(out, open("apps/web/public/data/focusmetric-data.json", "w"), separators=(",", ":"))
print(json.dumps(out, indent=None))
