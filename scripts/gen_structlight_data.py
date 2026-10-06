"""Real Gray-code structured-light decoding accuracy vs sensor noise level
(Module 42.4, StructuredLightLab): apps/web/public/data/structlight-data.json.
"""
import json

import numpy as np

W = 128
BITS = 7
rng = np.random.default_rng(3)


def to_gray_code(n, bits):
    g = n ^ (n >> 1)
    return [(g >> (bits - 1 - b)) & 1 for b in range(bits)]


def from_gray_code(bits_list):
    g = 0
    for b in bits_list:
        g = (g << 1) | b
    n = g
    shift = 1
    while shift < len(bits_list):
        n ^= (n >> shift)
        shift <<= 1
    return n


pattern_bits = np.array([to_gray_code(c, BITS) for c in range(W)])

results = []
for noise_std in (10, 20, 40, 60, 80, 100, 127, 150):
    errors, trials = 0, 500
    for _ in range(trials):
        col = rng.integers(0, W)
        bits = []
        for b in range(BITS):
            intensity = 255.0 if pattern_bits[col, b] else 0.0
            noisy = intensity + rng.normal(0, noise_std)
            bits.append(1 if noisy > 127 else 0)
        decoded = from_gray_code(bits)
        if decoded != col:
            errors += 1
    results.append({"noise_std": noise_std, "error_rate": errors / trials})

out = {"width": W, "bits": BITS, "results": results}
json.dump(out, open("apps/web/public/data/structlight-data.json", "w"), separators=(",", ":"))
for r in results:
    print(f"noise_std={r['noise_std']}: error rate {r['error_rate']*100:.1f}%")
