import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ReconstructionSceneData, SceneObject } from "./types";
import { layoutProjectedLabels } from "./spatial/layout";
import {
  asSpatialScene,
  inferSemanticKind,
  isObjectVisibleAt,
  resolveTemporalFilter,
  scaleBadge,
  shouldProjectLabel,
} from "./spatial/model";
import { SpatialOverlay, type SpatialOverlayHandle } from "./spatial/SpatialOverlay";
import type {
  SpatialExportHandle,
  SpatialSceneObject,
  SpatialTemporalFilter,
} from "./spatial/types";

interface ReconstructionSceneProps {
  data: ReconstructionSceneData;
  visibleLayers: Record<string, boolean>;
  presetId: string;
  selectedObjectId: string | null;
  onSelect: (objectId: string) => void;
  /** Optional elapsed-time or ISO-time filter. Existing callers may omit it. */
  temporalFilter?: SpatialTemporalFilter;
  /** Receives a local, non-publishing render/capture contract when WebGL is ready. */
  onExportReady?: (handle: SpatialExportHandle) => void;
}

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  groups: Map<string, THREE.Group>;
  objects: Map<string, THREE.Group>;
  selectionHelper: THREE.BoxHelper;
}

function point([x, y, z]: [number, number, number]) {
  return new THREE.Vector3(x, z, -y);
}

function material(color: string, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    roughness: 0.76,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
}

function tagObject(root: THREE.Object3D, object: SceneObject) {
  root.userData.objectId = object.id;
  root.userData.layerId = object.layer;
  root.traverse((child) => {
    child.userData.objectId = object.id;
    child.userData.layerId = object.layer;
  });
}

function addVehicleSilhouette(group: THREE.Group, object: SpatialSceneObject, color: string) {
  if (!object.center || object.size?.length !== 3) return;
  const [width, depth, height] = object.size;
  const base = point(object.center);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.82, Math.max(height * 0.48, 0.35), depth * 0.48),
    material(color, 0.94),
  );
  cabin.position.set(base.x, base.y + height * 0.5, base.z - depth * 0.02);
  group.add(cabin);
  for (const x of [-width * 0.46, width * 0.46]) {
    for (const z of [-depth * 0.3, depth * 0.3]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.12, height * 0.18), Math.max(0.12, height * 0.18), 0.12, 12), material("#111820"));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(base.x + x, base.y - height * 0.36, base.z + z);
      group.add(wheel);
    }
  }
}

function addVesselSilhouette(group: THREE.Group, object: SpatialSceneObject, color: string) {
  if (!object.center || object.size?.length !== 3) return;
  const [width, depth, height] = object.size;
  const base = point(object.center);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, Math.max(0.16, height * 0.16), depth * 0.72), material(color, 0.9));
  deck.position.set(base.x, base.y + height * 0.48, base.z);
  group.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.46, Math.max(0.25, height * 0.42), depth * 0.26), material("#b8c6cd", 0.74));
  cabin.position.set(base.x, base.y + height * 0.78, base.z + depth * 0.12);
  group.add(cabin);
}

function addCameraIcon(group: THREE.Group, base: THREE.Vector3, color: string) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 1.7), material(color));
  body.position.copy(base);
  group.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.72, 0.8, 16), material("#a8bbc4", 0.8));
  lens.rotation.z = Math.PI / 2;
  lens.position.set(base.x + 1.7, base.y, base.z);
  group.add(lens);
  const field = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.ConeGeometry(2.5, 5.5, 4, 1, true)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 }),
  );
  field.rotation.z = -Math.PI / 2;
  field.position.set(base.x + 4.5, base.y, base.z);
  group.add(field);
}

