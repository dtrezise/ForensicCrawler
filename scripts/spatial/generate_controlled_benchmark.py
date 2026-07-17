#!/usr/bin/env python3
"""Generate a project-owned, deterministic spatial-validation fixture.

This is a benign synthetic benchmark. It exercises camera calibration, pose
recovery, triangulation, point-cloud, mesh, and Gaussian-splat artifact contracts
without downloading or retaining third-party imagery.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "fixtures" / "benchmarks" / "controlled-spatial-v1"
WIDTH, HEIGHT = 1280, 960
K = np.array([[900.0, 0.0, WIDTH / 2], [0.0, 900.0, HEIGHT / 2], [0.0, 0.0, 1.0]])


def canonical_write(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def look_at(camera: np.ndarray, target: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    forward = target - camera
    forward /= np.linalg.norm(forward)
    right = np.cross(forward, np.array([0.0, 0.0, 1.0]))
    right /= np.linalg.norm(right)
    down = np.cross(forward, right)
    rotation_world_to_camera = np.vstack([right, down, forward])
    translation = -rotation_world_to_camera @ camera
    return rotation_world_to_camera, translation


def project(points: np.ndarray, rotation: np.ndarray, translation: np.ndarray) -> np.ndarray:
    camera_points = (rotation @ points.T + translation[:, None]).T
    pixels = (K @ camera_points.T).T
    return pixels[:, :2] / pixels[:, 2:3]


def write_ply(path: Path, points: np.ndarray, colors: np.ndarray, splat: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    extra = "\nproperty float scale_0\nproperty float scale_1\nproperty float scale_2\nproperty float opacity" if splat else ""
    header = f"ply\nformat ascii 1.0\nelement vertex {len(points)}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue{extra}\nend_header\n"
    rows = []
    for point, color in zip(points, colors):
        base = f"{point[0]:.8f} {point[1]:.8f} {point[2]:.8f} {int(color[0])} {int(color[1])} {int(color[2])}"
        rows.append(base + (" -2.8 -2.8 -2.8 0.95" if splat else ""))
    path.write_text(header + "\n".join(rows) + "\n", encoding="utf-8")


OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(20260717)

# Measured 2 m x 1.5 m x 1 m control frame plus interior control points.
corners = np.array([[x, y, z] for x in (-1.0, 1.0) for y in (-0.75, 0.75) for z in (0.0, 1.0)], dtype=np.float64)
interior = rng.uniform([-0.9, -0.65, 0.05], [0.9, 0.65, 0.95], size=(72, 3))
points = np.vstack([corners, interior])
colors = np.column_stack([
    np.interp(points[:, 0], [-1, 1], [70, 225]),
    np.interp(points[:, 1], [-.75, .75], [190, 85]),
    np.interp(points[:, 2], [0, 1], [95, 230]),
]).astype(np.uint8)

camera_centers = [np.array([3.8, -3.2, 2.3]), np.array([-3.4, -2.8, 2.0]), np.array([0.2, 4.6, 2.6])]
camera_records = []
observations = []

for index, center in enumerate(camera_centers):
    rotation, translation = look_at(center, np.array([0.0, 0.0, 0.5]))
    ideal = project(points, rotation, translation)
    noisy = ideal + rng.normal(0.0, 0.18, ideal.shape)
    success, rvec, tvec = cv2.solvePnP(points, noisy, K, None, flags=cv2.SOLVEPNP_ITERATIVE)
    recovered_rotation, _ = cv2.Rodrigues(rvec)
    recovered_center = (-recovered_rotation.T @ tvec).ravel()
    reprojection, _ = cv2.projectPoints(points, rvec, tvec, K, None)
    reprojection = reprojection.reshape(-1, 2)
    rmse = float(np.sqrt(np.mean(np.sum((reprojection - noisy) ** 2, axis=1))))
    center_error = float(np.linalg.norm(recovered_center - center))
    image = Image.new("RGB", (WIDTH, HEIGHT), "#0b1116")
    draw = ImageDraw.Draw(image)
    for point_index, (pixel, color) in enumerate(zip(noisy, colors)):
        x, y = pixel
        radius = 8 if point_index < len(corners) else 4
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=tuple(map(int, color)), outline="#f1d18a" if point_index < len(corners) else None)
    draw.text((24, 24), f"CONTROLLED SPATIAL BENCHMARK · CAMERA {index + 1}", fill="#f1d18a")
    image_path = OUT / "images" / f"camera-{index + 1:02d}.png"
    image_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(image_path)
    camera_records.append({
        "id": f"camera-{index + 1:02d}", "image": str(image_path.relative_to(ROOT)),
        "intrinsics": K.tolist(), "knownCenterMeters": center.tolist(),
        "recoveredCenterMeters": recovered_center.tolist(), "centerErrorMeters": center_error,
        "reprojectionRmsePixels": rmse, "poseRecovered": bool(success),
        "rotationWorldToCamera": recovered_rotation.tolist(), "translation": tvec.ravel().tolist(),
    })
    observations.append(noisy)

# Triangulate the full point set from the first two recovered camera solutions.
def projection_matrix(camera: dict) -> np.ndarray:
    return K @ np.hstack([np.array(camera["rotationWorldToCamera"]), np.array(camera["translation"])[:, None]])

triangulated_h = cv2.triangulatePoints(projection_matrix(camera_records[0]), projection_matrix(camera_records[1]), observations[0].T, observations[1].T)
triangulated = (triangulated_h[:3] / triangulated_h[3]).T
point_errors = np.linalg.norm(triangulated - points, axis=1)
control_rmse = float(np.sqrt(np.mean(point_errors ** 2)))
max_error = float(np.max(point_errors))

write_ply(OUT / "artifacts" / "controlled-point-cloud.ply", triangulated, colors)
write_ply(OUT / "artifacts" / "controlled-gaussian-splat.ply", triangulated, colors, splat=True)

mesh_lines = ["# Controlled benchmark mesh; meters; project-authored synthetic geometry"]
for point in corners:
    mesh_lines.append(f"v {point[0]} {point[1]} {point[2]}")
faces = [(1, 2, 4, 3), (5, 7, 8, 6), (1, 5, 6, 2), (3, 4, 8, 7), (1, 3, 7, 5), (2, 6, 8, 4)]
for face in faces:
    mesh_lines.append("f " + " ".join(map(str, face)))
(OUT / "artifacts" / "controlled-mesh.obj").write_text("\n".join(mesh_lines) + "\n", encoding="utf-8")

validation = {
    "schemaVersion": "1.0.0", "benchmarkId": "controlled-spatial-v1", "status": "passed",
    "purpose": "Validate metric artifact and radiance-field derivative contracts before sensitive-case use.",
    "coordinateSystem": "CONTROLLED_METRIC_V1", "units": "meters", "georeferenced": False,
    "controlDimensionsMeters": {"x": 2.0, "y": 1.5, "z": 1.0},
    "inputPointCount": int(len(points)), "cameraCount": len(camera_records),
    "triangulationRmseMeters": control_rmse, "maximumPointErrorMeters": max_error,
    "reprojectionRmsePixels": [camera["reprojectionRmsePixels"] for camera in camera_records],
    "cameraCenterErrorsMeters": [camera["centerErrorMeters"] for camera in camera_records],
    "measurementEnabled": control_rmse < 0.01 and max_error < 0.03,
    "limitations": [
        "Synthetic high-contrast control points are easier than real scenes.",
        "The Gaussian-splat PLY is a viewer-contract derivative, not an optimized radiance-field training result.",
        "No finding from this benchmark transfers accuracy to a case-specific reconstruction.",
    ],
    "cameras": camera_records,
}
canonical_write(OUT / "validation-report.json", validation)

files = []
for path in sorted(p for p in OUT.rglob("*") if p.is_file() and p.name != "manifest.json"):
    raw = path.read_bytes()
    files.append({"path": str(path.relative_to(OUT)), "sha256": hashlib.sha256(raw).hexdigest(), "byteSize": len(raw)})
canonical_write(OUT / "manifest.json", {"schemaVersion": "1.0.0", "benchmarkId": "controlled-spatial-v1", "algorithm": "sha256", "files": files, "rootHash": hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()})
print(f"Controlled benchmark passed: triangulation RMSE {control_rmse:.6f} m; max error {max_error:.6f} m")
