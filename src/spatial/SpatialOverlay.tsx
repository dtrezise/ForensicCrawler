import { forwardRef, useImperativeHandle, useRef } from "react";
import type { SceneLayer } from "../types";
import { semanticGlyph } from "./model";
import type { ProjectedLabelPlacement } from "./layout";
import type { SpatialSceneObject } from "./types";

export interface SpatialOverlayHandle {
  updateLabels: (placements: ProjectedLabelPlacement[]) => void;
}

interface SpatialOverlayProps {
  objects: SpatialSceneObject[];
  layers: SceneLayer[];
  selectedObjectId: string | null;
  georeferenced: boolean;
  northAligned: boolean;
  scaleLabel: string;
  temporalLabel?: string;
  onSelect: (objectId: string) => void;
}

const mono = '"DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const panel = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 3,
  background: "rgba(8,13,17,.88)",
  color: "#aebbc2",
  fontFamily: mono,
  fontSize: 8,
  letterSpacing: ".035em",
  backdropFilter: "blur(8px)",
} as const;

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

export const SpatialOverlay = forwardRef<SpatialOverlayHandle, SpatialOverlayProps>(function SpatialOverlay({
  objects,
  layers,
  selectedObjectId,
  georeferenced,
  northAligned,
  scaleLabel,
  temporalLabel,
  onSelect,
}, ref) {
  const labelRefs = useRef(new Map<string, HTMLButtonElement>());
  const lineRefs = useRef(new Map<string, SVGLineElement>());

  useImperativeHandle(ref, () => ({
    updateLabels(placements) {
      const visible = new Set(placements.map(({ id }) => id));
      for (const [id, element] of labelRefs.current) element.style.display = visible.has(id) ? "flex" : "none";
      for (const [id, element] of lineRefs.current) element.style.display = visible.has(id) ? "block" : "none";
      for (const placement of placements) {
        const label = labelRefs.current.get(placement.id);
        const line = lineRefs.current.get(placement.id);
        if (label) {
          label.style.transform = `translate3d(${placement.labelX}px, ${placement.labelY}px, 0) translateY(-50%)`;
          label.dataset.selected = String(placement.selected);
        }
        if (line) {
          line.setAttribute("x1", String(placement.anchorX));
          line.setAttribute("y1", String(placement.anchorY));
          line.setAttribute("x2", String(placement.leaderX));
          line.setAttribute("y2", String(placement.leaderY));
        }
      }
    },
  }), []);

  const layerById = new Map(layers.map((layer) => [layer.id, layer]));

  return (
    <div data-spatial-overlay="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
      <svg aria-hidden="true" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {objects.map((object) => <line
          key={object.id}
          ref={(node) => { if (node) lineRefs.current.set(object.id, node); else lineRefs.current.delete(object.id); }}
          stroke={layerById.get(object.layer)?.color ?? "#9eabb2"}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity=".72"
          style={{ display: "none" }}
        />)}
      </svg>

      <div aria-hidden="true">
        {objects.map((object) => {
          const layer = layerById.get(object.layer);
          return <button
            key={object.id}
            type="button"
            tabIndex={-1}
            ref={(node) => { if (node) labelRefs.current.set(object.id, node); else labelRefs.current.delete(object.id); }}
            onClick={() => onSelect(object.id)}
            style={{
              ...panel,
              position: "absolute",
              top: 0,
              left: 0,
              display: "none",
              alignItems: "center",
              gap: 6,
              width: "min(190px, 25vw)",
              minHeight: 24,
              padding: "4px 7px",
              borderColor: selectedObjectId === object.id ? "#e6c779" : `${layer?.color ?? "#9eabb2"}88`,
              color: selectedObjectId === object.id ? "#f3df9b" : "#c2ccd1",
              boxShadow: selectedObjectId === object.id ? "0 0 0 1px rgba(230,199,121,.35), 0 5px 18px rgba(0,0,0,.34)" : "none",
              textAlign: "left",
              lineHeight: 1.35,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          ><span style={{ color: layer?.color ?? "#9eabb2", fontSize: 11 }}>{semanticGlyph(object.semantic ?? "marker")}</span><span>{object.label}</span></button>;
        })}
      </div>

      <aside aria-label="Scene legend" style={{ ...panel, position: "absolute", left: 12, bottom: 12, width: 205, padding: "8px 9px" }}>
        <strong style={{ display: "block", marginBottom: 6, color: "#d4dde1", fontSize: 8 }}>EVIDENCE LAYERS</strong>
        <ul style={{ display: "grid", gap: 5, margin: 0, padding: 0, listStyle: "none" }}>
          {layers.map((layer) => <li key={layer.id} style={{ display: "grid", gridTemplateColumns: "8px 1fr", gap: 6, alignItems: "center" }}>
            <i aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: layer.color }} />
            <span>{layer.label} · {layer.class}</span>
          </li>)}
        </ul>
      </aside>

      <div aria-label="Scene calibration status" style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
        <span style={{ ...panel, padding: "5px 7px", color: georeferenced ? "#86c3a2" : "#d4a474" }}>GEOREF · {georeferenced ? "PRESENT" : "NONE"}</span>
        <span style={{ ...panel, padding: "5px 7px", color: "#d4a474" }}>{scaleLabel}</span>
        {temporalLabel && <span style={{ ...panel, padding: "5px 7px", color: "#87abc0" }}>TIME · {temporalLabel}</span>}
      </div>

      <div aria-label={northAligned ? "North compass" : "Local scene axes, not north-aligned"} style={{ ...panel, position: "absolute", right: 12, top: 94, width: 58, height: 58, display: "grid", placeItems: "center" }}>
        <svg aria-hidden="true" viewBox="0 0 58 58" width="54" height="54">
          <circle cx="29" cy="29" r="20" fill="none" stroke="#465660" strokeWidth="1" />
          <path d="M29 8 L33 29 L29 26 L25 29 Z" fill="#e6c779" />
          <line x1="29" y1="29" x2="46" y2="29" stroke="#70b6cf" />
          <line x1="29" y1="29" x2="18" y2="42" stroke="#75c99b" />
          <text x="29" y="7" textAnchor="middle" fill="#d9e1e5" fontSize="7">{northAligned ? "N" : "Y"}</text>
          <text x="49" y="32" textAnchor="middle" fill="#70b6cf" fontSize="7">X</text>
          <text x="15" y="47" textAnchor="middle" fill="#75c99b" fontSize="7">Z</text>
        </svg>
      </div>

      <section aria-label="Accessible scene object list" style={visuallyHidden}>
        <p id="spatial-scene-description">Interactive schematic scene. Objects are source-attributed or illustrative and do not establish metric, geospatial, trajectory, identity, or legal conclusions.</p>
        <ul>
          {objects.map((object) => <li key={object.id}>
            <button type="button" aria-pressed={selectedObjectId === object.id} onClick={() => onSelect(object.id)}>
              {object.label}; {layerById.get(object.layer)?.label ?? object.layer}
            </button>
          </li>)}
        </ul>
        <p aria-live="polite">{selectedObjectId ? `Selected object: ${objects.find(({ id }) => id === selectedObjectId)?.label ?? selectedObjectId}` : "No scene object selected"}</p>
      </section>
    </div>
  );
});
