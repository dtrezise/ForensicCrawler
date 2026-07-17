import { describe, expect, it } from "vitest";
import fixture from "../fixtures/pilots/apollo-11-landing/forensic-package.json";
import kirkFixture from "../fixtures/pilots/charlie-kirk-assassination/forensic-package.json";
import goodFixture from "../fixtures/pilots/renee-good-killing/forensic-package.json";
import vesselsFixture from "../fixtures/pilots/southern-spear-vessel-strikes/forensic-package.json";
import { auditPackage, canonicalStringify, eventHash, sealAuditEvents, validatePackage } from "../scripts/lib.mjs";

type JsonRecord = Record<string, unknown>;

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("forensic package", () => {
  it("validates against the versioned 2020-12 schema", () => {
    expect(validatePackage(fixture)).toEqual({ valid: true, errors: [] });
    expect(validatePackage(kirkFixture)).toEqual({ valid: true, errors: [] });
    expect(validatePackage(goodFixture)).toEqual({ valid: true, errors: [] });
    expect(validatePackage(vesselsFixture)).toEqual({ valid: true, errors: [] });
  });

  it("audits the vessel-strike campaign fixture without inventing a complete ledger", () => {
    const result = auditPackage(vesselsFixture as JsonRecord);
    expect(result.valid, result.issues.join("\n")).toBe(true);
    expect(result.counts.claims).toBe(24);
    expect(result.counts.sources).toBe(20);
    expect(result.counts.contradictions).toBe(7);
    expect(vesselsFixture.investigations[0]!.status).toBe("working");
    expect(vesselsFixture.claimRevisions.some((revision) => revision.text.includes("at least 66 vessels"))).toBe(true);
    expect(vesselsFixture.claimRevisions.some((revision) => revision.text.includes("No single unqualified campaign death total"))).toBe(true);
  });

  it("keeps the vessel fixture metadata-only and the maritime scene non-operational", () => {
    expect(vesselsFixture.sourceSnapshots.every((snapshot) => snapshot.contentHash === null && snapshot.httpStatus === null)).toBe(true);
    expect(vesselsFixture.sourceRegistryEntries.every((entry) => entry.networkUseApproved === false && entry.storageMode === "no_bytes")).toBe(true);
    expect(vesselsFixture.reconstructionRevisions.every((revision) => revision.parameters.metricClaim === false && revision.parameters.geospatialClaim === false)).toBe(true);
    expect(vesselsFixture.editorialReviews.some((review) => review.findings.some((finding) => finding.includes("No platform, munition, route, target-recognition, impact, identity, cargo, or photogrammetric solve")))).toBe(true);
  });

  it("audits the Renee Good fixture while preserving disputed conduct and current posture", () => {
    const result = auditPackage(goodFixture as JsonRecord);
    expect(result.valid, result.issues.join("\n")).toBe(true);
    expect(result.counts.claims).toBe(24);
    expect(result.counts.sources).toBe(24);
    expect(result.counts.contradictions).toBe(8);
    expect(goodFixture.investigations[0]!.status).toBe("working");
    expect(goodFixture.contradictions.some((item) => item.title === "Vehicle intent and weaponization")).toBe(true);
    expect(goodFixture.claimRevisions.some((revision) => revision.text.includes("No state charge, state declination"))).toBe(true);
  });

  it("keeps the Good case metadata-only and the street scene non-metric", () => {
    expect(goodFixture.sourceSnapshots.every((snapshot) => snapshot.contentHash === null && snapshot.httpStatus === null)).toBe(true);
    expect(goodFixture.sourceRegistryEntries.every((entry) => entry.networkUseApproved === false && entry.storageMode === "no_bytes")).toBe(true);
    expect(goodFixture.reconstructionRevisions.every((revision) => revision.parameters.metricClaim === false)).toBe(true);
    expect(goodFixture.editorialReviews.some((review) => review.findings.some((finding) => finding.includes("No trajectory, collision, intent, identity, or clinical-causation solve")))).toBe(true);
  });

  it("audits the public-record assassination fixture without flattening its conflicts", () => {
    const result = auditPackage(kirkFixture as JsonRecord);
    expect(result.valid, result.issues.join("\n")).toBe(true);
    expect(result.counts.claims).toBe(18);
    expect(result.counts.sources).toBe(13);
    expect(result.counts.contradictions).toBe(5);
    expect(kirkFixture.investigations[0]!.status).toBe("working");
    expect(kirkFixture.contradictions.some((item) => item.title === "Incident minute and timezone label")).toBe(true);
  });

  it("keeps the case metadata-only and the local scene explicitly non-photogrammetric", () => {
    expect(kirkFixture.sourceSnapshots.every((snapshot) => snapshot.contentHash === null && snapshot.httpStatus === null)).toBe(true);
    expect(kirkFixture.sourceRegistryEntries.every((entry) => entry.networkUseApproved === false && entry.storageMode === "no_bytes")).toBe(true);
    expect(kirkFixture.reconstructionRevisions.every((revision) => revision.parameters.metricClaim === false)).toBe(true);
    expect(kirkFixture.editorialReviews.some((review) => review.findings.some((finding) => finding.includes("No ballistic, acoustic, identity, or photogrammetric solve")))).toBe(true);
  });

  it("passes reference, rights, custody, and audit-chain checks", () => {
    const result = auditPackage(fixture as JsonRecord);
    expect(result.valid, result.issues.join("\n")).toBe(true);
    expect(result.counts.auditEvents).toBe(5);
    expect(result.counts.claims).toBe(4);
  });

  it("detects mutation of a sealed audit event", () => {
    const tampered = copy(fixture);
    tampered.auditEvents[1]!.details.differenceSeconds = 4.2;
    const result = auditPackage(tampered as JsonRecord);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain(`audit event hash mismatch: ${tampered.auditEvents[1]!.id}`);
  });

  it("detects orphaned derivative transformations", () => {
    const orphaned = copy(fixture);
    orphaned.reconstructionElements[0]!.assetTransformationIds = [];
    const result = auditPackage(orphaned as JsonRecord);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain(`orphan transformation: ${orphaned.assetTransformations[0]!.id}`);
  });

  it("requires the current claim revision to be the latest append-only revision", () => {
    const stale = copy(fixture);
    stale.claimRevisions.push({
      ...stale.claimRevisions[0]!,
      id: "fc_clmr_00000000-0000-4000-8000-000000000005",
      revisionNumber: 2,
      changeReason: "Test-only later revision",
      text: "Test-only later text",
    });
    const result = auditPackage(stale as JsonRecord);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain(`claim current revision is not latest: ${stale.claims[0]!.id}`);
  });

  it("blocks private display, expert, and project-byte records from public candidate exports", () => {
    const unsafePublic = copy(fixture);
    unsafePublic.exportProfile = "public_candidate";
    const result = auditPackage(unsafePublic as JsonRecord);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.startsWith("public candidate has non-public display decision"))).toBe(true);
    expect(result.issues.some((issue) => issue.startsWith("public candidate has non-public export decision"))).toBe(true);
  });

  it("relinks an audit chain deterministically", () => {
    const events = copy(fixture.auditEvents) as Array<Record<string, unknown>>;
    const first = sealAuditEvents(events);
    const second = sealAuditEvents(events);
    expect(first).toEqual(second);
    expect(first[1]!.previousHash).toBe(first[0]!.eventHash);
    expect(eventHash(first[0]!)).toBe(first[0]!.eventHash);
  });

  it("canonicalizes object order without changing array order unless records have ids", () => {
    const left = { z: 1, nested: { b: 2, a: 1 }, records: [{ id: "b", v: 2 }, { id: "a", v: 1 }] };
    const right = { records: [{ v: 1, id: "a" }, { v: 2, id: "b" }], nested: { a: 1, b: 2 }, z: 1 };
    expect(canonicalStringify(left)).toBe(canonicalStringify(right));
  });

  it("keeps every pilot source metadata-only and network-disabled", () => {
    expect(fixture.sourceSnapshots.every((snapshot) => snapshot.contentHash === null && snapshot.httpStatus === null)).toBe(true);
    expect(fixture.sourceRegistryEntries.every((entry) => entry.networkUseApproved === false && entry.storageMode === "no_bytes")).toBe(true);
  });

  it("gives every claim an exact source relationship", () => {
    for (const claim of fixture.claims) {
      expect(fixture.claimSourceRelationships.some((relationship) => relationship.claimId === claim.id)).toBe(true);
    }
  });
});
