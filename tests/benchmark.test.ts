import { describe, expect, it } from "vitest";
import validation from "../fixtures/benchmarks/controlled-spatial-v1/validation-report.json";
import readiness from "../fixtures/benchmarks/controlled-spatial-v1/colmap-readiness.json";
import pointCloud from "../fixtures/benchmarks/controlled-spatial-v1/artifacts/controlled-point-cloud.ply?raw";
import mesh from "../fixtures/benchmarks/controlled-spatial-v1/artifacts/controlled-mesh.obj?raw";
import splat from "../fixtures/benchmarks/controlled-spatial-v1/artifacts/controlled-gaussian-splat.ply?raw";

describe("controlled spatial benchmark", () => {
  it("publishes a passed metric validation report with conservative limits", () => {
    expect(validation.status).toBe("passed");
    expect(validation.coordinateSystem).toBe("CONTROLLED_METRIC_V1");
    expect(validation.triangulationRmseMeters).toBeLessThan(0.01);
    expect(validation.maximumPointErrorMeters).toBeLessThan(0.03);
    expect(validation.measurementEnabled).toBe(true);
    expect(validation.limitations.join(" ")).toMatch(/transfers accuracy to a case-specific reconstruction/i);
  });

  it("keeps metric geometry and Gaussian visualization as separate artifacts", () => {
    expect(pointCloud).toContain("element vertex 80");
    expect(mesh).toContain("Controlled benchmark mesh");
    expect(splat).toContain("property float scale_0");
    expect(splat).toContain("property float opacity");
  });

  it("records COLMAP readiness without attempting a network install", () => {
    expect(readiness.colmap.networkInstallAttempted).toBe(false);
    expect(readiness.fallbackValidation.status).toBe("passed");
  });
});
