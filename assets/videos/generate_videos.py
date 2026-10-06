"""Generate the synthetic sample videos used by Module 39 (Video fundamentals).

Run from the repo root:  python assets/videos/generate_videos.py
Pinned: opencv-python 4.13.0.92, numpy 2.x (see CLAUDE.md). Also needs a real `ffmpeg`
on PATH, used only to transcode OpenCV's raw mp4v/MPEG-4 output to a browser-playable
H.264 stream (cv2.VideoWriter itself cannot write H.264 in this build -- see 39.1).

Every video here is generated, so it carries no third-party licence.
Record any new video in assets/videos/SOURCES.md.
"""
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np

OUT = Path(__file__).parent / "generated"
OUT.mkdir(exist_ok=True)

FFMPEG = shutil.which("ffmpeg")
if not FFMPEG:
    raise SystemExit("ffmpeg not found on PATH -- needed to transcode to a browser-playable H.264 file")

# --- sample-ball-25fps.mp4: a ball crossing the frame at a known, constant 25 fps -----
# Used across 39.1-39.7: frame count/fps/timestamp arithmetic, a codec transcode, and
# (in later chapters) as the one shared clip for buffering, sync and stabilization demos.
W, H, FPS, N_FRAMES = 400, 300, 25, 50  # 50 frames at 25 fps = exactly 2.000 s

raw_path = OUT / "_raw_ball.mp4"
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
writer = cv2.VideoWriter(str(raw_path), fourcc, FPS, (W, H))
for i in range(N_FRAMES):
    frame = np.full((H, W, 3), 235, np.uint8)
    cv2.line(frame, (0, H // 2), (W, H // 2), (200, 200, 200), 1)
    x = int(20 + i * (W - 40) / (N_FRAMES - 1))
    cv2.circle(frame, (x, H // 2), 16, (40, 90, 220), -1)
    cv2.putText(frame, f"frame {i:02d}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (20, 20, 20), 2)
    cv2.putText(frame, f"t={i / FPS:.3f}s", (10, H - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (20, 20, 20), 2)
    writer.write(frame)
writer.release()

final_path = OUT / "sample-ball-25fps.mp4"
subprocess.run(
    [FFMPEG, "-y", "-loglevel", "error", "-i", str(raw_path),
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(final_path)],
    check=True,
)
raw_path.unlink()
print(f"wrote {final_path.name}: {N_FRAMES} frames at {FPS} fps")

# --- sample-ball-25fps-bf2.mp4: the same clip, re-encoded with 2 B-frames per GOP -------
# Used in 39.5: a real B-frame reorder delay (ffprobe DTS vs PTS), and to show cv2.VideoCapture
# only ever reports presentation-order timing (CAP_PROP_POS_MSEC), never decode-order DTS.
bf2_path = OUT / "sample-ball-25fps-bf2.mp4"
subprocess.run(
    [FFMPEG, "-y", "-loglevel", "error", "-i", str(final_path),
     "-c:v", "libx264", "-bf", "2", "-g", "50", "-pix_fmt", "yuv420p", str(bf2_path)],
    check=True,
)
print(f"wrote {bf2_path.name}: same clip, 2 B-frames per GOP")
