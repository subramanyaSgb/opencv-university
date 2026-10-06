"""Real, from-scratch NumPy photometric stereo (Lambertian linear solve) on a synthetic
rendered sphere, with and without shadow-aware least squares (Module 44.2, PhotoStereoLab):
apps/web/public/data/photostereo-data.json.
"""
import json

import numpy as np

SIZE = 101
RADIUS = SIZE // 2 - 1
ALBEDO = 0.8


def build_sphere():
    cx, cy = SIZE // 2, SIZE // 2
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    dx, dy = (xx - cx).astype(float), (yy - cy).astype(float)
    r2 = dx ** 2 + dy ** 2
    mask = r2 <= RADIUS ** 2
    dz = np.zeros_like(dx)
    dz[mask] = np.sqrt(np.maximum(RADIUS ** 2 - r2[mask], 0))
    normals = np.zeros((SIZE, SIZE, 3))
    normals[..., 0], normals[..., 1], normals[..., 2] = dx / RADIUS, dy / RADIUS, dz / RADIUS
    nm = np.linalg.norm(normals, axis=2)
    normals[mask] /= nm[mask][:, None]
    return normals, mask


def light_dir(az_deg, el_deg):
    az, el = np.radians(az_deg), np.radians(el_deg)
    return np.array([np.cos(el) * np.cos(az), np.cos(el) * np.sin(az), np.sin(el)])


def render(normals, mask, light, clip=True):
    L = light / np.linalg.norm(light)
    I = ALBEDO * np.einsum('ijk,k->ij', normals, L)
    if clip:
        I = np.clip(I, 0, None)
    I[~mask] = 0
    return I


def angular_error(normals, mask, N_est):
    tf, ef, mf = normals.reshape(-1, 3), N_est.reshape(-1, 3), mask.reshape(-1)
    cos_sim = np.sum(tf * ef, axis=1)
    return np.degrees(np.arccos(np.clip(cos_sim, -1, 1)))[mf]


def solve_naive(images, lights):
    L_mat = np.array(lights)
    I_stack = np.stack(images, axis=0).reshape(len(lights), -1)
    rhoN = np.linalg.solve(L_mat, I_stack) if len(lights) == 3 else np.linalg.lstsq(L_mat, I_stack, rcond=None)[0]
    rho = np.linalg.norm(rhoN, axis=0)
    N_est = np.zeros_like(rhoN)
    v = rho > 1e-6
    N_est[:, v] = rhoN[:, v] / rho[v]
    return N_est.T.reshape(SIZE, SIZE, 3), rho.reshape(SIZE, SIZE)


def solve_shadow_aware(images, lights, thresh=1e-3):
    L_mat = np.array(lights)
    I_stack = np.stack(images, axis=0).reshape(len(lights), -1)
    rhoN = np.zeros((3, I_stack.shape[1]))
    for p in range(I_stack.shape[1]):
        obs = I_stack[:, p]
        valid = obs > thresh
        if valid.sum() < 3:
            continue
        sol, *_ = np.linalg.lstsq(L_mat[valid], obs[valid], rcond=None)
        rhoN[:, p] = sol
    rho = np.linalg.norm(rhoN, axis=0)
    N_est = np.zeros_like(rhoN)
    v = rho > 1e-6
    N_est[:, v] = rhoN[:, v] / rho[v]
    return N_est.T.reshape(SIZE, SIZE, 3)


normals, mask = build_sphere()

configs = [
    (3, [45, 45, 45]),
    (6, [30, 30, 30, 60, 60, 60]),
    (12, [20, 20, 20, 20, 45, 45, 45, 45, 70, 70, 70, 70]),
]

results = []
for n_lights, els in configs:
    azs = np.linspace(0, 360, n_lights, endpoint=False)
    lights = [light_dir(az, el) for az, el in zip(azs, els)]
    images = [render(normals, mask, l, clip=True) for l in lights]

    shadow_any = np.zeros(mask.shape, dtype=bool)
    for l in lights:
        L = l / np.linalg.norm(l)
        dp = np.einsum('ijk,k->ij', normals, L)
        shadow_any |= (dp < 0) & mask

    N_naive, rho_naive = solve_naive(images, lights)
    err_naive = angular_error(normals, mask, N_naive)

    N_sa = solve_shadow_aware(images, lights)
    err_sa = angular_error(normals, mask, N_sa)

    results.append({
        "n_lights": n_lights,
        "frac_shadowed_any": round(float(shadow_any[mask].mean()), 4),
        "naive_mean_error_deg": round(float(err_naive.mean()), 4),
        "naive_max_error_deg": round(float(err_naive.max()), 4),
        "shadow_aware_mean_error_deg": round(float(err_sa.mean()), 4),
        "shadow_aware_max_error_deg": round(float(err_sa.max()), 4),
        "shadow_aware_n_failed_pixels": int((err_sa > 45).sum()),
        "n_masked_pixels": int(mask.sum()),
    })

# no-shadow (unclipped) baseline, 3 lights -- pure linear-algebra correctness check
lights3 = [light_dir(0, 45), light_dir(120, 45), light_dir(240, 45)]
images3_noclip = [render(normals, mask, l, clip=False) for l in lights3]
N_noclip, rho_noclip = solve_naive(images3_noclip, lights3)
err_noclip = angular_error(normals, mask, N_noclip)

out = {
    "albedo_true": ALBEDO,
    "sphere_radius": RADIUS,
    "n_masked_pixels": int(mask.sum()),
    "noclip_baseline_mean_error_deg": round(float(err_noclip.mean()), 8),
    "mean_albedo_recovered_3lights": round(float(rho_naive.reshape(-1)[mask.reshape(-1)].mean()), 4) if False else None,
    "configs": results,
}

# recompute mean recovered albedo for the 3-light naive case specifically
lights3n = [light_dir(0, 45), light_dir(120, 45), light_dir(240, 45)]
images3n = [render(normals, mask, l, clip=True) for l in lights3n]
_, rho3 = solve_naive(images3n, lights3n)
out["mean_albedo_recovered_3lights"] = round(float(rho3.reshape(-1)[mask.reshape(-1)].mean()), 4)

json.dump(out, open("apps/web/public/data/photostereo-data.json", "w"), separators=(",", ":"))
print(json.dumps(out, indent=None))
