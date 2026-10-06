"""Real cv2.CascadeClassifier face + eye detections on sample-synth-face-scene.png, plus ground-truth
boxes and IoU, for FaceDetectLab (Module 37.5): apps/web/public/data/facedetect-data.json (fetched by the
lab at run time)."""
import json
import cv2

G = "assets/images/generated/"
GROUND_TRUTH = [(30, 20, 160, 160), (320, 140, 110, 110)]

def iou(a, b):
    ax0, ay0, ax1, ay1 = a[0], a[1], a[0] + a[2], a[1] + a[3]
    bx0, by0, bx1, by1 = b[0], b[1], b[0] + b[2], b[1] + b[3]
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax1, bx1), min(ay1, by1)
    inter = max(0, ix1 - ix0) * max(0, iy1 - iy0)
    union = a[2] * a[3] + b[2] * b[3] - inter
    return inter / union if union > 0 else 0.0

img = cv2.imread(G + "sample-synth-face-scene.png", cv2.IMREAD_GRAYSCALE)
face_casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
eye_casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")

faces = sorted(face_casc.detectMultiScale(img, scaleFactor=1.05, minNeighbors=4, minSize=(50, 50)).tolist())
faces_out = []
for f in faces:
    x, y, w, h = f
    roi = img[y:y + h, x:x + w]
    eyes = eye_casc.detectMultiScale(roi, scaleFactor=1.05, minNeighbors=5, minSize=(20, 20), maxSize=(60, 60))
    best_gt = max(GROUND_TRUTH, key=lambda gt: iou(gt, f))
    faces_out.append({
        "box": f, "eyes": [[int(v) for v in e] for e in eyes],
        "iou": round(iou(best_gt, f), 4),
    })

out = {"imageSize": list(img.shape[::-1]), "groundTruth": [list(g) for g in GROUND_TRUTH], "faces": faces_out}
json.dump(out, open("apps/web/public/data/facedetect-data.json", "w"), separators=(",", ":"))
print(out)
