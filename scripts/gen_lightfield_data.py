"""Real, from-scratch NumPy light-field synthetic-aperture refocusing (shift-and-average
over many sub-aperture views) on a synthetic two-depth scene with sparse occluders
(Module 45.2, LightFieldLab): apps/web/public/data/lightfield-data.json.
"""
import json

import numpy as np

F = 800.0
Z_BG = 1000.0
Z_FG = 500.0
W = 6000
PMIN, PMAX = -3000, 3000
PIX_RANGE = np.arange(PMIN, PMAX)
REF_PIXELS = np.arange(100, 400)
SLAT_VALUE = 30.0
N_CAMS_TESTED = [1, 3, 9, 17, 33]


def sample_tex(tex, pos):
    pos_c = np.clip(pos, 0, len(tex) - 2)
    i0 = np.floor(pos_c).astype(int)
    frac = pos_c - i0
    return tex[i0] * (1 - frac) + tex[i0 + 1] * frac


def lookup(arr, p):
    idx = np.clip(p - PMIN, 0, len(arr) - 2)
    i0 = np.floor(idx).astype(int)
    frac = idx - i0
    return arr[i0] * (1 - frac) + arr[i0 + 1] * frac


rng = np.random.default_rng(55)
texture_bg = 128 + rng.normal(0, 40, W)
rng_occ = np.random.default_rng(77)
occ_mask_world = rng_occ.random(W) < 0.08


def is_occluder(world_x):
    idx = np.clip(np.round(world_x).astype(int), 0, W - 1)
    return occ_mask_world[idx]


def render_camera(cam_x, noise_std, seed):
    rng2 = np.random.default_rng(seed)
    val_bg = sample_tex(texture_bg, cam_x + PIX_RANGE * Z_BG / F)
    occ = is_occluder(cam_x + PIX_RANGE * Z_FG / F)
    val = np.where(occ, SLAT_VALUE, val_bg)
    return val + rng2.normal(0, noise_std, len(PIX_RANGE))


def refocus(cam_positions, observed, z_focus, ref_pixels):
    wx_ref = cam_positions[0] + ref_pixels * z_focus / F
    vals = [lookup(observed[ci], (wx_ref - cx) * F / z_focus) for ci, cx in enumerate(cam_positions)]
    return np.mean(vals, axis=0)


true_bg_at_ref = sample_tex(texture_bg, REF_PIXELS * Z_BG / F)

results_bg_focus = []
results_fg_focus = []
for n_cams in N_CAMS_TESTED:
    cam_positions = np.arange(n_cams) * 50.0
    observed = [render_camera(cx, 3.0, seed=700 + ci) for ci, cx in enumerate(cam_positions)]

    refocused_bg = refocus(cam_positions, observed, Z_BG, REF_PIXELS)
    err_bg = np.abs(refocused_bg - true_bg_at_ref)
    wx_fg_ref = cam_positions[0] + REF_PIXELS * Z_FG / F
    occluded_in_ref_cam = is_occluder(wx_fg_ref)
    results_bg_focus.append({
        "n_cams": n_cams,
        "mean_error_on_occluded_px": round(float(err_bg[occluded_in_ref_cam].mean()), 2),
        "mean_error_overall": round(float(err_bg.mean()), 2),
    })

    refocused_fg = refocus(cam_positions, observed, Z_FG, REF_PIXELS)
    err_fg = np.abs(refocused_fg[occluded_in_ref_cam] - SLAT_VALUE)
    results_fg_focus.append({
        "n_cams": n_cams,
        "mean_error_on_occluder_px": round(float(err_fg.mean()), 2),
    })

out = {
    "f": F, "z_bg": Z_BG, "z_fg": Z_FG, "spacing_mm": 50.0,
    "occluder_coverage_pct": round(float(occ_mask_world.mean() * 100), 1),
    "results_focus_on_background": results_bg_focus,
    "results_focus_on_occluder": results_fg_focus,
}
json.dump(out, open("apps/web/public/data/lightfield-data.json", "w"), separators=(",", ":"))
print(json.dumps(out, indent=None))
