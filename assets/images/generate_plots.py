"""Matplotlib figures used as pictures in Chapter 6.5 (needs matplotlib, tested with 3.11.2).

Run from the repo root after generate_samples.py:  python assets/images/generate_plots.py
"""
from pathlib import Path

import cv2
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = Path(__file__).resolve().parent / "generated"
color = cv2.imread(str(OUT / "sample-color.png"))
gray = cv2.imread(str(OUT / "sample-scene.png"), cv2.IMREAD_GRAYSCALE)

# 1. BGR passed straight to matplotlib vs converted to RGB
fig, ax = plt.subplots(1, 2, figsize=(6.4, 2.2), dpi=100)
ax[0].imshow(color); ax[0].set_title("plt.imshow(img)  (BGR: wrong)", fontsize=9)
ax[1].imshow(cv2.cvtColor(color, cv2.COLOR_BGR2RGB)); ax[1].set_title("cvtColor(img, BGR2RGB)", fontsize=9)
for a in ax:
    a.axis("off")
fig.savefig(OUT / "sample-plot-bgr.png", bbox_inches="tight")
plt.close(fig)

# 2. Automatic colour scaling of a low-contrast gray image
flat = (100 + gray.astype(np.float32) * 40 / 255).astype(np.uint8)
fig, ax = plt.subplots(1, 3, figsize=(9, 2.2), dpi=100)
for a, (title, kw) in zip(ax, [("default (viridis, auto)", {}), ("cmap='gray' (auto)", {"cmap": "gray"}),
                               ("cmap='gray', vmin=0, vmax=255", {"cmap": "gray", "vmin": 0, "vmax": 255})]):
    a.imshow(flat, **kw); a.set_title(title, fontsize=9); a.axis("off")
fig.savefig(OUT / "sample-plot-gray-scaling.png", bbox_inches="tight")
plt.close(fig)

# 3. Image, row profile and histogram
row = 100
counts, edges = np.histogram(gray, bins=32, range=(0, 256))
fig, ax = plt.subplots(1, 3, figsize=(10, 2.6), dpi=100)
ax[0].imshow(gray, cmap="gray", vmin=0, vmax=255); ax[0].axhline(row, color="red", lw=1)
ax[0].set_title(f"image, row {row} in red", fontsize=9); ax[0].axis("off")
ax[1].plot(gray[row], lw=1); ax[1].set_xlabel("x (column)"); ax[1].set_ylabel("value"); ax[1].set_ylim(0, 255)
ax[1].set_title("profile along the row", fontsize=9)
ax[2].bar(edges[:-1], counts, width=8, align="edge"); ax[2].set_xlabel("grey level"); ax[2].set_title("histogram", fontsize=9)
fig.tight_layout()
fig.savefig(OUT / "sample-plot-profile-hist.png", dpi=100)
plt.close(fig)

# 4. A float result (gradient magnitude) with a colour bar
gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
mag = cv2.magnitude(gx, gy)
fig, ax = plt.subplots(figsize=(4.6, 2.6), dpi=100)
im = ax.imshow(mag, cmap="inferno"); ax.set_title("gradient magnitude (float32)", fontsize=9); ax.axis("off")
fig.colorbar(im, ax=ax, shrink=0.85, label="|gradient|")
fig.savefig(OUT / "sample-plot-heatmap.png", bbox_inches="tight")
plt.close(fig)
print("wrote 4 plot images to", OUT)