function buildObject(object: SpatialSceneObject, color: string) {
  const group = new THREE.Group();
  group.name = object.label;
  group.userData.semantic = inferSemanticKind(object);

  if (object.type === "plane" && object.center && object.size?.length === 2) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(object.size[0], object.size[1]), material(color, 0.92));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(point(object.center));
    group.add(mesh);
  }

  if (object.type === "box" && object.center && object.size?.length === 3) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(object.size[0], object.size[2], object.size[1]), material(color, object.layer === "context" ? 0.88 : 1));
    mesh.position.copy(point(object.center));
    group.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: "#71808c", transparent: true, opacity: 0.52 }));
    edges.position.copy(mesh.position);
    group.add(edges);
    const semantic = inferSemanticKind(object);
    if (semantic === "vehicle") addVehicleSilhouette(group, object, color);
    if (semantic === "vessel") addVesselSilhouette(group, object, color);
  }

  if (object.type === "disc" && object.center && typeof object.radius === "number") {
    const radius = object.radius;
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), material(color, 0.3));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(point(object.center));
    group.add(mesh);
    const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 65 }, (_, index) => {
        const angle = (index / 64) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius);
      }),
    ), new THREE.LineBasicMaterial({ color }));
    outline.position.copy(point(object.center));
    group.add(outline);
  }

  if (object.type === "ring" && object.center && typeof object.radius === "number") {
    const halfWidth = (object.width ?? 1) / 2;
    const mesh = new THREE.Mesh(new THREE.RingGeometry(object.radius - halfWidth, object.radius + halfWidth, 128), material(color, 0.75));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(point(object.center));
    group.add(mesh);
  }

  if (object.type === "canopy" && object.center && object.size?.length === 3) {
    const [width, depth, height] = object.size;
    const base = point(object.center);
    const poleMaterial = material("#d5dae0", 0.8);
    for (const x of [-width / 2, width / 2]) {
      for (const z of [-depth / 2, depth / 2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, height, 10), poleMaterial);
        pole.position.set(base.x + x, base.y + height / 2, base.z + z);
        group.add(pole);
      }
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.72, 0.85, 4), material(color, 0.92));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(base.x, base.y + height + 0.4, base.z);
    group.add(roof);
  }

  if (object.type === "arc-sectors" && object.center && Array.isArray(object.radius) && object.sectors) {
    const [innerRadius, outerRadius] = object.radius;
    object.sectors.forEach(([start, end]) => {
      const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 48, 1, THREE.MathUtils.degToRad(start), THREE.MathUtils.degToRad(end - start));
      const mesh = new THREE.Mesh(geometry, material(color, 0.18));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(point(object.center!));
      group.add(mesh);
    });
  }

  if (object.type === "marker" && object.center) {
    const base = point(object.center);
    if (inferSemanticKind(object) === "camera") {
      addCameraIcon(group, base, color);
    } else {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(2.1, 24, 24), material(color));
      sphere.position.copy(base);
      group.add(sphere);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 10), material(color, 0.84));
      stem.position.set(base.x, base.y - 2.2, base.z);
      group.add(stem);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.24, 12, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 }));
      halo.rotation.x = Math.PI / 2;
      halo.position.copy(base);
      group.add(halo);
    }
  }

  if ((object.type === "line" || object.type === "path") && object.points) {
    const geometry = new THREE.BufferGeometry().setFromPoints(object.points.map(point));
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
    group.add(line);
    if (object.type === "path") {
      object.points.forEach((item) => {
        const marker = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 14), material(color));
        marker.position.copy(point(item));
        group.add(marker);
      });
    }
  }

  tagObject(group, object);
  return group;
}

function temporalLabel(filter: SpatialTemporalFilter | undefined, fixtureLabel: string | undefined) {
  if (fixtureLabel) return fixtureLabel;
  if (!filter) return undefined;
  if (filter.cursor !== undefined) return String(filter.cursor);
  if (filter.start !== undefined || filter.end !== undefined) return `${filter.start ?? "…"} – ${filter.end ?? "…"}`;
  return undefined;
}

