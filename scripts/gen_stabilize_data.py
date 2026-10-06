"""Real cv2.phaseCorrelate frame-to-frame motion estimates for a synthetic shaky sequence
(Module 39.7, StabilizeLab): apps/web/public/data/stabilize-data.json (fetched at run time).

Two cases, same real random-walk camera jitter (seed 7, std 1.5 px/step), applied to
sample-scene.png: one with no foreground object, one with a large (r=90) independently
moving disc, to show the real effect of a dominant moving object on global stabilization.
"""
import json

import cv2
import numpy as np

base = cv2.imread("assets/images/generated/sample-scene.png", cv2.IMREAD_GRAYSCALE)
H, W = base.shape

rng = np.random.default_rng(seed=7)
N = 50
jitter = np.cumsum(rng.normal(0, 1.5, (N, 2)), axis=0)
jitter -= jitter[0]
win = cv2.createHanningWindow((W, H), cv2.CV_32F)


def make_shaky(obj_radius):
    frames = []
    for i in range(N):
        frame = base.copy()
        if obj_radius > 0:
            x = int(20 + i * (W - 60) / (N - 1))
            cv2.circle(frame, (x, H - 50), obj_radius, 255, -1)
        dx, dy = jitter[i]
        matrix = np.float32([[1, 0, dx], [0, 1, dy]])
        frames.append(cv2.warpAffine(frame, matrix, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT))
    return frames


def frame_to_frame_shifts(frames):
    shifts = [(0.0, 0.0)]
    for i in range(1, len(frames)):
        (dx, dy), _resp = cv2.phaseCorrelate(frames[i - 1].astype(np.float32), frames[i].astype(np.float32), win)
        shifts.append((dx, dy))
    return shifts


out = {"frames": N, "cases": {}}
for key, radius in [("clean", 0), ("object", 90)]:
    frames = make_shaky(radius)
    out["cases"][key] = {"shifts": frame_to_frame_shifts(frames)}

json.dump(out, open("apps/web/public/data/stabilize-data.json", "w"), separators=(",", ":"))
for key in out["cases"]:
    shifts = np.array(out["cases"][key]["shifts"])
    mag = np.hypot(shifts[:, 0], shifts[:, 1])
    print(key, "mean |shift| (px):", round(mag.mean(), 3), "max:", round(mag.max(), 3))
