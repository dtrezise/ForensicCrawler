import { describe, expect, it } from "vitest";
import fixture from "../fixtures/pilots/apollo-11-landing/forensic-package.json";
import { auditPackage, canonicalStringify, eventHash, sealAuditEvents, validatePackage } from "../scripts/lib.mjs";

type JsonRecord = Record<string, unknown>;

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("forensic package", () => {
  it("validates against the versioned 2020-12 schema", () => {
    expect(validatePackage(fixture)).toEqual({ valid: true, errors: [] });
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
