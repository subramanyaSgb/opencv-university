"""Real cv2.QRCodeDetector decode results for the pre-generated damaged QR images (assets/images/
generate_samples.py), for QrLab (Module 38.4): apps/web/public/data/qr-data.json (fetched at run time)."""
import json
import cv2

G = "assets/images/generated/"
LEVELS = ["L", "H"]
FRACS = [0, 10, 20, 30, 40]

det = cv2.QRCodeDetector()
out = {"levels": LEVELS, "fracs": FRACS, "results": {}}
for level in LEVELS:
    out["results"][level] = {}
    for frac in FRACS:
        name = f"sample-qr-{level}-{frac:02d}.png"
        img = cv2.imread(G + name, cv2.IMREAD_GRAYSCALE)
        data, points, _ = det.detectAndDecode(img)
        out["results"][level][str(frac)] = {"image": name, "decoded": data}

json.dump(out, open("apps/web/public/data/qr-data.json", "w"), separators=(",", ":"))
for level in LEVELS:
    print(level, {f: out["results"][level][str(f)]["decoded"] for f in FRACS})
