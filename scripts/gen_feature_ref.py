"""Reference values for apps/web/lib/feature-ops.test.ts (OpenCV 4.13): a crop of sample-feat.png, Harris and
minimum-eigenvalue maps, goodFeaturesToTrack and FAST keypoints."""
import json, cv2, numpy as np
img = cv2.imread("assets/images/generated/sample-feat.png", cv2.IMREAD_GRAYSCALE)
c = np.ascontiguousarray(img[12:76, 10:96])
h, w = c.shape
r = lambda a: [float(f"{v:.7g}") for v in a.ravel().astype(np.float64)]
out = {"w": w, "h": h, "img": c.ravel().tolist(),
       "harris2": r(cv2.cornerHarris(c, 2, 3, 0.04)), "harris3": r(cv2.cornerHarris(c, 3, 3, 0.04)),
       "mineig3": r(cv2.cornerMinEigenVal(c, 3, 3)),
       "gftt": cv2.goodFeaturesToTrack(c, 0, 0.01, 5).reshape(-1, 2).astype(int).tolist(),
       "gfttH": cv2.goodFeaturesToTrack(c, 10, 0.02, 8, useHarrisDetector=True).reshape(-1, 2).astype(int).tolist(),
       "fastNms": [[int(k.pt[0]), int(k.pt[1]), int(k.response)] for k in cv2.FastFeatureDetector_create(20, True).detect(c)],
       "fastAll": sorted([[int(k.pt[0]), int(k.pt[1])] for k in cv2.FastFeatureDetector_create(20, False).detect(c)])}
json.dump(out, open("apps/web/lib/feature-ref.json", "w"), separators=(",", ":"))
print(w, h, len(out["gftt"]), len(out["fastNms"]), len(out["fastAll"]))
