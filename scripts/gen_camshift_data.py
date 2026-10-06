"""Real cv2.meanShift vs cv2.CamShift tracking on a synthetic growing, moving coloured
object (Module 40.4, CamShiftLab): apps/web/public/data/camshift-data.json.

The object grows over time (simulating it approaching the camera); CamShift's adaptive
window should track it accurately throughout, while meanShift's fixed-size window should
increasingly lag as the object outgrows it.
"""
import json

import cv2
import numpy as np

H, W = 150, 250
N = 30
rng = np.random.default_rng(5)


def make_frame(t):
    frame = np.full((H, W, 3), (120, 110, 100), np.uint8)
    cx = 30 + t * 6
    size = 15 + t * 0.8
    cv2.circle(frame, (int(cx), H // 2), int(size), (30, 30, 220), -1)
    noise = rng.normal(0, 4, frame.shape)
    return np.clip(frame.astype(np.float32) + noise, 0, 255).astype(np.uint8), cx, size


frames, true_cx, true_size = [], [], []
for t in range(N):
    f, cx, s = make_frame(t)
    frames.append(f)
    true_cx.append(cx)
    true_size.append(s)

hsv0 = cv2.cvtColor(frames[0], cv2.COLOR_BGR2HSV)
mask0 = np.zeros((H, W), np.uint8)
cv2.circle(mask0, (int(true_cx[0]), H // 2), int(true_size[0]), 255, -1)
hist = cv2.calcHist([hsv0], [0], mask0, [32], [0, 180])
cv2.normalize(hist, hist, 0, 255, cv2.NORM_MINMAX)

x0, y0 = int(true_cx[0] - true_size[0]), int(H // 2 - true_size[0])
w0, h0 = int(2 * true_size[0]), int(2 * true_size[0])
window_ms, window_cs = (x0, y0, w0, h0), (x0, y0, w0, h0)
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 1)

frames_out = []
for t, f in enumerate(frames):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    backproj = cv2.calcBackProject([hsv], [0], hist, [0, 180], 1)
    _ret, window_ms = cv2.meanShift(backproj, window_ms, crit)
    _track_box, window_cs = cv2.CamShift(backproj, window_cs, crit)
    frames_out.append({
        "true": [round(true_cx[t] - true_size[t]), int(H // 2 - true_size[t]), round(2 * true_size[t]), round(2 * true_size[t])],
        "meanshift": [int(v) for v in window_ms],
        "camshift": [int(v) for v in window_cs],
    })

out = {"width": W, "height": H, "frames": frames_out}
json.dump(out, open("apps/web/public/data/camshift-data.json", "w"), separators=(",", ":"))

ms_err = [abs((fr["meanshift"][0] + fr["meanshift"][2] / 2) - (fr["true"][0] + fr["true"][2] / 2)) for fr in frames_out]
cs_err = [abs((fr["camshift"][0] + fr["camshift"][2] / 2) - (fr["true"][0] + fr["true"][2] / 2)) for fr in frames_out]
print("mean |error| meanShift:", round(np.mean(ms_err), 2), " CamShift:", round(np.mean(cs_err), 2))
print("max  |error| meanShift:", round(np.max(ms_err), 2), " CamShift:", round(np.max(cs_err), 2))
