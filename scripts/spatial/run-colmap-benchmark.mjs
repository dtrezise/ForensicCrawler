import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, readJson, writeJson } from "../lib.mjs";

const benchmark = "fixtures/benchmarks/controlled-spatial-v1";
const validationPath = resolve(ROOT, benchmark, "validation-report.json");
if (!existsSync(validationPath)) execFileSync("python3", [resolve(ROOT, "scripts/spatial/generate_controlled_benchmark.py")], { stdio: "inherit" });

const availability = spawnSync("colmap", ["--help"], { encoding: "utf8" });
const validation = readJson(`${benchmark}/validation-report.json`);
const status = {
  schemaVersion: "1.0.0",
  benchmarkId: "controlled-spatial-v1",
  generatedAt: new Date().toISOString(),
  colmap: {
    available: availability.status === 0,
    executionState: availability.status === 0 ? "ready_for_image_based_run" : "not_installed_local_environment",
    networkInstallAttempted: false,
    commandTemplate: "colmap automatic_reconstructor --workspace_path <workspace> --image_path <workspace>/images --data_type INDIVIDUAL --quality HIGH",
  },
  fallbackValidation: {
    engine: "opencv_solvepnp_and_triangulation",
    status: validation.status,
    triangulationRmseMeters: validation.triangulationRmseMeters,
    measurementEnabled: validation.measurementEnabled,
  },
  rule: "COLMAP output may supplement but cannot replace case-specific scale control, residual reporting, and independent validation.",
};
writeJson(`${benchmark}/colmap-readiness.json`, status);
console.log(status.colmap.available ? "COLMAP is available for a controlled image run." : "COLMAP is not installed; recorded the validated OpenCV fallback without attempting a network install.");
