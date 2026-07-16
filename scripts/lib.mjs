import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const PACKAGE_SCHEMA_PATH = resolve(ROOT, "schemas/v1/forensic-package.schema.json");

export function readJson(path) {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
}

export function canonicalize(value) {
  if (Array.isArray(value)) {
    const normalized = value.map(canonicalize);
    if (normalized.every((item) => item && typeof item === "object" && typeof item.id === "string")) {
      return normalized.sort((left, right) => left.id.localeCompare(right.id));
    }
    return normalized;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }

  return value;
}

export function canonicalStringify(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return createHash("sha256").update(input).digest("hex");
}

export function writeJson(path, value) {
  const absolute = resolve(ROOT, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, canonicalStringify(value), "utf8");
}

export function validateJsonSchema(data, schemaPath) {
  const schema = JSON.parse(readFileSync(resolve(ROOT, schemaPath), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return {
    valid: Boolean(valid),
    errors: (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`),
  };
}

export function validatePackage(data) {
  return validateJsonSchema(data, PACKAGE_SCHEMA_PATH);
}

export function eventHash(event) {
  const { eventHash: _ignored, ...hashable } = event;
  return sha256(canonicalStringify(hashable));
}

export function sealAuditEvents(events) {
  let previousHash = null;
  return [...events]
    .sort((left, right) => left.sequence - right.sequence)
    .map((event, index) => {
      const sealed = {
        ...event,
        sequence: index + 1,
        previousHash,
        eventHash: "0".repeat(64),
      };
      sealed.eventHash = eventHash(sealed);
      previousHash = sealed.eventHash;
      return sealed;
    });
}

const RECORD_ARRAYS = [
  "investigations",
  "events",
  "claims",
  "claimRevisions",
  "sources",
  "sourceSnapshots",
  "sourceRegistryEntries",
  "assets",
  "assetCaptures",
  "assetTransformations",
  "entities",
  "observations",
  "temporalAnchors",
  "spatialAnchors",
  "claimSourceRelationships",
  "assetSourceRelationships",
  "contradictions",
  "rightsDecisions",
  "confidenceAssessments",
  "reconstructionElements",
  "reconstructionRevisions",
  "expertCandidates",
  "interviews",
  "consentRecords",
  "editorialReviews",
  "corrections",
  "exports",
  "importRuns",
  "auditEvents",
];

export function recordIndex(data) {
  const index = new Map([[data.packageId, { collection: "package", record: data }]]);
  const duplicates = [];

  for (const collection of RECORD_ARRAYS) {
    for (const record of data[collection] ?? []) {
      if (index.has(record.id)) duplicates.push(record.id);
      index.set(record.id, { collection, record });
    }
  }

  return { index, duplicates };
}

function referencedIds(value, key = "") {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => referencedIds(entry, key));
  }

  if (!value || typeof value !== "object") return [];

  const references = [];
  for (const [childKey, childValue] of Object.entries(value)) {
    if (childKey === "actorId") continue;
    if (childKey.endsWith("Id") && typeof childValue === "string" && childValue.startsWith("fc_")) {
      references.push({ key: childKey, id: childValue });
      continue;
    }
    if (childKey.endsWith("Ids") && Array.isArray(childValue)) {
      for (const id of childValue) {
        if (typeof id === "string" && id.startsWith("fc_")) references.push({ key: childKey, id });
      }
      continue;
    }
    references.push(...referencedIds(childValue, childKey));
  }
  return references;
}

export function auditPackage(data) {
  const issues = [];
  const validation = validatePackage(data);
  if (!validation.valid) issues.push(...validation.errors.map((error) => `schema: ${error}`));

  const { index, duplicates } = recordIndex(data);
  for (const id of duplicates) issues.push(`duplicate id: ${id}`);

  for (const [id, entry] of index) {
    for (const reference of referencedIds(entry.record)) {
      if (!index.has(reference.id)) issues.push(`broken reference: ${id}.${reference.key} -> ${reference.id}`);
    }
  }

  for (const claim of data.claims) {
    const relationships = data.claimSourceRelationships.filter((relationship) => relationship.claimId === claim.id);
    if (relationships.length === 0) issues.push(`claim has no evidence relationship: ${claim.id}`);
  }

  const referencedSourceIds = new Set([
    ...data.claimSourceRelationships.map((relationship) => relationship.sourceId),
    ...data.assetSourceRelationships.map((relationship) => relationship.sourceId),
    ...data.editorialReviews.flatMap((review) => review.subjectIds),
  ]);
  for (const source of data.sources) {
    if (!referencedSourceIds.has(source.id)) issues.push(`orphan source: ${source.id}`);
  }

  const referencedEntityIds = new Set([
    ...data.events.flatMap((event) => event.entityIds),
    ...data.claims.flatMap((claim) => claim.entityIds),
    ...data.observations.flatMap((observation) => observation.entityIds),
  ]);
  for (const entity of data.entities) {
    if (!referencedEntityIds.has(entity.id)) issues.push(`orphan entity: ${entity.id}`);
  }

  for (const claim of data.claims) {
    const revisions = data.claimRevisions
      .filter((revision) => revision.claimId === claim.id)
      .sort((left, right) => left.revisionNumber - right.revisionNumber);
    if (revisions.length === 0) {
      issues.push(`claim has no revision history: ${claim.id}`);
      continue;
    }
    revisions.forEach((revision, indexValue) => {
      if (revision.revisionNumber !== indexValue + 1) issues.push(`claim revision sequence gap: ${claim.id}`);
    });
    if (claim.currentRevisionId !== revisions.at(-1)?.id) issues.push(`claim current revision is not latest: ${claim.id}`);
  }

  const referencedAssetIds = new Set([
    ...data.assetCaptures.map((capture) => capture.assetId),
    ...data.assetTransformations.map((transformation) => transformation.assetId),
    ...data.assetSourceRelationships.map((relationship) => relationship.assetId),
    ...data.observations.map((observation) => observation.assetId).filter(Boolean),
  ]);
  for (const asset of data.assets) {
    if (!referencedAssetIds.has(asset.id)) issues.push(`orphan asset: ${asset.id}`);
  }

  const referencedTransformationIds = new Set(
    data.reconstructionElements.flatMap((element) => element.assetTransformationIds),
  );
  for (const transformation of data.assetTransformations) {
    if (!referencedTransformationIds.has(transformation.id)) issues.push(`orphan transformation: ${transformation.id}`);
    const input = data.assetCaptures.find((capture) => capture.id === transformation.inputCaptureId);
    const output = data.assetCaptures.find((capture) => capture.id === transformation.outputCaptureId);
    if (input && input.assetId !== transformation.assetId) issues.push(`transformation input asset mismatch: ${transformation.id}`);
    if (output && output.assetId !== transformation.assetId) issues.push(`transformation output asset mismatch: ${transformation.id}`);
  }

  for (const element of data.reconstructionElements) {
    const revisions = data.reconstructionRevisions
      .filter((revision) => revision.elementId === element.id)
      .sort((left, right) => left.revisionNumber - right.revisionNumber);
    if (revisions.length === 0) {
      issues.push(`reconstruction element has no revision history: ${element.id}`);
      continue;
    }
    revisions.forEach((revision, indexValue) => {
      if (revision.revisionNumber !== indexValue + 1) issues.push(`reconstruction revision sequence gap: ${element.id}`);
    });
    if (element.currentRevisionId !== revisions.at(-1)?.id) issues.push(`reconstruction current revision is not latest: ${element.id}`);
  }

  const captureHashes = new Set(data.assetCaptures.map((capture) => capture.sha256));
  for (const revision of data.reconstructionRevisions) {
    if (!captureHashes.has(revision.outputHash)) issues.push(`reconstruction output hash has no retained capture: ${revision.id}`);
  }

  for (const source of data.sources) {
    const decision = data.rightsDecisions.find((candidate) => candidate.id === source.rightsDecisionId);
    if (!decision || decision.subjectId !== source.id) issues.push(`source rights mismatch: ${source.id}`);
  }
  for (const asset of data.assets) {
    const decision = data.rightsDecisions.find((candidate) => candidate.id === asset.rightsDecisionId);
    if (!decision || decision.subjectId !== asset.id) issues.push(`asset rights mismatch: ${asset.id}`);
  }

  for (const capture of data.assetCaptures) {
    const absolute = resolve(ROOT, capture.localPath);
    if (!existsSync(absolute)) {
      issues.push(`missing local capture: ${capture.localPath}`);
      continue;
    }
    const bytes = readFileSync(absolute);
    if (sha256(bytes) !== capture.sha256) issues.push(`capture hash mismatch: ${capture.id}`);
    if (statSync(absolute).size !== capture.byteSize) issues.push(`capture size mismatch: ${capture.id}`);
  }

  const events = [...data.auditEvents].sort((left, right) => left.sequence - right.sequence);
  let previousHash = null;
  for (let indexValue = 0; indexValue < events.length; indexValue += 1) {
    const event = events[indexValue];
    if (event.sequence !== indexValue + 1) issues.push(`audit sequence gap at ${event.id}`);
    if (event.previousHash !== previousHash) issues.push(`audit previous hash mismatch: ${event.id}`);
    if (eventHash(event) !== event.eventHash) issues.push(`audit event hash mismatch: ${event.id}`);
    previousHash = event.eventHash;
  }

  if (data.exportProfile === "public_candidate") {
    if (data.expertCandidates.length || data.interviews.length || data.consentRecords.length) {
      issues.push("public candidate package contains private expert workflow records");
    }
    if (data.exports.some((record) => record.includesRestricted)) {
      issues.push("public candidate package includes a restricted export");
    }
    for (const decision of data.rightsDecisions) {
      if (["private_metadata", "private_excerpt", "private_bytes", "denied"].includes(decision.displayPermission)) {
        issues.push(`public candidate has non-public display decision: ${decision.id}`);
      }
      if (["project_bytes", "denied"].includes(decision.exportPermission)) {
        issues.push(`public candidate has non-public export decision: ${decision.id}`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    counts: Object.fromEntries(RECORD_ARRAYS.map((collection) => [collection, data[collection]?.length ?? 0])),
  };
}
