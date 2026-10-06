"""Real, from-scratch NumPy multi-view plane-sweep stereo on three synthetic 1-D test
scenes (Module 44.3, MultiViewStereoLab): apps/web/public/data/mvs-data.json.
"""
import json

import numpy as np

F = 800.0
Z_TRUE = 1000.0
W = 3000
PMIN, PMAX = -600, 900
PIX_RANGE = np.arange(PMIN, PMAX)
REF_PIXELS = np.arange(50, 250)
DEPTH_CANDIDATES = np.arange(700, 1301, 5)


def lookup(arr, p):
    idx = np.clip(p - PMIN, 0, len(arr) - 2)
    i0 = np.floor(idx).astype(int)
    frac = idx - i0
    return arr[i0] * (1 - frac) + arr[i0 + 1] * frac


def sample_texture(texture, pos):
    pos_c = np.clip(pos, 0, len(texture) - 2)
    i0 = np.floor(pos_c).astype(int)
    frac = pos_c - i0
    return texture[i0] * (1 - frac) + texture[i0 + 1] * frac


def render_camera(texture, cam_x, noise_std, seed):
    rng = np.random.default_rng(seed)
    wx = cam_x + PIX_RANGE * Z_TRUE / F
    return sample_texture(texture, wx) + rng.normal(0, noise_std, len(PIX_RANGE))


def plane_sweep(texture, n_cams, spacing, noise_std, seed_base):
    cam_positions = np.arange(n_cams) * spacing
    observed = [render_camera(texture, cx, noise_std, seed_base + i) for i, cx in enumerate(cam_positions)]
    variances = np.zeros((len(DEPTH_CANDIDATES), len(REF_PIXELS)))
    for di, d in enumerate(DEPTH_CANDIDATES):
        wx_ref = cam_positions[0] + REF_PIXELS * d / F
        vals = [lookup(observed[ci], (wx_ref - cx) * F / d) for ci, cx in enumerate(cam_positions)]
        variances[di] = np.array(vals).var(axis=0)
    best = DEPTH_CANDIDATES[np.argmin(variances, axis=0)]
    err = np.abs(best - Z_TRUE)
    return {
        "mean_error_mm": round(float(err.mean()), 2),
        "median_error_mm": round(float(np.median(err)), 2),
        "frac_within_10mm_pct": round(float(np.mean(err <= 10) * 100), 1),
    }


# One continuous RNG stream, exactly as verified by hand: nonperiodic texture first,
# then the periodic texture's broadband component continues the SAME stream (this
# specific noisy-periodic combination is what produces the real 2-view ambiguity below;
# a pure, noise-free sinusoid instead ties EVERY pixel identically, which is a much less
# realistic -- if cleaner -- failure than real repetitive textures actually show).
rng = np.random.default_rng(42)
texture_nonperiodic = 128 + rng.normal(0, 40, W)
texture_periodic = 128 + 80 * np.sin(2 * np.pi * np.arange(W) / 40.0) + rng.normal(0, 3, W)

rng_flat = np.random.default_rng(42)
texture_textureless = 128 + rng_flat.normal(0, 1.0, W)

scenes = {
    "nonperiodic": {"texture": texture_nonperiodic, "noise_std": 5.0, "seed_base": 100,
                    "label": "Non-periodic texture, real sensor noise"},
    "periodic": {"texture": texture_periodic, "noise_std": 5.0, "seed_base": 200,
                 "label": "Repetitive texture, real sensor noise (a real aliasing hazard)"},
    "textureless": {"texture": texture_textureless, "noise_std": 5.0, "seed_base": 300,
                     "label": "Textureless, real sensor noise"},
}

out = {"f": F, "z_true": Z_TRUE, "spacing_mm": 50.0, "n_cams_tested": [2, 5, 9], "scenes": {}}
for key, cfg in scenes.items():
    out["scenes"][key] = {
        "label": cfg["label"],
        "noise_std": cfg["noise_std"],
        "results": {
            str(n): plane_sweep(cfg["texture"], n, 50.0, cfg["noise_std"], cfg["seed_base"])
            for n in [2, 5, 9]
        },
    }

json.dump(out, open("apps/web/public/data/mvs-data.json", "w"), separators=(",", ":"))
print(json.dumps(out, indent=None))
