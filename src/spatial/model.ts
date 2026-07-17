import type { ReconstructionSceneData } from "../types";
import type {
  SpatialSceneData,
  SpatialSceneObject,
  SpatialSemanticKind,
  SpatialTemporalFilter,
  SpatialTimeValue,
} from "./types";

function normalizedTime(value: SpatialTimeValue | undefined) {
  if (value === undefined) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const numeric = Number(value);
  if (value.trim() !== "" && Number.isFinite(numeric)) return numeric;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function objectInterval(object: SpatialSceneObject) {
  return {
    start: normalizedTime(object.temporal?.start ?? object.visibleFrom),
    end: normalizedTime(object.temporal?.end ?? object.visibleUntil),
  };
}

export function isObjectVisibleAt(object: SpatialSceneObject, filter?: SpatialTemporalFilter) {
  if (!filter) return true;
  const interval = objectInterval(object);
  if (interval.start === undefined && interval.end === undefined) return true;

  const cursor = normalizedTime(filter.cursor);
  if (cursor !== undefined) {
    return (interval.start === undefined || interval.start <= cursor)
      && (interval.end === undefined || interval.end >= cursor);
  }

  const filterStart = normalizedTime(filter.start);
  const filterEnd = normalizedTime(filter.end);
  if (filterStart === undefined && filterEnd === undefined) return true;
  return (filterEnd === undefined || interval.start === undefined || interval.start <= filterEnd)
    && (filterStart === undefined || interval.end === undefined || interval.end >= filterStart);
}

export function asSpatialScene(data: ReconstructionSceneData): SpatialSceneData {
  return data as SpatialSceneData;
}

export function resolveTemporalFilter(data: SpatialSceneData, filter?: SpatialTemporalFilter): SpatialTemporalFilter | undefined {
  if (filter) return filter;
  if (data.temporal?.current !== undefined) return { cursor: data.temporal.current };
  if (data.temporal?.range) return {
    start: data.temporal.range.start,
    end: data.temporal.range.end,
  };
  return undefined;
}

export function inferSemanticKind(object: SpatialSceneObject): SpatialSemanticKind {
  if (object.semantic) return object.semantic;
  const text = `${object.id} ${object.label}`.toLowerCase();
  if (text.includes("vessel") || text.includes("boat") || text.includes("ship")) return "vessel";
  if (text.includes("vehicle") || text.includes("suv") || text.includes(" car ")) return "vehicle";
  if (text.includes("camera") || text.includes("phone source")) return "camera";
  if (object.type === "canopy") return "structure";
  if (object.type === "box" && /(building|hall|roof|street|avenue|ground)/.test(text)) return "structure";
  if (object.type === "path" || object.type === "line") return "path";
  if (object.type === "disc" || object.type === "ring" || object.type === "arc-sectors") return "zone";
  if (object.type === "plane" || object.type === "box") return "context";
  return "marker";
}

export function semanticGlyph(kind: SpatialSemanticKind) {
  const glyphs: Record<SpatialSemanticKind, string> = {
    camera: "⌾",
    context: "◇",
    marker: "●",
    path: "↝",
    structure: "▱",
    vehicle: "▰",
    vessel: "◒",
    zone: "◎",
  };
  return glyphs[kind];
}

export function shouldProjectLabel(object: SpatialSceneObject) {
  if (object.labelPriority !== undefined) return object.labelPriority >= 0;
  const semantic = inferSemanticKind(object);
  if (object.id === "ground" || object.id === "sea-cell") return false;
  return semantic !== "context" || object.type !== "plane";
}

export function scaleBadge(data: SpatialSceneData) {
  const units = data.coordinateSystem.units.toLowerCase();
  const metricReady = data.calibration.metricScale === true || data.calibration.metricPhotogrammetry === true;
  if (units.includes("arbitrary") || units.includes("unitless")) return "SCALE · UNRESOLVED";
  if (!metricReady) return "SCALE · ILLUSTRATIVE";
  return `SCALE · ${data.coordinateSystem.units.toUpperCase()}`;
}
