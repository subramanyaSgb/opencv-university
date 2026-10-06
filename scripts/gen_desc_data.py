"""Keypoints and descriptors for DescLab (Module 34), computed with OpenCV 4.13 on the poster pair and the panorama
pair: apps/web/public/data/desc-data.json (fetched by the lab at run time)."""
import json, cv2, numpy as np
G = "assets/images/generated/"
img = {k: cv2.imread(G + f"sample-{k}.png", cv2.IMREAD_GRAYSCALE) for k in ("poster", "poster-b", "pano-left", "pano-right")}
dets = {"SIFT": cv2.SIFT_create(), "ORB": cv2.ORB_create(1000), "AKAZE": cv2.AKAZE_create()}
def pack(im, d):
    kp, de = d.detectAndCompute(im, None)
    return {"kp": [[round(k.pt[0], 2), round(k.pt[1], 2), round(k.size, 2), round(k.angle, 1), k.octave & 255] for k in kp],
            "d": [bytes(np.asarray(r, np.uint8)).hex() for r in de]}
out = {name: {k: pack(img[k], d) for k in ("poster", "poster-b")} for name, d in dets.items()}
out["pano"] = {k: pack(img[k], cv2.ORB_create(1500)) for k in ("pano-left", "pano-right")}
json.dump(out, open("apps/web/public/data/desc-data.json", "w"), separators=(",", ":"))
print({n: [len(v[k]["kp"]) for k in v] for n, v in out.items()})
