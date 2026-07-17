import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { layoutProjectedLabels } from "../src/spatial/layout";
import { inferSemanticKind, isObjectVisibleAt, scaleBadge } from "../src/spatial/model";
import { SpatialOverlay, type SpatialOverlayHandle } from "../src/spatial/SpatialOverlay";
import type { SpatialSceneData, SpatialSceneObject } from "../src/spatial/types";

const marker: SpatialSceneObject = {
  id: "camera-a",
  label: "Witness camera family A",
  layer: "observed",
  type: "marker",
  center: [1, 2, 3],
};

const scene: SpatialSceneData = {
  schema: "scene-v1",
  title: "Schematic test scene",
  status: "working",
  coordinateSystem: {
    id: "EVENT_LOCAL_V1",
    units: "arbitrary",
    georeferenced: false,
    northAligned: false,
    origin: "display origin",
  },
  calibration: { metricScale: false },
  layers: [{ id: "observed", label: "Observed anchors", class: "OBSERVED_SOURCE_STATED", color: "#70b6cf" }],
  objects: [marker],
  cameraPresets: [{ id: "overview", label: "Overview", position: [10, 10, 10], target: [0, 0, 0] }],
  limitations: ["Schematic only"],
};

describe("spatial presentation model", () => {
  it("filters optional elapsed and ISO temporal ranges without hiding timeless objects", () => {
    const elapsed: SpatialSceneObject = { ...marker, temporal: { start: 10, end: 20 } };
    expect(isObjectVisibleAt(elapsed, { cursor: 15 })).toBe(true);
    expect(isObjectVisibleAt(elapsed, { cursor: 25 })).toBe(false);
    expect(isObjectVisibleAt(elapsed, { start: 18, end: 30 })).toBe(true);

    const dated: SpatialSceneObject = {
      ...marker,
      visibleFrom: "2026-07-17T12:00:00Z",
      visibleUntil: "2026-07-17T12:01:00Z",
    };
    expect(isObjectVisibleAt(dated, { cursor: "2026-07-17T12:00:30Z" })).toBe(true);
    expect(isObjectVisibleAt(marker, { cursor: 999 })).toBe(true);
  });

  it("derives conservative semantics and calibration badges", () => {
    expect(inferSemanticKind(marker)).toBe("camera");
    expect(inferSemanticKind({ ...marker, id: "vessel", label: "Generic vessel", type: "box" })).toBe("vessel");
    expect(scaleBadge(scene)).toBe("SCALE · UNRESOLVED");
    expect(scaleBadge({ ...scene, coordinateSystem: { ...scene.coordinateSystem, units: "display meters" } })).toBe("SCALE · ILLUSTRATIVE");
  });

  it("prioritizes selection and separates nearby projected labels", () => {
    const placements = layoutProjectedLabels([
      { id: "ordinary", anchorX: 100, anchorY: 100, priority: 10, selected: false },
      { id: "selected", anchorX: 102, anchorY: 101, priority: 1, selected: true },
      { id: "priority", anchorX: 104, anchorY: 102, priority: 20, selected: false },
    ], 800, 500);
    expect(placements[0]?.id).toBe("selected");
    expect(new Set(placements.map(({ labelY }) => labelY)).size).toBe(placements.length);
  });
});

describe("accessible spatial overlay", () => {
  it("exposes evidence semantics, non-georeference status, local axes, and keyboard selection", () => {
    const onSelect = vi.fn();
    render(<SpatialOverlay
      objects={[{ ...marker, semantic: "camera" }]}
      layers={scene.layers}
      selectedObjectId={null}
      georeferenced={false}
      northAligned={false}
      scaleLabel="SCALE · UNRESOLVED"
      onSelect={onSelect}
    />);

    expect(screen.getByRole("complementary", { name: "Scene legend" })).toHaveTextContent("Observed anchors · OBSERVED_SOURCE_STATED");
    expect(screen.getByLabelText("Scene calibration status")).toHaveTextContent("GEOREF · NONE");
    expect(screen.getByLabelText("Local scene axes, not north-aligned")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Witness camera family A; Observed anchors/ }));
    expect(onSelect).toHaveBeenCalledWith("camera-a");
  });

  it("accepts deterministic projected label updates for export rendering", () => {
    const ref = createRef<SpatialOverlayHandle>();
    const { container } = render(<SpatialOverlay
      ref={ref}
      objects={[{ ...marker, semantic: "camera" }]}
      layers={scene.layers}
      selectedObjectId="camera-a"
      georeferenced={false}
      northAligned={false}
      scaleLabel="SCALE · UNRESOLVED"
      temporalLabel="T+00:30"
      onSelect={() => undefined}
    />);
    act(() => ref.current?.updateLabels([{
      id: "camera-a",
      anchorX: 100,
      anchorY: 90,
      labelX: 128,
      labelY: 90,
      leaderX: 128,
      leaderY: 90,
      priority: 1000,
      selected: true,
    }]));

    const visualLabel = container.querySelector<HTMLButtonElement>('button[tabindex="-1"]');
    expect(visualLabel?.style.display).toBe("flex");
    expect(visualLabel?.dataset.selected).toBe("true");
    expect(screen.getByLabelText("Scene calibration status")).toHaveTextContent("TIME · T+00:30");
  });
});