export function ReconstructionScene({
  data,
  visibleLayers,
  presetId,
  selectedObjectId,
  onSelect,
  temporalFilter,
  onExportReady,
}: ReconstructionSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SpatialOverlayHandle>(null);
  const onSelectRef = useRef(onSelect);
  const onExportReadyRef = useRef(onExportReady);
  const stateRef = useRef<SceneState | null>(null);
  const selectedObjectIdRef = useRef(selectedObjectId);
  const visibleObjectIdsRef = useRef<string[]>([]);
  const spatialData = asSpatialScene(data);
  const resolvedTemporalFilter = resolveTemporalFilter(spatialData, temporalFilter);
  const objects = useMemo(() => spatialData.objects.map((object) => ({
    ...object,
    semantic: inferSemanticKind(object),
  })), [spatialData]);
  const overlayObjects = objects.filter((object) => (visibleLayers[object.layer] ?? true) && isObjectVisibleAt(object, resolvedTemporalFilter) && shouldProjectLabel(object));

  onSelectRef.current = onSelect;
  onExportReadyRef.current = onExportReady;
  selectedObjectIdRef.current = selectedObjectId;
  visibleObjectIdsRef.current = objects
    .filter((object) => (visibleLayers[object.layer] ?? true) && isObjectVisibleAt(object, resolvedTemporalFilter))
    .map(({ id }) => id);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement = canvas;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a1015");
    scene.fog = new THREE.FogExp2("#0a1015", 0.0022);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1600);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const controls = new OrbitControls(camera, canvasElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 18;
    controls.maxDistance = 620;

    scene.add(new THREE.HemisphereLight("#dbe8f0", "#17232d", 2.1));
    const keyLight = new THREE.DirectionalLight("#fff3d0", 2.3);
    keyLight.position.set(90, 170, 40);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const grid = new THREE.GridHelper(430, 43, "#34434f", "#1b2933");
    grid.position.y = 0.02;
    scene.add(grid);

    const layerColors = new Map(spatialData.layers.map((layer) => [layer.id, layer.color]));
    const groups = new Map<string, THREE.Group>();
    spatialData.layers.forEach((layer) => {
      const group = new THREE.Group();
      group.name = layer.label;
      groups.set(layer.id, group);
      scene.add(group);
    });

    const objectGroups = new Map<string, THREE.Group>();
    objects.forEach((object) => {
      const group = buildObject(object, layerColors.get(object.layer) ?? "#ffffff");
      objectGroups.set(object.id, group);
      groups.get(object.layer)?.add(group);
    });

    const selectionHelper = new THREE.BoxHelper(new THREE.Object3D(), "#f0d37f");
    selectionHelper.material.transparent = true;
    selectionHelper.material.opacity = 0.94;
    selectionHelper.visible = false;
    selectionHelper.renderOrder = 20;
    scene.add(selectionHelper);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { x: number; y: number } | null = null;
    function selectAt(event: PointerEvent) {
      const bounds = canvasElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const visible = [...objectGroups.entries()].flatMap(([id, group]) => {
        const object = objects.find((candidate) => candidate.id === id);
        const layerVisible = object ? groups.get(object.layer)?.visible !== false : true;
        return group.visible && layerVisible ? group.children : [];
      });
      const hit = raycaster.intersectObjects(visible, true).find((candidate) => candidate.object.userData.objectId);
      if (hit) onSelectRef.current(hit.object.userData.objectId as string);
    }
    function handlePointerDown(event: PointerEvent) {
      pointerStart = { x: event.clientX, y: event.clientY };
    }
    function handlePointerUp(event: PointerEvent) {
      if (!pointerStart) return;
      const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      pointerStart = null;
      if (distance <= 5) selectAt(event);
    }
    canvasElement.addEventListener("pointerdown", handlePointerDown);
    canvasElement.addEventListener("pointerup", handlePointerUp);

    function resize() {
      const width = Math.max(1, canvasElement.clientWidth);
      const height = Math.max(1, canvasElement.clientHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const renderWidth = Math.floor(width * ratio);
      const renderHeight = Math.floor(height * ratio);
      if (canvasElement.width !== renderWidth || canvasElement.height !== renderHeight) {
        renderer.setSize(renderWidth, renderHeight, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvasElement);

    const bounds = new THREE.Box3();
    const anchor = new THREE.Vector3();
    function updateOverlay() {
      const width = Math.max(1, canvasElement.clientWidth);
      const height = Math.max(1, canvasElement.clientHeight);
      const candidates = objects.flatMap((object) => {
        const group = objectGroups.get(object.id);
        if (!group?.visible || groups.get(object.layer)?.visible === false || !shouldProjectLabel(object)) return [];
        if (object.labelAnchor) anchor.copy(point(object.labelAnchor));
        else {
          bounds.setFromObject(group);
          if (bounds.isEmpty()) return [];
          bounds.getCenter(anchor);
        }
        const projected = anchor.clone().project(camera);
        if (projected.z < -1 || projected.z > 1) return [];
        return [{
          id: object.id,
          anchorX: (projected.x * 0.5 + 0.5) * width,
          anchorY: (-projected.y * 0.5 + 0.5) * height,
          priority: object.labelPriority ?? (object.id === selectedObjectIdRef.current ? 1000 : object.type === "marker" ? 80 : 40),
          selected: object.id === selectedObjectIdRef.current,
        }];
      });
      overlayRef.current?.updateLabels(layoutProjectedLabels(candidates, width, height));
    }

    let frame = 0;
    function render() {
      resize();
      controls.update();
      renderer.render(scene, camera);
      updateOverlay();
      frame = window.requestAnimationFrame(render);
    }

    stateRef.current = { scene, camera, controls, renderer, groups, objects: objectGroups, selectionHelper };
    const initial = spatialData.cameraPresets.find((preset) => preset.id === presetId) ?? spatialData.cameraPresets[0];
    if (initial) {
      camera.position.copy(point(initial.position));
      controls.target.copy(point(initial.target));
      controls.update();
    }

    const exportHandle: SpatialExportHandle = {
      canvas: canvasElement,
      metadata: () => ({
        sceneTitle: spatialData.title,
        coordinateSystem: spatialData.coordinateSystem.id,
        georeferenced: spatialData.coordinateSystem.georeferenced,
        northAligned: spatialData.coordinateSystem.northAligned,
        units: spatialData.coordinateSystem.units,
        schematic: true,
        visibleObjectIds: [...visibleObjectIdsRef.current],
      }),
      render: () => renderer.render(scene, camera),
      toDataUrl: (type = "image/png", quality) => {
        renderer.render(scene, camera);
        return canvasElement.toDataURL(type, quality);
      },
    };
    onExportReadyRef.current?.(exportHandle);
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      canvasElement.removeEventListener("pointerdown", handlePointerDown);
      canvasElement.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.LineSegments) {
          child.geometry?.dispose();
          const childMaterial = child.material;
          if (Array.isArray(childMaterial)) childMaterial.forEach((item) => item.dispose());
          else childMaterial?.dispose();
        }
      });
      renderer.dispose();
      stateRef.current = null;
    };
  }, [objects, spatialData]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    for (const [layerId, group] of state.groups) group.visible = visibleLayers[layerId] ?? true;
    for (const object of objects) {
      const group = state.objects.get(object.id);
      if (group) group.visible = isObjectVisibleAt(object, resolvedTemporalFilter);
    }
    const selected = selectedObjectIdRef.current ? state.objects.get(selectedObjectIdRef.current) : undefined;
    state.selectionHelper.visible = Boolean(selected?.visible && selected && state.groups.get(selected.userData.layerId as string)?.visible !== false);
  }, [objects, resolvedTemporalFilter, visibleLayers]);

  useEffect(() => {
    const state = stateRef.current;
    const preset = spatialData.cameraPresets.find((candidate) => candidate.id === presetId);
    if (!state || !preset) return;
    state.camera.position.copy(point(preset.position));
    state.controls.target.copy(point(preset.target));
    state.controls.update();
  }, [presetId, spatialData]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    for (const [objectId, group] of state.objects) {
      const selected = objectId === selectedObjectId;
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const meshMaterial = child.material;
        if (Array.isArray(meshMaterial) || !(meshMaterial instanceof THREE.MeshStandardMaterial)) return;
        meshMaterial.emissive.set(selected ? "#c9a552" : "#000000");
        meshMaterial.emissiveIntensity = selected ? 0.72 : 0;
      });
    }
    const group = selectedObjectId ? state.objects.get(selectedObjectId) : undefined;
    if (group?.visible) {
      state.selectionHelper.setFromObject(group);
      state.selectionHelper.visible = state.groups.get(group.userData.layerId as string)?.visible !== false;
    } else {
      state.selectionHelper.visible = false;
    }
  }, [selectedObjectId]);

  const timeLabel = temporalLabel(resolvedTemporalFilter, spatialData.temporal?.label);
  return (
    <div
      data-export-region="spatial-reconstruction"
      data-export-ready="webgl-local"
      data-georeferenced={String(spatialData.coordinateSystem.georeferenced)}
      data-north-aligned={String(spatialData.coordinateSystem.northAligned)}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      <canvas
        ref={canvasRef}
        className="reconstruction-canvas"
        aria-label="Interactive schematic 3D reconstruction. Drag to orbit, scroll to zoom, and select a scene object to inspect it."
        aria-describedby="spatial-scene-description"
      />
      <SpatialOverlay
        ref={overlayRef}
        objects={overlayObjects}
        layers={spatialData.layers}
        selectedObjectId={selectedObjectId}
        georeferenced={spatialData.coordinateSystem.georeferenced}
        northAligned={spatialData.coordinateSystem.northAligned}
        scaleLabel={scaleBadge(spatialData)}
        temporalLabel={timeLabel}
        onSelect={onSelect}
      />
    </div>
  );
}
