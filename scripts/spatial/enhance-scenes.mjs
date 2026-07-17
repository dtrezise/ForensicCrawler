import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { readJson, writeJson, sha256, ROOT } from "../lib.mjs";

const inputs = [
  "fixtures/pilots/charlie-kirk-assassination/local/reconstruction-scene.json",
  "fixtures/pilots/renee-good-killing/local/reconstruction-scene.json",
  "fixtures/pilots/southern-spear-vessel-strikes/local/reconstruction-scene.json",
];

function semantic(object) {
  const text = `${object.id} ${object.label}`.toLowerCase();
  if (/vessel|boat|ship/.test(text)) return "vessel";
  if (/vehicle|suv|car\b/.test(text)) return "vehicle";
  if (/camera|phone|video|source/.test(text)) return "camera";
  if (/building|hall|roof|street|avenue|canopy|structure/.test(text)) return "structure";
  if (/route|corridor|path|movement|travel/.test(text) || object.type === "path" || object.type === "line") return "path";
  if (/region|zone|area|range|ring|hypothesis|uncertainty/.test(text) || ["disc", "ring", "arc-sectors"].includes(object.type)) return "zone";
  if (["plane", "box"].includes(object.type)) return "context";
  return "marker";
}

function interval(object) {
  const text = `${object.id} ${object.label} ${object.layer}`.toLowerCase();
  if (/response|surviv|sar|final.rest|resuscitation|arrival/.test(text)) return { start: 2, end: 3, label: "Response and aftermath" };
  if (/camera|source|evidence|contradiction|hypothesis|withheld|unknown/.test(text)) return { start: 3, end: 3, label: "Investigation and uncertainty" };
  if (/route|corridor|event|incident|shoot|alleged|strike|target/.test(text)) return { start: 1, end: 1, label: "Event-state display" };
  return { start: 0, end: 3, label: "Persistent context" };
}

for (const input of inputs) {
  const scene = readJson(input);
  scene.schema = "forensic-reconstruction-scene/2.0.0";
  scene.scaleState = scene.coordinateSystem.units.toLowerCase().includes("unit") || scene.coordinateSystem.units.toLowerCase().includes("arbitrary") ? "unitless" : "approximate";
  scene.georeferenceState = scene.coordinateSystem.georeferenced ? "validated" : "none";
  scene.temporalStates = [
    { id: "context", label: "Context", order: 0 },
    { id: "event", label: "Event", order: 1 },
    { id: "response", label: "Response", order: 2 },
    { id: "investigation", label: "Investigation", order: 3 },
  ];
  scene.temporal = { current: 0, range: { start: 0, end: 3 }, label: "Context" };
  scene.objects = scene.objects.map((object, index) => ({
    ...object,
    semantic: semantic(object),
    temporal: interval(object),
    labelPriority: object.type === "marker" ? 100 - index : semantic(object) === "context" ? -1 : 50 - index,
    evidenceState: object.layer,
  }));
  writeJson(input, scene);
  const packagePath = input.replace("/local/reconstruction-scene.json", "/forensic-package.json");
  const forensicPackage = readJson(packagePath);
  const sceneCapture = forensicPackage.assetCaptures.find((capture) => capture.localPath === input);
  if (sceneCapture) {
    const absolute = resolve(ROOT, input);
    const bytes = readFileSync(absolute);
    sceneCapture.sha256 = sha256(bytes);
    sceneCapture.byteSize = statSync(absolute).size;
    for (const revision of forensicPackage.reconstructionRevisions) revision.outputHash = sceneCapture.sha256;
    writeJson(packagePath, forensicPackage);
  }
  console.log(`Enhanced spatial labels and temporal states for ${input}`);
}
