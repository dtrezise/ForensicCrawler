import type { ReconstructionSceneData, SceneObject } from "../types";

export type SpatialTimeValue = number | string;

export interface SpatialTemporalRange {
  start?: SpatialTimeValue;
  end?: SpatialTimeValue;
  label?: string;
}

export type SpatialSemanticKind =
  | "camera"
  | "context"
  | "marker"
  | "path"
  | "structure"
  | "vehicle"
  | "vessel"
  | "zone";

export interface SpatialSceneObject extends SceneObject {
  /** Optional presentation interval. Values may be elapsed numbers or ISO timestamps. */
  temporal?: SpatialTemporalRange;
  /** Backward-compatible flat interval fields for fixture generators. */
  visibleFrom?: SpatialTimeValue;
  visibleUntil?: SpatialTimeValue;
  semantic?: SpatialSemanticKind;
  labelPriority?: number;
  labelAnchor?: [number, number, number];
}

export interface SpatialSceneData extends Omit<ReconstructionSceneData, "objects"> {
  objects: SpatialSceneObject[];
  temporal?: {
    current?: SpatialTimeValue;
    range?: SpatialTemporalRange;
    label?: string;
  };
}

export interface SpatialTemporalFilter {
  cursor?: SpatialTimeValue;
  start?: SpatialTimeValue;
  end?: SpatialTimeValue;
}

export interface SpatialExportMetadata {
  sceneTitle: string;
  coordinateSystem: string;
  georeferenced: boolean;
  northAligned: boolean;
  units: string;
  schematic: true;
  visibleObjectIds: string[];
}

export interface SpatialExportHandle {
  canvas: HTMLCanvasElement;
  metadata: () => SpatialExportMetadata;
  render: () => void;
  toDataUrl: (type?: "image/png" | "image/jpeg", quality?: number) => string;
}
