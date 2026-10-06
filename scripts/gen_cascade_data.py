"""cv2.CascadeClassifier (haarcascade_frontalface_default) detections at several minNeighbors settings on
sample-synth-face.png, for CascadeLab (Module 37.2): apps/web/public/data/cascade-data.json (fetched by
the lab at run time). A real trained cascade can't be run in the browser, so (like SvmLab/TreeLab/BoostLab)
this precomputes real cv2.CascadeClassifier.detectMultiScale output."""
import json
import cv2

G = "assets/images/generated/"
MIN_NEIGHBOURS = [0, 1, 3, 5, 10]

img = cv2.imread(G + "sample-synth-face.png", cv2.IMREAD_GRAYSCALE)
casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

out = {
    "imageSize": list(img.shape[::-1]),
    "windowSize": list(casc.getOriginalWindowSize()),
    "minNeighbours": MIN_NEIGHBOURS,
    "detections": {
        str(mn): (lambda d: d.tolist() if hasattr(d, "tolist") else [])(
            casc.detectMultiScale(img, scaleFactor=1.05, minNeighbors=mn, minSize=(60, 60))
        )
        for mn in MIN_NEIGHBOURS
    },
}
json.dump(out, open("apps/web/public/data/cascade-data.json", "w"), separators=(",", ":"))
print({k: len(v) for k, v in out["detections"].items()})
