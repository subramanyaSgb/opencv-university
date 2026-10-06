"""Real cv2.inpaint (TELEA and NS) PSNR results vs hole size and shape (Module 48.2,
InpaintLab): apps/web/public/data/inpaint-data.json.
"""
import json

import cv2
import numpy as np

rng = np.random.default_rng(30)
H, W = 200, 200
yy, xx = np.mgrid[0:H, 0:W]
base = (128 + 60 * np.sin(xx / 20) + 40 * np.cos(yy / 15)).astype(np.float32) + rng.normal(0, 5, (H, W))
img = np.clip(base, 0, 255).astype(np.uint8)


def psnr(a, b):
    mse = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return 10 * np.log10(255.0 ** 2 / mse) if mse > 0 else float("inf")


results = []
for radius in [3, 8, 15, 30, 50]:
    mask = np.zeros((H, W), dtype=np.uint8)
    cv2.circle(mask, (W // 2, H // 2), radius, 255, -1)
    damaged = img.copy()
    damaged[mask > 0] = 0
    telea = cv2.inpaint(damaged, mask, 3, cv2.INPAINT_TELEA)
    ns = cv2.inpaint(damaged, mask, 3, cv2.INPAINT_NS)
    results.append({
        "radius": radius, "shape": "circle", "area": int((mask > 0).sum()),
        "telea_psnr": round(float(psnr(img[mask > 0], telea[mask > 0])), 2),
        "ns_psnr": round(float(psnr(img[mask > 0], ns[mask > 0])), 2),
    })

mask_scratch = np.zeros((H, W), dtype=np.uint8)
cv2.line(mask_scratch, (20, 100), (180, 100), 255, thickness=4)
damaged_s = img.copy()
damaged_s[mask_scratch > 0] = 0
telea_s = cv2.inpaint(damaged_s, mask_scratch, 3, cv2.INPAINT_TELEA)
ns_s = cv2.inpaint(damaged_s, mask_scratch, 3, cv2.INPAINT_NS)
scratch_result = {
    "area": int((mask_scratch > 0).sum()),
    "telea_psnr": round(float(psnr(img[mask_scratch > 0], telea_s[mask_scratch > 0])), 2),
    "ns_psnr": round(float(psnr(img[mask_scratch > 0], ns_s[mask_scratch > 0])), 2),
}

out = {"circles": results, "scratch": scratch_result}
json.dump(out, open("apps/web/public/data/inpaint-data.json", "w"), separators=(",", ":"))
print(json.dumps(out))
