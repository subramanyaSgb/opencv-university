"""Real line-crossing counting comparison on a synthetic noisy object crossing a line once
(Module 40.7, CountLab): apps/web/public/data/count-data.json.

Three counting strategies on the IDENTICAL real data: counting frames where the object is
simply past the line (presence), counting every side-flip of the noisy measurement (naive
event), and counting side-flips only past a hysteresis margin (correct event counting).
"""
import json

import numpy as np

rng = np.random.default_rng(9)
N = 60
LINE_X = 100.0
HYSTERESIS = 5.0

true_x = np.linspace(60, 140, N)
measured_x = true_x + rng.normal(0, 3.0, N)

presence_count, naive_count, hyst_count = 0, 0, 0
prev_side = measured_x[0] > LINE_X
state = "left" if measured_x[0] < LINE_X else "right"
presence_counts, naive_counts, hyst_counts = [], [], []
for t in range(N):
    x = measured_x[t]
    if x > LINE_X:
        presence_count += 1
    if t > 0:
        side = x > LINE_X
        if side != prev_side:
            naive_count += 1
        prev_side = side
        if state == "left" and x > LINE_X + HYSTERESIS:
            hyst_count += 1
            state = "right"
        elif state == "right" and x < LINE_X - HYSTERESIS:
            hyst_count += 1
            state = "left"
    presence_counts.append(presence_count)
    naive_counts.append(naive_count)
    hyst_counts.append(hyst_count)

out = {
    "line_x": LINE_X, "hysteresis": HYSTERESIS,
    "true_x": true_x.tolist(), "measured_x": measured_x.tolist(),
    "presence_counts": presence_counts, "naive_counts": naive_counts, "hyst_counts": hyst_counts,
}
json.dump(out, open("apps/web/public/data/count-data.json", "w"), separators=(",", ":"))
print("final presence count:", presence_counts[-1])
print("final naive event count:", naive_counts[-1])
print("final hysteresis event count:", hyst_counts[-1])
print("true crossings: 1")
