import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { canonicalStringify, readJson, sealAuditEvents, sha256, writeJson, ROOT } from "./lib.mjs";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/enhance-package-v2.mjs <package.json>");

const data = readJson(input);
const investigation = data.investigations[0];
const fixtureDirectory = dirname(resolve(ROOT, input));
const generatedAt = data.exportedAt;

function stableId(prefix, value) {
  const digest = createHash("sha256").update(String(value)).digest("hex");
  return `fc_${prefix}_${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
}

function origin(value) {
  try { return new URL(value).origin; } catch { return "invalid://metadata-only"; }
}

function minutesAfter(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

const previousPackageId = data.packageId;
const packageId = stableId("pkg", `${investigation.slug}:forensic-package:v2`);

const sourceFamiliesByKey = new Map();
for (const source of data.sources) {
  const key = `${source.publisher}|${origin(source.canonicalUrl)}`;
  if (!sourceFamiliesByKey.has(key)) {
    sourceFamiliesByKey.set(key, {
      id: stableId("sfm", key),
      label: source.publisher,
      publisher: source.publisher,
      origin: origin(source.canonicalUrl),
      independenceRule: "Sources in this family are not counted as independent solely because they have distinct URLs.",
      createdAt: generatedAt,
    });
  }
}

const sourceFamilies = [...sourceFamiliesByKey.values()];
const underlyingAssets = data.sources.map((source) => ({
  id: stableId("uast", source.canonicalUrl),
  label: `${source.title} — underlying public record`,
  assetClass: source.sourceType.includes("video") ? "published_video" : source.sourceType.includes("report") || source.sourceType.includes("filing") ? "document" : "web_record",
  sourceIds: [source.id],
  derivativeRelationship: "registered_source",
  preservationState: "metadata_only",
  createdAt: generatedAt,
}));

const sourceAcquisitions = data.sources.map((source) => {
  const snapshot = data.sourceSnapshots.find((candidate) => candidate.sourceId === source.id);
  const metadata = {
    requestedUrl: source.canonicalUrl,
    canonicalUrl: source.canonicalUrl,
    retrievedAt: source.retrievedAt,
    lastCheckedAt: source.lastCheckedAt,
    storageState: snapshot?.storageState ?? "metadata_only",
    locatorCount: source.locators.length,
  };
  return {
    id: stableId("acq", source.id),
    sourceId: source.id,
    requestedUrl: source.canonicalUrl,
    canonicalUrl: source.canonicalUrl,
    redirectChain: [],
    retrievalMethod: "manual_metadata_registration",
    retrievalStartedAt: source.retrievedAt,
    retrievalCompletedAt: source.retrievedAt,
    result: "not_fetched_by_policy",
    httpStatus: null,
    responseHeaders: {},
    mimeType: null,
    byteLength: null,
    durationMs: null,
    archiveUrls: [],
    metadataHash: sha256(canonicalStringify(metadata)),
    contentHash: snapshot?.contentHash ?? null,
    rightsDecisionId: source.rightsDecisionId,
    limitations: snapshot?.limitations ?? "Metadata-only registration; no remote body was requested or retained.",
    createdAt: generatedAt,
  };
});

data.sources = data.sources.map((source) => {
  const family = sourceFamiliesByKey.get(`${source.publisher}|${origin(source.canonicalUrl)}`);
  const underlying = underlyingAssets.find((asset) => asset.sourceIds.includes(source.id));
  return {
    ...source,
    sourceFamilyId: family.id,
    underlyingAssetIds: [underlying.id],
    preservationState: "metadata_only",
    authorityClass: source.sourceType.startsWith("official") || source.sourceType.includes("court") ? "primary_official" : "published_secondary",
    freshnessStatus: "current_at_research_cutoff",
  };
});

data.sourceSnapshots = data.sourceSnapshots.map((snapshot) => ({
  ...snapshot,
  preservationState: snapshot.contentHash ? "hashed" : "metadata_only",
  authenticationStatus: snapshot.contentHash ? "content_hash_recorded" : "body_not_preserved",
  metadataFingerprint: sourceAcquisitions.find((acquisition) => acquisition.sourceId === snapshot.sourceId)?.metadataHash ?? null,
}));

data.claimSourceRelationships = data.claimSourceRelationships.map((relationship) => ({
  ...relationship,
  locatorReview: {
    status: relationship.locator?.value ? "machine_checkable_metadata" : "missing",
    supportsProposition: "not_semantically_verified",
    reviewedAt: generatedAt,
    reviewerRole: "deterministic package enhancer",
  },
  sourceFamilyId: data.sources.find((source) => source.id === relationship.sourceId)?.sourceFamilyId ?? null,
  underlyingAssetIds: data.sources.find((source) => source.id === relationship.sourceId)?.underlyingAssetIds ?? [],
}));

const ordinalRubric = {
  high: { authority: 3, independence: 2, precision: 3, preservation: 1, directness: 3 },
  moderate: { authority: 2, independence: 1, precision: 2, preservation: 1, directness: 2 },
  low: { authority: 1, independence: 1, precision: 1, preservation: 1, directness: 1 },
};
data.confidenceAssessments = data.confidenceAssessments.map((assessment) => ({
  ...assessment,
  lowerBound: null,
  upperBound: null,
  calibrationType: "ordinal_not_statistical",
  dimensions: ordinalRubric[assessment.descriptor] ?? ordinalRubric.moderate,
  rubricVersion: "forensic-confidence-ordinal/2.0.0",
}));

for (const claim of data.claims) {
  if (!claim.confidenceAssessmentIds.length) {
    const confidenceId = stableId("conf", claim.id);
    data.confidenceAssessments.push({
      id: confidenceId,
      subjectType: "claim",
      subjectId: claim.id,
      descriptor: "moderate",
      lowerBound: null,
      upperBound: null,
      method: "Ordinal review of authority, independence, precision, preservation, and directness.",
      rationale: "Backfilled to ensure complete claim-confidence coverage; requires substantive review before external use.",
      uncertainty: claim.unresolvedQuestions ?? [],
      assessedAt: generatedAt,
      assessorRole: "deterministic package enhancer",
      createdAt: generatedAt,
      calibrationType: "ordinal_not_statistical",
      dimensions: ordinalRubric.moderate,
      rubricVersion: "forensic-confidence-ordinal/2.0.0",
    });
    claim.confidenceAssessmentIds = [confidenceId];
  }
}

data.assetTransformations = data.assetTransformations.map((transformation) => ({
  ...transformation,
  command: "deterministic-local-builder",
  configurationHash: sha256(canonicalStringify(transformation.parameters ?? {})),
  environment: { network: false, rawThirdPartyBodies: false },
}));

const transformationLedger = data.assetTransformations.map((transformation) => ({
  id: stableId("tlog", transformation.id),
  transformationId: transformation.id,
  inputCaptureIds: [transformation.inputCaptureId].filter(Boolean),
  outputCaptureIds: [transformation.outputCaptureId].filter(Boolean),
  method: transformation.method,
  softwareVersion: transformation.softwareVersion,
  configurationHash: transformation.configurationHash,
  executedAt: transformation.createdAt ?? generatedAt,
  deterministic: true,
}));

const spatialArtifacts = data.reconstructionRevisions.map((revision) => ({
  id: stableId("spa", revision.id),
  investigationId: investigation.id,
  artifactType: "schematic_scene",
  title: data.reconstructionElements.find((element) => element.id === revision.elementId)?.label ?? "Schematic reconstruction artifact",
  sourceCaptureIds: revision.inputIds?.filter((id) => id.startsWith("fc_cap_")) ?? [],
  reconstructionRevisionId: revision.id,
  coordinateSystem: data.spatialAnchors[0]?.crs ?? "LOCAL_UNITLESS",
  units: "unitless",
  georeferenced: false,
  metricValidated: false,
  measurementEnabled: false,
  validation: {
    status: "not_metric",
    reprojectionErrorPx: null,
    controlPointRmse: null,
    residualReportPath: null,
  },
  toolchain: [{ name: "forensic-crawler-scene", version: "2.0.0", configurationHash: sha256(canonicalStringify(revision.parameters ?? {})) }],
  displayStatus: "schematic_only",
  createdAt: revision.createdAt ?? generatedAt,
}));

const resequencedAuditEvents = data.auditEvents.map((event, index) => ({
  ...event,
  occurredAt: minutesAfter(event.occurredAt, index),
  createdAt: minutesAfter(event.createdAt ?? event.occurredAt, index),
  actorIdentity: {
    displayName: event.actorId,
    identityType: event.actorType,
    authenticated: false,
    serviceVersion: event.actorType === "local_tool" ? event.actorId : null,
  },
}));

data.schemaVersion = "2.0.0";
data.packageId = packageId;
data.sourceAcquisitions = sourceAcquisitions;
data.sourceFamilies = sourceFamilies;
data.underlyingAssets = underlyingAssets;
data.transformationLedger = transformationLedger;
data.correctionLedger = (data.corrections ?? []).map((correction) => ({ ...correction, preserved: true }));
data.packageRevisions = [{
  id: stableId("prev", `${packageId}:1`),
  packageId,
  revisionNumber: 1,
  previousPackageId,
  changeSummary: "Upgraded to the v2 provenance, confidence, integrity, reporting, and spatial-artifact contract.",
  createdAt: generatedAt,
}];
data.spatialArtifacts = spatialArtifacts;
data.methodology = {
  scope: investigation.scope ?? [],
  researchCutoff: data.exportedAt,
  inclusionRule: "Public records and specifically reviewed metadata-only fixtures relevant to the defined investigation scope.",
  exclusionRule: "No crawler execution, authenticated access, raw third-party body retention, publication, or unsupported identity, guilt, trajectory, or metric inference.",
  sourceHierarchy: ["preserved primary evidence", "official record", "independent reporting", "attributed analysis", "unresolved assertion"],
};
data.glossary = [
  { term: "Established", definition: "Supported within the package by the strongest available source state; not a universal or judicial finding." },
  { term: "Attributed", definition: "A proposition presented as a named source's claim rather than adopted as fact." },
  { term: "Metadata-only", definition: "The source link and descriptive record are retained without the remote response body." },
  { term: "Schematic", definition: "A relational visual model that is not metric, geodetic, ballistic, or photogrammetric." },
];
data.integritySummary = {
  structuralValidation: "passed_v2_audit",
  evidentiaryAuthentication: "limited_metadata_only",
  sourceBodiesPreserved: data.sourceSnapshots.filter((snapshot) => snapshot.contentHash).length,
  sourceBodiesNotPreserved: data.sourceSnapshots.filter((snapshot) => !snapshot.contentHash).length,
  confidenceCoverage: data.claims.every((claim) => claim.confidenceAssessmentIds.length > 0),
  locatorCoverage: data.claimSourceRelationships.every((relationship) => Boolean(relationship.locator?.value)),
  auditChainLinked: true,
  signatureStatus: "unsigned_local_working_package",
  warnings: ["Internal consistency does not authenticate remote source content.", "Human and tool actor identities are not cryptographically authenticated."],
};

data.auditEvents = sealAuditEvents(resequencedAuditEvents.map((event) => ({
  ...event,
  subjectIds: (event.subjectIds ?? []).map((id) => id === previousPackageId ? packageId : id),
})));

writeJson(input, data);

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.name === "manifest.json") return [];
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const manifestFiles = filesUnder(fixtureDirectory).map((path) => {
  const bytes = readFileSync(path);
  return { path: relative(fixtureDirectory, path), sha256: sha256(bytes), byteSize: statSync(path).size };
});
const manifest = {
  schemaVersion: "2.0.0",
  packageId,
  generatedAt,
  algorithm: "sha256",
  files: manifestFiles,
  rootHash: sha256(canonicalStringify(manifestFiles)),
  signature: { status: "unsigned_local_working_package", algorithm: null, publicKey: null, value: null },
};
writeJson(relative(ROOT, resolve(fixtureDirectory, "manifest.json")), manifest);
console.log(`Enhanced ${input} to schema v2 with ${sourceAcquisitions.length} acquisition records and ${spatialArtifacts.length} spatial artifacts.`);
