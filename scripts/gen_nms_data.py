"""Raw, pre-NMS detections (boxes + real confidence scores) for NmsLab (Module 37.4): the 37.2 face
cascade's minNeighbors=0 output (with detectMultiScale3's levelWeights) and the 37.1 board template's raw
NCC matches. apps/web/public/data/nms-data.json (fetched by the lab at run time; actual non-max
suppression is simple enough to run live in the browser, only the raw detections are precomputed)."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"

face = cv2.imread(G + "sample-synth-face.png", cv2.IMREAD_GRAYSCALE)
casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
objs, _, weights = casc.detectMultiScale3(face, scaleFactor=1.05, minNeighbors=0, minSize=(60, 60), outputRejectLevels=True)
face_boxes = [{"x": int(o[0]), "y": int(o[1]), "w": int(o[2]), "h": int(o[3]), "score": round(float(w), 4)} for o, w in zip(objs, weights)]

board = cv2.imread(G + "sample-board.png", cv2.IMREAD_GRAYSCALE)
tpl = board[22:49, 25:56]
th, tw = tpl.shape
result = cv2.matchTemplate(board, tpl, cv2.TM_CCOEFF_NORMED)
ys, xs = np.where(result >= 0.7)
board_boxes = [{"x": int(x), "y": int(y), "w": int(tw), "h": int(th), "score": round(float(result[y, x]), 4)} for x, y in zip(xs, ys)]

out = {
    "face": {"image": "sample-synth-face.png", "imageSize": list(face.shape[::-1]), "boxes": face_boxes},
    "board": {"image": "sample-board.png", "imageSize": list(board.shape[::-1]), "boxes": board_boxes},
}
json.dump(out, open("apps/web/public/data/nms-data.json", "w"), separators=(",", ":"))
print("face raw boxes:", len(face_boxes), "board raw boxes:", len(board_boxes))
