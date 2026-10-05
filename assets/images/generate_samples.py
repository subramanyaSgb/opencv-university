"""Generate the synthetic sample images used by the chapters.

Run from the repo root:  python assets/images/generate_samples.py
Pinned: opencv-python 4.13.0.92, numpy 2.x (see CLAUDE.md).

Every image here is generated, so it carries no third-party licence.
Record any new image in assets/images/SOURCES.md.
"""
from pathlib import Path

import cv2
import numpy as np

OUT = Path(__file__).parent / "generated"
OUT.mkdir(exist_ok=True)

H, W = 200, 320
rng = np.random.default_rng(seed=11)  # fixed seed: same image every run

# --- sample-scene.png: an 8-bit grayscale test scene ---------------------
# Horizontal gradient background from 40 (dark) to 200 (light).
scene = np.tile(np.linspace(40, 200, W), (H, 1))
cv2.circle(scene, (80, 100), 45, 245, -1)                  # bright disc
cv2.rectangle(scene, (150, 40), (215, 160), 15, -1)        # dark block
pts = np.array([[250, 160], [300, 160], [275, 50]], np.int32)
cv2.fillPoly(scene, [pts], 120)                            # mid-grey triangle
cv2.putText(scene, "OpenCV", (14, 188), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 230, 2)
scene += rng.normal(0, 6, scene.shape)                     # mild sensor-like noise
scene = np.clip(scene, 0, 255).astype(np.uint8)

images = {
    "sample-scene.png": scene,
    "sample-scene-inverted.png": cv2.bitwise_not(scene),
    "sample-scene-brighter.png": cv2.add(scene, 80),              # saturates at 255
    "sample-scene-wrapped.png": scene + np.uint8(80),             # NumPy wraps: the bug
    "sample-scene-threshold.png": cv2.threshold(scene, 128, 255, cv2.THRESH_BINARY)[1],
}

# Chapter 1.2: region of interest around the bright disc.
# NumPy slice scene[55:146, 35:126]  ==  cv2.rectangle corners (35, 55) and (125, 145) in (x, y).
roi_marked = cv2.cvtColor(scene, cv2.COLOR_GRAY2BGR)
cv2.rectangle(roi_marked, (35, 55), (125, 145), (0, 0, 255), 2)
images["sample-scene-roi.png"] = roi_marked

# Chapter 1.3: a colour scene, stored in OpenCV's B, G, R order.
color = np.zeros((H, W, 3), np.uint8)
color[:] = (40, 32, 28)                                            # dark background
cv2.circle(color, (70, 95), 42, (0, 0, 220), -1)                   # red disc
cv2.rectangle(color, (135, 45), (195, 145), (0, 180, 0), -1)       # green block
tri = np.array([[225, 145], [295, 145], [260, 45]], np.int32)
cv2.fillPoly(color, [tri], (220, 70, 20))                          # blue triangle
cv2.rectangle(color, (20, 165), (300, 185), (40, 150, 255), -1)    # orange "hot steel" bar
images["sample-color.png"] = color
images["sample-color-swapped.png"] = np.ascontiguousarray(color[:, :, ::-1])   # what plt.imshow(BGR) shows
images["sample-color-gray.png"] = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
images["sample-color-average.png"] = np.rint(color.mean(axis=2)).astype(np.uint8)  # plain average, for comparison

# Chapter 1.3: red disc on green, chosen so both have the same gray value (60).
rg = np.zeros((H, W, 3), np.uint8)
rg[:] = (0, 102, 0)                                                # green, gray 60
cv2.circle(rg, (160, 100), 60, (0, 0, 200), -1)                    # red,   gray 60
images["sample-redgreen.png"] = rg
images["sample-redgreen-gray.png"] = cv2.cvtColor(rg, cv2.COLOR_BGR2GRAY)

for name, img in images.items():
    ok = cv2.imwrite(str(OUT / name), img)
    assert ok, f"could not write {name}"

print(f"shape={scene.shape} dtype={scene.dtype} min={scene.min()} max={scene.max()} "
      f"mean={scene.mean():.1f} above200={np.count_nonzero(scene > 200)}")
print(f"wrote {len(images)} images to {OUT}")
