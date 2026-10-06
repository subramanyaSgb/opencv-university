"""Reference values for apps/web/lib/desc-ops.test.ts: BFMatcher results on desc-data.json and a least-squares
homography (cv2.findHomography, method 0)."""
import json, cv2, numpy as np
D = json.load(open("apps/web/public/data/desc-data.json"))
out = {}
for name in ("SIFT", "ORB", "AKAZE"):
    A = np.array([list(bytes.fromhex(h)) for h in D[name]["poster"]["d"]], np.uint8)
    B = np.array([list(bytes.fromhex(h)) for h in D[name]["poster-b"]["d"]], np.uint8)
    if name == "SIFT": A, B, norm = A.astype(np.float32), B.astype(np.float32), cv2.NORM_L2
    else: norm = cv2.NORM_HAMMING
    knn = cv2.BFMatcher(norm).knnMatch(A, B, k=2)
    out[name] = {"best": [m.trainIdx for m, _ in knn], "ratio": sum(m.distance < 0.75 * n.distance for m, n in knn),
                 "cross": sorted([m.queryIdx, m.trainIdx] for m in cv2.BFMatcher(norm, crossCheck=True).match(A, B))}
rng = np.random.default_rng(0)
src = rng.uniform(0, 300, (12, 2)); H = np.array([[0.9, -0.2, 30], [0.25, 0.8, -12], [0.0003, -0.0002, 1.0]])
dst = cv2.perspectiveTransform(src.reshape(-1, 1, 2), H).reshape(-1, 2) + rng.normal(0, 0.5, (12, 2))
Hls, _ = cv2.findHomography(src, dst, 0)
out["ls"] = {"src": src.tolist(), "dst": dst.tolist(), "H": Hls.ravel().tolist()}
json.dump(out, open("apps/web/lib/desc-ref.json", "w"), separators=(",", ":"))
print({k: (v["ratio"], len(v["cross"])) for k, v in out.items() if k != "ls"})
