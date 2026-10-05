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

# Chapter 1.4: image processing (image out) vs computer vision (information out).
images["sample-color-blurred.png"] = cv2.GaussianBlur(color, (9, 9), 0)
gray14 = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
_, mask14 = cv2.threshold(gray14, 50, 255, cv2.THRESH_BINARY)
contours14, _ = cv2.findContours(mask14, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
detected = color.copy()
for cnt in contours14:
    x, y, w, h = cv2.boundingRect(cnt)
    cv2.rectangle(detected, (x, y), (x + w - 1, y + h - 1), (255, 255, 255), 2)
cv2.putText(detected, f"{len(contours14)} objects", (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
images["sample-color-detected.png"] = detected

# Chapter 1.5: neighbourhood operations clean noise; a transform reveals pattern scale.
sp = scene.copy()
noise_rng = np.random.default_rng(seed=15)
u = noise_rng.random(sp.shape)
sp[u < 0.03] = 0                                                    # pepper
sp[u > 0.97] = 255                                                  # salt
images["sample-scene-saltpepper.png"] = sp
images["sample-scene-saltpepper-box.png"] = cv2.blur(sp, (3, 3))    # mean of 3 x 3
images["sample-scene-saltpepper-median.png"] = cv2.medianBlur(sp, 3)  # median of 3 x 3

yy, xx = np.mgrid[0:H, 0:W]
stripes_f = 128 + 100 * np.sin(2 * np.pi * xx / 16)                # vertical stripes, period 16 px
images["sample-stripes.png"] = np.rint(stripes_f).astype(np.uint8)
spec = np.fft.fftshift(np.fft.fft2(stripes_f))
mag = np.log1p(np.abs(spec))
mag = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
# The spectrum has three single-pixel peaks (centre + one each side); enlarge them so they are visible.
images["sample-stripes-spectrum.png"] = cv2.dilate(mag, np.ones((7, 7), np.uint8))

# Chapter 1.6: lighting decides how easy detection is; a simulated thermal image.
crack_mask = np.zeros((H, W), np.uint8)
crack_pts = np.array([[40, 120], [90, 104], [140, 112], [190, 92], [240, 98], [285, 80]], np.int32)
cv2.polylines(crack_mask, [crack_pts], False, 255, 3)
images["sample-plate-crack-mask.png"] = crack_mask
plate_rng = np.random.default_rng(seed=16)
# Poor lighting: low contrast (crack only 15 levels darker), strong uneven illumination, more noise.
poor = 120 + 45 * (xx / W) - 25 * (yy / H) - 15 * (crack_mask > 0) + plate_rng.normal(0, 8, (H, W))
images["sample-plate-poor.png"] = np.clip(poor, 0, 255).astype(np.uint8)
# Controlled lighting: even and bright, crack 150 levels darker, less noise.
good = 200 - 150 * (crack_mask > 0) + plate_rng.normal(0, 4, (H, W))
images["sample-plate-good.png"] = np.clip(good, 0, 255).astype(np.uint8)
for tag in ("poor", "good"):
    _, seg = cv2.threshold(images[f"sample-plate-{tag}.png"], 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    images[f"sample-plate-{tag}-otsu.png"] = seg

# Simulated thermal frame: ambient 30 °C with a hot region peaking near 950 °C (not real camera data).
temp = 30 + 920 * np.exp(-(((xx - 200) / 45.0) ** 2 + ((yy - 90) / 30.0) ** 2))
t8 = cv2.normalize(temp, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
thermal = cv2.applyColorMap(t8, cv2.COLORMAP_INFERNO)
_, tmax, _, (mx, my) = cv2.minMaxLoc(temp)
cv2.drawMarker(thermal, (mx, my), (255, 255, 255), cv2.MARKER_CROSS, 18, 2)
cv2.putText(thermal, f"max {tmax:.0f} C", (mx + 12, my - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
images["sample-thermal-gray.png"] = t8
images["sample-thermal-inferno.png"] = thermal

for name, img in images.items():
    ok = cv2.imwrite(str(OUT / name), img)
    assert ok, f"could not write {name}"

print(f"shape={scene.shape} dtype={scene.dtype} min={scene.min()} max={scene.max()} "
      f"mean={scene.mean():.1f} above200={np.count_nonzero(scene > 200)}")
print(f"wrote {len(images)} images to {OUT}")
