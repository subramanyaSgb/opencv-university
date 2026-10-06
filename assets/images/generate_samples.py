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

# Chapter 2.1: a pinhole camera. A sharp test scene, the inverted image on the sensor,
# and the hole-size trade-off (geometric optics only: blur spot ~ hole diameter, light ~ hole area).
chart = np.full((H, W), 25, np.uint8)
for x0, bw in zip([20, 110, 180, 230], [16, 10, 6, 3]):
    for k in range(3):
        cv2.rectangle(chart, (x0 + k * 2 * bw, 24), (x0 + k * 2 * bw + bw - 1, 100), 230, -1)
cv2.putText(chart, "OPENCV", (30, 170), cv2.FONT_HERSHEY_SIMPLEX, 1.6, 230, 4, cv2.LINE_AA)
cv2.arrowedLine(chart, (292, 180), (292, 24), 230, 4, tipLength=0.15)
images["sample-pinhole-scene.png"] = chart
images["sample-pinhole-sensor.png"] = cv2.flip(chart, -1)


def pinhole_image(scene, d, d_ref=11):
    """Disk blur of diameter d pixels, brightness scaled by hole area relative to d_ref."""
    k = np.zeros((d, d), np.float32)
    cv2.circle(k, (d // 2, d // 2), d // 2, 1.0, -1)
    k /= k.sum()
    img = cv2.filter2D(scene.astype(np.float32), -1, k) * (d / d_ref) ** 2
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


images["sample-pinhole-small.png"] = pinhole_image(chart, 5)
images["sample-pinhole-large.png"] = pinhole_image(chart, 11)

# Chapter 2.2: the same chart in focus and with a 9 px blur circle (defocus simulated as a disk average).
images["sample-focus-sharp.png"] = chart.copy()
images["sample-focus-blur.png"] = pinhole_image(chart, 9, d_ref=9)

# Chapter 2.3: diffraction. The chart through an ideal f/4 and f/22 aperture (Airy pattern,
# 550 nm light, 3.45 µm pixels). J1 is computed by numerical integration so SciPy is not needed.
def bessel_j1(x):
    t = np.linspace(0, np.pi, 401)
    v = np.cos(t[None, :] - x.ravel()[:, None] * np.sin(t[None, :]))
    return np.trapezoid(v, t, axis=1).reshape(x.shape) / np.pi


def airy_kernel(N, pixel=0.00345, wavelength=0.00055, size=31):
    r = np.hypot(*np.mgrid[-(size // 2):size // 2 + 1, -(size // 2):size // 2 + 1]) * pixel
    x = np.pi * r / (wavelength * N)
    x[x == 0] = 1e-9
    psf = (2 * bessel_j1(x) / x) ** 2
    return (psf / psf.sum()).astype(np.float32)


for n_stop in (4, 22):
    out = cv2.filter2D(chart.astype(np.float32), -1, airy_kernel(n_stop))
    images[f"sample-diffraction-f{n_stop}.png"] = np.clip(np.rint(out), 0, 255).astype(np.uint8)
# A single bright point and its f/22 Airy pattern, enlarged 6x so the rings are visible.
spot = np.zeros((41, 41), np.float32)
spot[20, 20] = 1.0
airy = cv2.filter2D(spot, -1, airy_kernel(22, size=41))
airy_vis = np.clip(255 * np.sqrt(airy / airy.max()), 0, 255).astype(np.uint8)  # sqrt to show faint rings
images["sample-airy-f22.png"] = cv2.resize(airy_vis, None, fx=6, fy=6, interpolation=cv2.INTER_NEAREST)
point = np.zeros((41, 41), np.uint8)
point[20, 20] = 255
images["sample-airy-point.png"] = cv2.resize(point, None, fx=6, fy=6, interpolation=cv2.INTER_NEAREST)

# Chapter 2.5: sensor noise. Same chart, (a) bright exposure, (b) 1/16 of the light with 16x gain.
# Model: QE 0.6, read noise 6 e-, full well 10000 e- = 255 DN at gain 1; Poisson shot noise.
noise_rng = np.random.default_rng(seed=25)


def capture(photons_at_white, gain):
    e = noise_rng.poisson(chart.astype(np.float64) / 255.0 * photons_at_white * 0.6).astype(np.float64)
    e += noise_rng.normal(0, 6.0, chart.shape)
    return np.clip(np.rint(e * gain / (10000 / 255)), 0, 255).astype(np.uint8)


images["sample-noise-bright.png"] = capture(16000, 1)
images["sample-noise-dark-gain.png"] = capture(1000, 16)

# Chapter 2.6: motion blur. The chart moving 15 px to the right during the exposure (horizontal box kernel).
mk = np.full((1, 15), 1.0 / 15, np.float32)
images["sample-motion-blur.png"] = cv2.filter2D(chart, -1, mk)

# Chapter 2.7: Bayer mosaic (RGGB) and bilinear demosaicing, shown as 6x enlarged crops.
def rggb_mosaic(img_bgr):
    m = np.zeros(img_bgr.shape[:2], np.uint8)
    m[0::2, 0::2] = img_bgr[0::2, 0::2, 2]
    m[0::2, 1::2] = img_bgr[0::2, 1::2, 1]
    m[1::2, 0::2] = img_bgr[1::2, 0::2, 1]
    m[1::2, 1::2] = img_bgr[1::2, 1::2, 0]
    return m


def show_mosaic(m):
    v = np.zeros(m.shape + (3,), np.uint8)
    v[0::2, 0::2, 2] = m[0::2, 0::2]
    v[0::2, 1::2, 1] = m[0::2, 1::2]
    v[1::2, 0::2, 1] = m[1::2, 0::2]
    v[1::2, 1::2, 0] = m[1::2, 1::2]
    return v


def big(img):
    return cv2.resize(img, None, fx=6, fy=6, interpolation=cv2.INTER_NEAREST)


colour_scene = images["sample-color.png"]
cy, cx = 44, 222
crop = colour_scene[cy:cy + 40, cx:cx + 40]
crop_mosaic = rggb_mosaic(colour_scene)[cy:cy + 40, cx:cx + 40]
crop_demosaic = cv2.cvtColor(rggb_mosaic(colour_scene), cv2.COLOR_BayerRGGB2BGR)[cy:cy + 40, cx:cx + 40]
images["sample-bayer-true.png"] = big(crop)
images["sample-bayer-mosaic.png"] = big(show_mosaic(crop_mosaic))
images["sample-bayer-demosaic.png"] = big(crop_demosaic)
stripes_gray = np.zeros((40, 40), np.uint8)
stripes_gray[:, 0::2] = 255
stripes_bgr = cv2.cvtColor(stripes_gray, cv2.COLOR_GRAY2BGR)
images["sample-bayer-stripes.png"] = big(stripes_bgr)
images["sample-bayer-stripes-demosaic.png"] = big(cv2.cvtColor(rggb_mosaic(stripes_bgr), cv2.COLOR_BayerRGGB2BGR))

# Chapter 2.8: what the sensor delivers before the ISP (linear, black level, colour cast, lens shading)
# and the corrected result. Simulation from sample-color.
def srgb_decode(v):
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def srgb_encode(x):
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(np.clip(x, 0, None), 1 / 2.4) - 0.055)


lin = srgb_decode(images["sample-color.png"][:, :, ::-1].astype(np.float64) / 255.0)   # RGB, linear
iy, ix = np.mgrid[0:H, 0:W]
ir2 = ((ix - W / 2) ** 2 + (iy - H / 2) ** 2) / ((W / 2) ** 2 + (H / 2) ** 2)
sens = np.array([0.55, 1.0, 0.7])                                   # raw R, G, B sensitivity (colour cast)
raw_lin = lin * sens * (1 - 0.45 * ir2)[..., None] + 16 / 255.0     # shading + black level
images["sample-isp-raw.png"] = np.clip(np.rint(raw_lin * 255), 0, 255).astype(np.uint8)[:, :, ::-1]
fixed = (raw_lin - 16 / 255.0) / (1 - 0.45 * ir2)[..., None] / sens
images["sample-isp-final.png"] = np.clip(np.rint(srgb_encode(fixed) * 255), 0, 255).astype(np.uint8)[:, :, ::-1]

# Chapter 2.9: rolling shutter skew and flicker banding (simulated).
bars = np.full((H, W), 30, np.uint8)
for bx in (60, 140, 220):
    cv2.rectangle(bars, (bx, 20), (bx + 24, H - 20), 220, -1)
images["sample-shutter-global.png"] = bars
rolled = np.zeros_like(bars)
for yy_ in range(H):
    rolled[yy_] = np.roll(bars[yy_], int(round(yy_ * 0.25)))
images["sample-shutter-rolling.png"] = rolled
wt_ = 2 * np.pi * 100.0
t0_ = np.arange(H) * 30e-6 * 2.5
gain_ = 1 + 0.3 * (np.sin(wt_ * (t0_ + 2.5e-3)) - np.sin(wt_ * t0_)) / (wt_ * 2.5e-3)
images["sample-flicker-bands.png"] = np.clip(np.rint(chart.astype(np.float64) * 0.6 * gain_[:, None] + 40 * gain_[:, None]), 0, 255).astype(np.uint8)

# Chapter 3.5: aliasing. A zone plate (rings whose spacing shrinks outwards), and the same
# image shrunk 4x by point sampling (nearest) vs area averaging, shown back at full size.
zy, zx = np.mgrid[0:H, 0:W]
zr2 = (zx - W / 2) ** 2 + (zy - H / 2) ** 2
zone = (127.5 + 127.5 * np.cos(np.pi * zr2 / 400.0)).astype(np.uint8)
images["sample-zoneplate.png"] = zone
for name_, interp_ in (("nearest", cv2.INTER_NEAREST), ("area", cv2.INTER_AREA)):
    small_ = cv2.resize(zone, (W // 4, H // 4), interpolation=interp_)
    images[f"sample-zoneplate-{name_}.png"] = cv2.resize(small_, (W, H), interpolation=cv2.INTER_NEAREST)

# Chapter 4.3: JPEG artefacts, shown as enlarged crops (nearest; 4x text, 8x colour). Text on the test chart at
# quality 10 (blocking, ringing), and colour edges at quality 95 with 4:2:0 vs 4:4:4 chroma.
def jpeg_roundtrip(img_, quality_, sampling_=None):
    params_ = [cv2.IMWRITE_JPEG_QUALITY, quality_]
    if sampling_ is not None:
        params_ += [cv2.IMWRITE_JPEG_SAMPLING_FACTOR, sampling_]
    return cv2.imdecode(cv2.imencode(".jpg", img_, params_)[1], cv2.IMREAD_UNCHANGED)

def zoom(img_, y_, x_, f_=4):
    return cv2.resize(img_[y_:y_ + 192 // f_, x_:x_ + 320 // f_], None, fx=f_, fy=f_, interpolation=cv2.INTER_NEAREST)

images["sample-jpeg-text.png"] = zoom(chart, 126, 32)
images["sample-jpeg-text-q10.png"] = zoom(jpeg_roundtrip(chart, 10), 126, 32)
images["sample-jpeg-color.png"] = zoom(color, 70, 24, 8)
images["sample-jpeg-color-420.png"] = zoom(jpeg_roundtrip(color, 95, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_420), 70, 24, 8)
images["sample-jpeg-color-444.png"] = zoom(jpeg_roundtrip(color, 95, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444), 70, 24, 8)

# Chapter 5.3: a flat label seen by a tilted camera (perspective), and the same rectified with a homography
# from its four corners. The rectified label is placed at (40, 40)-(280, 160) in a 320 x 200 frame.
label_ = np.full((120, 240), 235, np.uint8)
cv2.rectangle(label_, (4, 4), (235, 115), 40, 3)
for x_ in range(40, 240, 40):
    cv2.line(label_, (x_, 4), (x_, 115), 170, 1)
cv2.putText(label_, "LOT 4711", (22, 75), cv2.FONT_HERSHEY_SIMPLEX, 1.3, 20, 3)
label_corners_ = np.float32([[70, 40], [270, 62], [255, 170], [52, 140]])
tilted_ = cv2.warpPerspective(label_, cv2.getPerspectiveTransform(
    np.float32([[0, 0], [240, 0], [240, 120], [0, 120]]), label_corners_), (W, H), borderValue=90)
images["sample-label-tilted.png"] = tilted_
images["sample-label-rectified.png"] = cv2.warpPerspective(tilted_, cv2.getPerspectiveTransform(
    label_corners_, np.float32([[40, 40], [280, 40], [280, 160], [40, 160]])), (W, H), borderValue=90)

# Chapter 5.7: the gradient scene rebuilt from its k strongest SVD components (low-rank approximation).
U_, S_, Vt_ = np.linalg.svd(scene.astype(np.float64), full_matrices=False)
for k_ in (1, 5, 20):
    images[f"sample-svd-rank{k_}.png"] = np.clip(np.rint((U_[:, :k_] * S_[:k_]) @ Vt_[:k_]), 0, 255).astype(np.uint8)

# Chapter 7.5: sample-color annotated with OpenCV drawing functions (filled highlight, outlines, labels).
gray_ = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
_, mask_ = cv2.threshold(gray_, 60, 255, cv2.THRESH_BINARY)
cnts_, _ = cv2.findContours(mask_, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cnts_ = sorted(cnts_, key=lambda c: (cv2.boundingRect(c)[1] // 100, cv2.boundingRect(c)[0]))
over_ = color.copy()
cv2.drawContours(over_, cnts_, -1, (255, 255, 255), -1)
ann_ = cv2.addWeighted(over_, 0.3, color, 0.7, 0)
cv2.drawContours(ann_, cnts_, -1, (0, 255, 255), 1, cv2.LINE_AA)
for i_, c_ in enumerate(cnts_):
    x_, y_, w_, h_ = cv2.boundingRect(c_)
    lab_ = f"#{i_ + 1}: {int(cv2.contourArea(c_))} px"
    (tw_, th_), b_ = cv2.getTextSize(lab_, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
    cv2.rectangle(ann_, (x_, y_ - th_ - b_ - 4), (x_ + tw_ + 4, y_), (0, 0, 0), -1)
    cv2.putText(ann_, lab_, (x_ + 2, y_ - b_ - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
images["sample-annotated.png"] = ann_

# Chapter 9.1: sample-scene as the eye sees it when looking at the centre (blur grows with distance from the fixation point).
f_img = scene.astype(np.float32)
f_h, f_w = f_img.shape
f_yy, f_xx = np.mgrid[0:f_h, 0:f_w]
f_ecc = np.hypot(f_xx - f_w // 2, f_yy - f_h // 2) / np.hypot(f_w / 2, f_h / 2)
f_levels = np.stack([f_img] + [cv2.GaussianBlur(f_img, (0, 0), s) for s in (1.5, 3.0, 6.0)])
f_idx = np.clip(f_ecc * 3, 0, 2.999)
f_lo = f_idx.astype(int)
f_t = f_idx - f_lo
images["sample-scene-foveated.png"] = np.clip(np.rint((1 - f_t) * f_levels[f_lo, f_yy, f_xx] + f_t * f_levels[f_lo + 1, f_yy, f_xx]), 0, 255).astype(np.uint8)

# Chapter 11.2: Fourier magnitude of sample-scene, scaled linearly to 8 bits (almost all dark: a case for the log transform).
s_mag = np.abs(np.fft.fftshift(np.fft.fft2(scene.astype(np.float64))))
images["sample-spectrum-linear.png"] = np.clip(np.round(255 * s_mag / s_mag.max() * 40), 0, 255).astype(np.uint8)

# Chapter 12.4: the same scene seen by a "second camera" with lower gain, a gamma of 1.5, an offset and a little noise.
cb_rng = np.random.default_rng(12)
images["sample-scene-camb.png"] = np.clip(np.rint(25 + 180 * (scene / 255.0) ** 1.5 + cb_rng.normal(0, 1.5, scene.shape)), 0, 255).astype(np.uint8)

# Chapters 12.5, 12.6: the shaded cap scene of InRangeLab/BackProjLab (10.7, 12.5) with its object-id map (0 belt, 1 orange, 2 red, 3 crimson, 4 green, 5 cardboard).
cap_rng = np.random.default_rng(7)
cap_yy, cap_xx = np.mgrid[0:100, 0:160]
cap_bgr = np.empty((100, 160, 3)); cap_bgr[:] = (118, 120, 122)
cap_id = np.zeros((100, 160), np.uint8)
cap_cols = {1: (30, 140, 250), 2: (30, 30, 210), 3: (70, 25, 200), 4: (60, 170, 40), 5: (70, 110, 150)}
for o, cx, cy, r in [(1, 30, 35, 16), (2, 75, 30, 15), (3, 120, 32, 15), (4, 40, 75, 14)]:
    m = (cap_xx - cx) ** 2 + (cap_yy - cy) ** 2 <= r * r
    cap_bgr[m] = cap_cols[o]; cap_id[m] = o
m = (np.abs(cap_xx - 105) <= 20) & (np.abs(cap_yy - 75) <= 11)
cap_bgr[m] = cap_cols[5]; cap_id[m] = 5
cap_shade = (1 - 0.55 * cap_xx / 160)[..., None] * np.ones(3)
hl = (cap_id == 1) & ((cap_xx - 25) ** 2 + (cap_yy - 30) ** 2 <= 9)
cap_bgr[hl] = 250; cap_shade[hl] = 1
images["sample-caps.png"] = np.clip(cap_bgr * cap_shade + cap_rng.uniform(-6, 6, cap_bgr.shape), 0, 255).astype(np.uint8)
images["sample-caps-ids.png"] = cap_id

# Module 13: printed label text under uneven light (bright top right, dark bottom left) and its ground-truth text mask.
pr_ink = np.zeros((200, 320), np.uint8)
for pr_i, pr_t in enumerate(["Lot 4471-B  QTY 120", "EXP 2027-03  PASS", "Line 3  Shift B  OK", "Batch 0912 / 77"]):
    cv2.putText(pr_ink, pr_t, (14, 40 + pr_i * 44), cv2.FONT_HERSHEY_SIMPLEX, 0.85, 255, 2, cv2.LINE_AA)
pr_yy, pr_xx = np.mgrid[0:200, 0:320]
pr_light = 0.35 + 0.65 * np.exp(-(((pr_xx - 260) / 220) ** 2 + ((pr_yy - 40) / 170) ** 2))
pr_a = pr_ink / 255.0
pr_img = 210 * pr_light * (1 - pr_a) + 60 * pr_light * pr_a + np.random.default_rng(5).normal(0, 4, pr_ink.shape)
images["sample-print-uneven.png"] = np.clip(np.rint(pr_img), 0, 255).astype(np.uint8)
images["sample-print-uneven-gt.png"] = ((pr_ink > 127) * 255).astype(np.uint8)
# Chapter 15.3: the same light on a blank white target (flat-field reference), its own noise.
images["sample-print-white.png"] = np.clip(np.rint(210 * pr_light + np.random.default_rng(6).normal(0, 4, pr_ink.shape)), 0, 255).astype(np.uint8)

# Chapter 13.6: a faint crack (150) on a plate (180) with strong noise (σ 12): single thresholds fail, hysteresis works.
fc_mask = images["sample-plate-crack-mask.png"] > 0
images["sample-crack-faint.png"] = np.clip(np.where(fc_mask, 150.0, 180.0) + np.random.default_rng(4).normal(0, 12, fc_mask.shape), 0, 255).astype(np.uint8)

# Chapter 16.5: text printed around a ring (like a cap or a bearing), to be unwrapped with warpPolar.
rt_img = np.full((240, 240), 200, np.uint8)
cv2.circle(rt_img, (120, 120), 105, 120, -1)
cv2.circle(rt_img, (120, 120), 60, 200, -1)
rt_text = "LOT 4711 * EXP 2027-03 * PASS * "
for rt_i, rt_ch in enumerate(rt_text):
    rt_glyph = np.zeros((40, 40), np.uint8)
    cv2.putText(rt_glyph, rt_ch, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2, cv2.LINE_AA)
    rt_angle = 360.0 * rt_i / len(rt_text)                     # clockwise from the top, letters upright towards the centre
    rt_t = np.deg2rad(rt_angle - 90)
    rt_cx, rt_cy = 120 + 82 * np.cos(rt_t), 120 + 82 * np.sin(rt_t)
    rt_M = cv2.getRotationMatrix2D((20, 20), -rt_angle, 1.0)
    rt_M[0, 2] += rt_cx - 20
    rt_M[1, 2] += rt_cy - 20
    rt_mask = cv2.warpAffine(rt_glyph, rt_M, (240, 240))
    rt_img = np.where(rt_mask > 0, np.minimum(rt_img, 255 - rt_mask.astype(np.int32) * 235 // 255), rt_img).astype(np.uint8)
images["sample-ring-text.png"] = rt_img

# Module 18: a clean, noise-free test image (flat areas, a gradient, sharp and thin edges, small text, fine stripes) for denoising experiments.
cl = np.zeros((200, 320), np.float64)
cl[:] = np.linspace(60, 190, 320)[None, :]                            # smooth gradient background
cv2.rectangle(cl, (20, 20), (110, 110), 230, -1)                      # bright square with sharp edges
cv2.circle(cl, (170, 65), 45, 40, -1)                                 # dark disc
# fine vertical stripes, 2 px period
cl[130:180, 20:110] = np.where((np.arange(90) // 2) % 2 == 0, 210, 80)[None, :]
for cl_k in range(5):                                                 # thin lines of width 1
    cv2.line(cl, (230, 20 + 8 * cl_k), (300, 20 + 8 * cl_k), 20, 1)
cv2.putText(cl, "A7", (150, 175), cv2.FONT_HERSHEY_SIMPLEX, 1.2, 245, 2, cv2.LINE_AA)
cv2.putText(cl, "lot 42", (225, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.5, 20, 1, cv2.LINE_AA)
images["sample-clean.png"] = np.clip(np.rint(cl), 0, 255).astype(np.uint8)

# 20.3: two colour textures for pyramid blending (256 x 256)
bl_rng = np.random.default_rng(20)
bl_y, bl_x = np.mgrid[0:256, 0:256].astype(np.float64)
streak = cv2.GaussianBlur(bl_rng.normal(0, 1, (256, 256)), (0, 0), sigmaX=25, sigmaY=0.6)
streak = streak / streak.std()
steel = 140 + 0.15 * bl_x - 0.1 * bl_y + 14 * streak
bl_a = np.dstack([steel + 18, steel + 6, steel - 6])                      # cool grey-blue (BGR)
for cy, cx in [(48, 48), (48, 208), (208, 48), (208, 208)]:              # four bolts
    r = np.hypot(bl_y - cy, bl_x - cx)
    bl_a[r < 12] = (np.array([70, 70, 75]) + 60 * np.clip((cx - bl_x[r < 12] + cy - bl_y[r < 12]) / 24 + 0.5, 0, 1)[:, None])
mortar = ((bl_y % 32) < 3) | ((((bl_x + 32 * ((bl_y // 32) % 2)) % 64) < 3))
brick = 1 + 0.08 * bl_rng.normal(0, 1, (256, 256))
bl_b = np.dstack([45 * brick, 80 * brick, 170 * brick])                  # red-orange brick (BGR)
bl_b[mortar] = [175, 180, 185]
bl_b = cv2.GaussianBlur(bl_b, (0, 0), 0.7) + bl_rng.normal(0, 4, (256, 256, 3))
images["sample-blend-a.png"] = np.clip(np.rint(bl_a), 0, 255).astype(np.uint8)
images["sample-blend-b.png"] = np.clip(np.rint(bl_b), 0, 255).astype(np.uint8)

# 23.x: binary test image for morphology: shapes with holes, a thin bridge, specks, a notch, text
mo = np.zeros((200, 320), np.uint8)
cv2.rectangle(mo, (20, 20), (110, 90), 255, -1)
for hx, hy in [(40, 40), (60, 70), (90, 45)]:
    cv2.circle(mo, (hx, hy), 3, 0, -1)                                   # small holes
cv2.rectangle(mo, (100, 50), (110, 60), 0, -1)                             # a notch in the edge
cv2.circle(mo, (165, 55), 30, 255, -1)
cv2.circle(mo, (255, 55), 30, 255, -1)
cv2.rectangle(mo, (190, 54), (230, 56), 255, -1)                           # 3-px bridge between the discs
cv2.ellipse(mo, (70, 150), (45, 25), 20, 0, 360, 255, -1)
cv2.putText(mo, "A7", (150, 175), cv2.FONT_HERSHEY_SIMPLEX, 2.0, 255, 6, cv2.LINE_8)
cv2.line(mo, (250, 120), (300, 185), 255, 2)                              # a thin line
mo_rng = np.random.default_rng(23)
ys, xs = mo_rng.integers(0, 200, 120), mo_rng.integers(0, 320, 120)
mo[ys, xs] = 255                                                           # isolated white specks
ys, xs = mo_rng.integers(20, 90, 25), mo_rng.integers(20, 110, 25)
mo[ys, xs] = 0                                                             # pepper inside the rectangle
images["sample-morph.png"] = mo

# 24.x: binary image of machined parts for contour analysis
pa = np.zeros((200, 320), np.uint8)
cv2.circle(pa, (55, 55), 38, 255, -1); cv2.circle(pa, (55, 55), 16, 0, -1)               # washer (hole)
cv2.fillPoly(pa, [np.array([[115, 20], [175, 20], [175, 40], [135, 40], [135, 95], [115, 95]])], 255)   # L-bracket
cv2.rectangle(pa, (200, 15), (300, 95), 255, -1)                                         # plate with two holes
cv2.circle(pa, (225, 55), 12, 0, -1); cv2.rectangle(pa, (255, 40), (285, 70), 0, -1)
cv2.circle(pa, (270, 55), 5, 255, -1)                                                    # a pin inside the square hole
box = cv2.boxPoints(((70, 150), (90, 34), 25)).astype(np.int32); cv2.fillPoly(pa, [box], 255)   # rotated bar
t = np.linspace(0, 2 * np.pi, 13)[:-1]                                                    # 6-point star
star = np.array([[175 + (32 if i % 2 == 0 else 14) * np.cos(a - np.pi / 2), 150 + (32 if i % 2 == 0 else 14) * np.sin(a - np.pi / 2)] for i, a in enumerate(t)], np.int32)
cv2.fillPoly(pa, [star], 255)
cv2.ellipse(pa, (265, 150), (38, 22), -15, 0, 360, 255, -1)                              # oval
images["sample-parts.png"] = pa

# 25.x: grey image of round particles (some touching) with a known count
pt_rng = np.random.default_rng(25)
pt_img = np.full((200, 320), 60.0)
pt_centres = []
while len(pt_centres) < 40:
    x, y, r = pt_rng.uniform(15, 305), pt_rng.uniform(15, 185), pt_rng.uniform(6, 13)
    if all(np.hypot(x - a, y - b) > 0.8 * (r + c) for a, b, c in pt_centres):   # may touch, never overlap much
        pt_centres.append((x, y, r))
yy, xx = np.mgrid[0:200, 0:320]
for x, y, r in pt_centres:
    d = np.hypot(xx - x, yy - y)
    pt_img = np.maximum(pt_img, np.where(d <= r, 200 - 40 * (d / r) ** 2, 0))  # domed particles
pt_img = cv2.GaussianBlur(pt_img, (0, 0), 0.8) + pt_rng.normal(0, 6, pt_img.shape)
images["sample-particles.png"] = np.clip(np.rint(pt_img), 0, 255).astype(np.uint8)

# 26.x: grey scene for Hough lines and circles: rotated plate with four holes, a washer and a disc
hg = np.full((200, 320), 45.0)
hg_big = np.zeros((1600, 2560), np.uint8)
cv2.fillPoly(hg_big, [np.rint(cv2.boxPoints(((120, 100), (170, 110), 12)) * 8).astype(np.int32)], 255)   # 8x supersampled plate
hg_plate = cv2.resize(hg_big, (320, 200), interpolation=cv2.INTER_AREA) / 255.0
hg = hg * (1 - hg_plate) + 175 * hg_plate
hy, hx = np.mgrid[0:200, 0:320]
hdisc = lambda cx, cy, r: np.clip(r + 0.5 - np.hypot(hx - cx, hy - cy), 0, 1)          # anti-aliased disc
for cx, cy, r in [(85, 75, 14), (150, 85, 9), (105, 125, 18), (160, 128, 6)]:          # holes in the plate
    a = hdisc(cx, cy, r); hg = hg * (1 - a) + 60 * a
a = hdisc(265, 60, 30) - hdisc(265, 60, 13); hg = hg * (1 - a) + 160 * a                 # washer
a = hdisc(262, 150, 22); hg = hg * (1 - a) + 150 * a                                     # disc
hg = cv2.GaussianBlur(hg, (0, 0), 0.7) + np.random.default_rng(26).normal(0, 5, hg.shape)
images["sample-hough.png"] = np.clip(np.rint(hg), 0, 255).astype(np.uint8)

# 27.x: colour scene for segmentation with an object-id map: cloth background (light falls off to the right),
# shaded orange (1), red disc (2) touching a crimson disc (3), striped green box (4), yellow label with dark text (5)
sg_rng = np.random.default_rng(27)
sy, sx = np.mgrid[0:160, 0:240]
sg = np.zeros((160, 240, 3)); sg[:] = (150, 120, 95)                     # B, G, R
sg += (8 * np.sin(sx * 1.3) * np.sin(sy * 1.3))[..., None]                # weave texture
sg_ids = np.zeros((160, 240), np.uint8)
def sg_ell(cx, cy, a, b, ang):
    m = np.zeros((160, 240), np.uint8); cv2.ellipse(m, (cx, cy), (a, b), ang, 0, 360, 255, -1); return m > 0
m1 = sg_ell(55, 55, 34, 28, 15); sg[m1] = (30, 130, 235); sg_ids[m1] = 1
sg_d = np.hypot((sx - 45) / 34, (sy - 45) / 28); sg[m1] *= (1.15 - 0.45 * sg_d[m1])[:, None]   # shading
m2 = sg_ell(120, 50, 24, 24, 0); m3 = sg_ell(160, 62, 22, 22, 0) & ~m2
sg[m2] = (40, 40, 200); sg_ids[m2] = 2; sg[m3] = (70, 30, 170); sg_ids[m3] = 3
m4 = np.zeros((160, 240), np.uint8); cv2.rectangle(m4, (25, 100), (95, 145), 255, -1); m4 = m4 > 0
sg[m4] = (60, 150, 50); sg_ids[m4] = 4; sg[m4 & ((sx // 6) % 2 == 0)] -= (20, 35, 15)       # stripes
m5 = np.zeros((160, 240), np.uint8); cv2.rectangle(m5, (130, 105), (215, 140), 255, -1); m5 = m5 > 0
sg[m5] = (90, 190, 210); sg_ids[m5] = 5
sg_txt = np.zeros((160, 240), np.uint8); cv2.putText(sg_txt, "OK 27", (140, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, 255, 2)
sg[(sg_txt > 0) & m5] = (40, 40, 40)
sg *= (1.15 - 0.45 * sx / 240)[..., None]                                 # light falls off to the right
sg = cv2.GaussianBlur(sg + sg_rng.normal(0, 4, sg.shape), (0, 0), 0.6)
images["sample-seg.png"] = np.clip(np.rint(sg), 0, 255).astype(np.uint8)
images["sample-seg-ids.png"] = sg_ids

# 28.x: grey image for active contours: a disc with a deep slot from the top, and two separate discs (seed 28)
ac_big = np.zeros((600, 800), np.uint8)
cv2.circle(ac_big, (280, 300), 180, 255, -1); cv2.rectangle(ac_big, (240, 100), (320, 340), 0, -1)   # slotted disc
cv2.circle(ac_big, (640, 180), 64, 255, -1); cv2.circle(ac_big, (660, 440), 80, 255, -1)             # two discs
ac = 60 + 110 * (cv2.resize(ac_big, (200, 150), interpolation=cv2.INTER_AREA) / 255.0)               # 4x supersampled
ac = cv2.GaussianBlur(ac, (0, 0), 1.0) + np.random.default_rng(28).normal(0, 10, ac.shape)
images["sample-snake.png"] = np.clip(np.rint(ac), 0, 255).astype(np.uint8)

# 29.x: binary shape set for shape descriptors: six shapes (top row) and the same shapes rotated, scaled and,
# for the bracket, mirrored (bottom row); drawn 8x supersampled and thresholded
def sh_star(n=5, r1=1.0, r2=0.45):
    t = np.arange(2 * n) * np.pi / n - np.pi / 2; r = np.where(np.arange(2 * n) % 2 == 0, r1, r2); return np.c_[r * np.cos(t), r * np.sin(t)]
def sh_gear(n=8, r1=1.0, r2=0.78):
    pts = []
    for k in range(n):
        a = 2 * np.pi * k / n; w = np.pi / n * 0.5
        for ang, r in ((a - w * 1.2, r2), (a - w * 0.6, r1), (a + w * 0.6, r1), (a + w * 1.2, r2)): pts.append((r * np.cos(ang), r * np.sin(ang)))
    return np.array(pts)
sh_t = np.linspace(0, 2 * np.pi, 80, endpoint=False)
SH = {"star": sh_star(), "gear": sh_gear(),
      "bracket": np.array([[-1, -1], [1, -1], [1, -0.5], [-0.4, -0.5], [-0.4, 1], [-1, 1]], float),
      "cross": np.array([[-.32, -1], [.32, -1], [.32, -.32], [1, -.32], [1, .32], [.32, .32], [.32, 1], [-.32, 1], [-.32, .32], [-1, .32], [-1, -.32], [-.32, -.32]]),
      "oval": np.c_[np.cos(sh_t), 0.55 * np.sin(sh_t)],
      "arrow": np.array([[-1, -0.25], [0.3, -0.25], [0.3, -0.6], [1, 0], [0.3, 0.6], [0.3, 0.25], [-1, 0.25]])}
SH_PLACE = [("star", (40, 45), 28, 0, False), ("gear", (110, 45), 28, 0, False), ("bracket", (180, 45), 26, 0, False), ("cross", (250, 45), 26, 0, False),
            ("oval", (320, 45), 30, 0, False), ("arrow", (390, 45), 30, 0, False), ("star", (40, 135), 18, 25, False), ("gear", (110, 135), 34, 10, False),
            ("bracket", (180, 135), 22, 90, True), ("cross", (250, 135), 18, 30, False), ("oval", (320, 135), 22, 60, False), ("arrow", (390, 135), 22, 200, False)]
sh_big = np.zeros((180 * 8, 430 * 8), np.uint8)
for name, (cx, cy), sc, ang, mir in SH_PLACE:
    p = SH[name] * (-1 if mir else 1, 1)
    a = np.deg2rad(ang); R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    cv2.fillPoly(sh_big, [np.rint(((p @ R.T) * sc + (cx, cy)) * 8).astype(np.int32)], 255)
images["sample-shapes.png"] = (cv2.resize(sh_big, (430, 180), interpolation=cv2.INTER_AREA) > 127).astype(np.uint8) * 255

# 30.x: 256 x 256 test images for the Fourier chapters: a square crop of sample-clean, and the same with periodic noise
fq = cv2.resize(images["sample-clean.png"][:, 60:260], (256, 256), interpolation=cv2.INTER_CUBIC).astype(np.float64)
images["sample-fft-scene.png"] = np.clip(np.rint(fq), 0, 255).astype(np.uint8)
fy, fx = np.mgrid[0:256, 0:256]
fq_noise = 28 * np.sin(2 * np.pi * (20 * fx + 12 * fy) / 256) + 18 * np.sin(2 * np.pi * (-8 * fx + 30 * fy) / 256)   # two interference waves
images["sample-fft-periodic.png"] = np.clip(np.rint(fq + fq_noise), 0, 255).astype(np.uint8)

# 31.x: woven fabric (two thread gratings, period 8 px) with a band of missing vertical threads and a small knot,
# for Gabor filters; and a CT test object of ellipses for the Radon transform (seeds 31, 32)
by, bx = np.mgrid[0:256, 0:256].astype(np.float64)
warp_amp = np.where((bx > 150) & (bx < 172) & (by > 60) & (by < 200), 0.0, 40.0)          # missing threads
fab = 128 + warp_amp * np.cos(2 * np.pi * bx / 8) + 40 * np.cos(2 * np.pi * by / 8)
fab += 60 * np.exp(-((bx - 70) ** 2 + (by - 180) ** 2) / (2 * 5.0 ** 2))                  # a knot
fab += np.random.default_rng(31).normal(0, 8, fab.shape)
images["sample-fabric.png"] = np.clip(np.rint(fab), 0, 255).astype(np.uint8)
ph = np.zeros((128, 128), np.float64)
for (cx, cy, a, b, ang, v) in [(64, 64, 46, 58, 0, 200), (64, 66, 40, 52, 0, -120), (48, 56, 10, 20, 18, 60), (80, 56, 8, 16, -18, 60), (64, 36, 7, 7, 0, 90), (64, 92, 5, 3, 0, 120), (56, 96, 2, 2, 0, 120), (72, 96, 2, 2, 0, 120)]:
    m = np.zeros((128, 128), np.uint8); cv2.ellipse(m, (cx, cy), (a, b), ang, 0, 360, 1, -1); ph += v * m.astype(np.float64)
images["sample-phantom.png"] = np.clip(ph, 0, 255).astype(np.uint8)

# 32.x: grey circuit board for template matching (240 x 150): identical chips, one rotated by 15 deg, one scaled 1.3x,
# one brighter with a lower-contrast body, one upside down; three ring fiducials and a printed label (seed 32)
def board():
    W, H, S = 240, 150, 8
    def chip(big, cx, cy, ang=0.0, sc=1.0, body=40, pin=210):
        # chip 26 x 16 with 5 pins top and bottom and a pin-1 dot, drawn at 8x into a float canvas
        def tr(pts):
            a = np.deg2rad(ang); R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
            return np.rint((np.array(pts, float) @ R.T * sc + (cx, cy)) * S).astype(np.int32)
        for i in range(5):
            x = -10 + i * 5
            cv2.fillPoly(big, [tr([[x - 1.2, -11], [x + 1.2, -11], [x + 1.2, 11], [x - 1.2, 11]])], pin)
        cv2.fillPoly(big, [tr([[-13, -8], [13, -8], [13, 8], [-13, 8]])], body)
        c = tr([[-9, -4]])[0]; cv2.circle(big, (int(c[0]), int(c[1])), int(1.6 * sc * S), 150, -1)
    def ring(big, cx, cy):
        cv2.circle(big, (cx * S, cy * S), 6 * S, 230, -1); cv2.circle(big, (cx * S, cy * S), 3 * S, 70, -1)
    big = np.full((H * S, W * S), 0, np.float32)
    for (x, y) in [(40, 35), (90, 35), (140, 35), (40, 80), (140, 80)]:
        chip(big, x, y)
    chip(big, 90, 80, ang=15)                      # rotated copy
    chip(big, 195, 45, sc=1.3)                     # larger copy
    chip(big, 195, 110, body=70, pin=250)          # brighter, lower contrast body
    chip(big, 40, 122, ang=180)                    # upside down
    for (x, y) in [(10, 10), (230, 10), (230, 140)]:
        ring(big, x, y)
    cv2.rectangle(big, (75 * S, 110 * S), (150 * S, 135 * S), 120, -1)   # a label area
    cv2.putText(big, "U7 REV B", (80 * S, 128 * S), cv2.FONT_HERSHEY_SIMPLEX, 0.45 * S, 20, 2 * S // 2)
    m = (big > 0).astype(np.float32); img = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA); cov = cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA)
    yy, xx = np.mgrid[0:H, 0:W]; bg = 85 + 25 * xx / W
    img = img + (1 - cov) * bg
    img = img + np.random.default_rng(32).normal(0, 3, img.shape)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)
images["sample-board.png"] = board()

# Module 33-34: feature scene (corners, edges, a disc, a checkerboard, text) and a second view of it
# under a known homography (rotation 15 deg, scale 0.9, slight perspective), darker and with new noise.
def feat_scene():
    rng = np.random.default_rng(33)
    img = np.full((200, 320), 120.0)
    img += np.linspace(-15, 15, 320)[None, :]
    cv2.rectangle(img, (20, 20), (90, 70), 200, -1)
    cv2.rectangle(img, (40, 35), (70, 55), 60, -1)
    cv2.fillPoly(img, [np.array([[120, 25], [175, 25], [175, 45], [140, 45], [140, 80], [120, 80]], np.int32)], 40)
    cv2.fillPoly(img, [np.array([[220, 80], [260, 15], [300, 80]], np.int32)], 210)
    cv2.circle(img, (60, 140), 32, 190, -1, cv2.LINE_AA)
    for i in range(4):
        for j in range(4):
            cv2.rectangle(img, (120 + 12 * j, 110 + 12 * i), (131 + 12 * j, 121 + 12 * i), 230 if (i + j) % 2 == 0 else 30, -1)
    cv2.putText(img, "A7", (200, 170), cv2.FONT_HERSHEY_SIMPLEX, 1.4, 25, 3, cv2.LINE_AA)
    cv2.line(img, (20, 190), (300, 190), 200, 3)
    img = cv2.GaussianBlur(img, (0, 0), 0.8)
    img += rng.normal(0, 3, img.shape)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


FEAT_H = np.array([[0.9 * np.cos(np.radians(15)), -0.9 * np.sin(np.radians(15)), 40],
                   [0.9 * np.sin(np.radians(15)), 0.9 * np.cos(np.radians(15)), -25],
                   [0.0002, 0.0001, 1.0]])
images["sample-feat.png"] = feat_scene()
images["sample-hog-l.png"] = images["sample-feat.png"][17:81, 112:176]   # 64x64 crop around the L-shape, for HOG (35.3)
ft_b = cv2.warpPerspective(images["sample-feat.png"].astype(np.float64), FEAT_H, (320, 200), flags=cv2.INTER_LINEAR,
                           borderMode=cv2.BORDER_CONSTANT, borderValue=110)
images["sample-feat-b.png"] = np.clip(np.rint(ft_b * 0.8 + 20 + np.random.default_rng(34).normal(0, 3, ft_b.shape)), 0, 255).astype(np.uint8)

# Module 34: textured "poster" scene for descriptors and matching, a second view under a known homography
# (rotation 25 deg, scale 0.75, perspective; gain 0.7, offset +30), and two overlapping views for stitching.
def poster(w, h, seed):
    rng = np.random.default_rng(seed)
    img = np.full((h, w), 128.0)
    for _ in range(int(w * h / 900)):
        kind = rng.integers(0, 4); g = float(rng.integers(20, 236))
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h)); s = int(rng.integers(4, 22))
        if kind == 0: cv2.circle(img, (x, y), s, g, -1, cv2.LINE_AA)
        elif kind == 1: cv2.rectangle(img, (x, y), (x + s, y + int(rng.integers(4, 22))), g, -1)
        elif kind == 2:
            pts = np.c_[x + rng.integers(-s, s, 3), y + rng.integers(-s, s, 3)].astype(np.int32)
            cv2.fillPoly(img, [pts], g, cv2.LINE_AA)
        else: cv2.ellipse(img, (x, y), (s, max(2, s // 3)), float(rng.integers(0, 180)), 0, 360, g, -1, cv2.LINE_AA)
    words = ["LOT 4471", "QC OK", "B-17", "ZX9", "PASS", "M8x20", "AUG", "7731"]
    for i in range(int(w * h / 9000)):
        cv2.putText(img, words[int(rng.integers(0, len(words)))], (int(rng.integers(0, w - 60)), int(rng.integers(15, h))),
                    cv2.FONT_HERSHEY_SIMPLEX, float(rng.uniform(0.4, 0.8)), float(rng.choice([15, 240])), 1 + int(rng.integers(0, 2)), cv2.LINE_AA)
    img = cv2.GaussianBlur(img, (0, 0), 0.7)
    return img
PO = poster(320, 240, 34)
po_a = np.clip(np.rint(PO + np.random.default_rng(1).normal(0, 3, PO.shape)), 0, 255).astype(np.uint8)
c, s = 0.75 * np.cos(np.radians(25)), 0.75 * np.sin(np.radians(25))
POSTER_H = np.array([[c, -s, 95], [s, c, -10], [0.0004, -0.0003, 1.0]])
po_b = cv2.warpPerspective(PO, POSTER_H, (320, 240), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=100)
po_b = np.clip(np.rint(po_b * 0.7 + 30 + np.random.default_rng(2).normal(0, 3, po_b.shape)), 0, 255).astype(np.uint8)
W = poster(440, 220, 35)
left = W[:, :300]
Hr = np.array([[0.98, 0.04, -140], [-0.03, 0.99, 6], [0.0, 0.00006, 1.0]])   # right view: maps pano coords -> right image
right = cv2.warpPerspective(W, Hr, (300, 220), borderMode=cv2.BORDER_REFLECT)
L = np.clip(np.rint(left + np.random.default_rng(3).normal(0, 3, left.shape)), 0, 255).astype(np.uint8)
R = np.clip(np.rint(right * 0.9 + 18 + np.random.default_rng(4).normal(0, 3, right.shape)), 0, 255).astype(np.uint8)
images["sample-poster.png"] = po_a
images["sample-poster-b.png"] = po_b
images["sample-pano-left.png"] = L
images["sample-pano-right.png"] = R

# Module 35: texture samples (72x72, 8-bit grey). Three textures with matched mean brightness but
# different local structure, plus a "missing weave" defect patch with nearly the same mean as its
# surroundings but a very different texture, for LBP, GLCM and texture-based defect detection.
def texture_woven(size, period, seed):
    rng = np.random.default_rng(seed)
    img = np.full((size, size), 170.0)
    for x in range(0, size, period):
        img[:, x:x + 2] -= 70
    for y in range(0, size, period):
        img[y:y + 2, :] -= 40
    img = np.clip(img, 0, 255)
    img += rng.normal(0, 5, img.shape)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)

def texture_smooth(size, seed):
    rng = np.random.default_rng(seed)
    xs = np.linspace(0, 2 * np.pi, size)
    base = 140 + 15 * np.sin(xs)[None, :] + 10 * np.cos(0.5 * xs)[:, None]
    img = base + rng.normal(0, 4, (size, size))
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)

def texture_blotchy(size, seed, n=45):
    rng = np.random.default_rng(seed)
    img = np.full((size, size), 128.0)
    for _ in range(n):
        x, y = int(rng.integers(0, size)), int(rng.integers(0, size))
        s = int(rng.integers(3, 9))
        g = float(rng.integers(20, 235))
        cv2.circle(img, (x, y), s, g, -1)
    img = cv2.GaussianBlur(img, (0, 0), 0.6)
    img += rng.normal(0, 4, img.shape)
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)

tex_woven = texture_woven(72, 9, 101)
tex_smooth = texture_smooth(72, 102)
tex_blotchy = texture_blotchy(72, 103)
tex_defect = tex_woven.copy().astype(np.float64)
defect_region = (slice(24, 48), slice(24, 48))     # same mean as the rest of the fabric, but the weave is missing
tex_defect[defect_region] = tex_defect[defect_region].mean() + np.random.default_rng(104).normal(0, 5, (24, 24))
tex_defect = np.clip(np.rint(tex_defect), 0, 255).astype(np.uint8)
images["sample-texture-woven.png"] = tex_woven
images["sample-texture-smooth.png"] = tex_smooth
images["sample-texture-blotchy.png"] = tex_blotchy
images["sample-texture-defect.png"] = tex_defect

for name, img in images.items():
    ok = cv2.imwrite(str(OUT / name), img)
    assert ok, f"could not write {name}"

print(f"shape={scene.shape} dtype={scene.dtype} min={scene.min()} max={scene.max()} "
      f"mean={scene.mean():.1f} above200={np.count_nonzero(scene > 200)}")
print(f"wrote {len(images)} images to {OUT}")
