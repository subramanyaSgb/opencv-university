"""Real cv2.applyColorMap LUTs and their real CIE L* lightness profiles (Module 46.6,
PaletteThermalLab): apps/web/public/data/palette-data.json.
"""
import json

import cv2
import numpy as np


def lightness_profile(colormap_id, n=256):
    ramp = np.arange(n, dtype=np.uint8).reshape(-1, 1)
    bgr = cv2.applyColorMap(ramp, colormap_id)
    lab = cv2.cvtColor(bgr.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)
    return lab[:, 0, 0], bgr[:, 0, :]


names = {
    "JET": cv2.COLORMAP_JET,
    "TURBO": cv2.COLORMAP_TURBO,
    "INFERNO": cv2.COLORMAP_INFERNO,
    "BONE": cv2.COLORMAP_BONE,
    "HSV": cv2.COLORMAP_HSV,
}

out = {}
for name, cmap in names.items():
    L, bgr = lightness_profile(cmap)
    out[name] = {
        "L": [round(float(x), 2) for x in L],
        "colors_bgr": [[int(b), int(g), int(r)] for b, g, r in bgr],
    }

json.dump(out, open("apps/web/public/data/palette-data.json", "w"), separators=(",", ":"))
print("palettes:", list(out.keys()))
