export type EvidenceState =
  | "directly_observed_primary_evidence"
  | "authenticated_official_record"
  | "independently_corroborated"
  | "attributed_unverified"
  | "disputed"
  | "contradicted"
  | "inferred"
  | "interpolated"
  | "unresolved"
  | "superseded"
  | "retracted";

export interface Locator {
  kind: string;
  value: string;
  label?: string;
}

export interface Investigation {
  id: string;
  title: string;
  status: string;
  purpose: string;
  scope?: string[];
  updatedAt: string;
}

export interface ClaimRevision {
  id: string;
  claimId: string;
  claimant: string;
  text: string;
  changeReason: string;
}

export interface Claim {
  id: string;
  currentRevisionId: string;
  evidenceState: EvidenceState;
  confidenceAssessmentIds: string[];
  unresolvedQuestions?: string[];
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  sourceType: string;
  canonicalUrl: string;
  locators: Locator[];
  retrievedAt: string;
  rightsDecisionId: string;
  registryEntryId: string;
}

export interface SourceSnapshot {
  id: string;
  sourceId: string;
  storageState: string;
  contentHash: string | null;
  httpStatus: number | null;
  limitations: string;
}

export interface SourceRegistryEntry {
  id: string;
  displayName: string;
  accessClass: string;
  networkUseApproved: boolean;
  storageMode: string;
  status: string;
  ownerRole: string;
}

export interface ClaimSourceRelationship {
  id: string;
  claimId: string;
  sourceId: string;
  sourceSnapshotId: string;
  function: string;
  rationale: string;
  independenceNote: string;
  locator: Locator;
}

export interface TemporalAnchor {
  id: string;
  label: string;
  originalExpression: string;
  missionElapsedSeconds: number;
  normalizedUtc: string | null;
  precisionSeconds: number;
  sourceId: string;
  conversionRationale: string;
}

export interface Contradiction {
  id: string;
  title: string;
  description: string;
  status: string;
  reviewStatus: string;
  magnitudeSeconds: number | null;
  claimIds: string[];
  temporalAnchorIds: string[];
  alternateExplanations: string[];
}

export interface RightsDecision {
  id: string;
  subjectId: string;
  rightsStatus: string;
  storagePermission: string;
  displayPermission: string;
  exportPermission: string;
  rationale: string;
}

export interface ConfidenceAssessment {
  id: string;
  subjectId: string;
  descriptor: string;
  method: string;
  rationale: string;
  uncertainty: string[];
}

export interface EditorialReview {
  id: string;
  reviewType: string;
  reviewerRole: string;
  findings: string[];
  limitations: string[];
}

export interface AuditEvent {
  id: string;
  sequence: number;
  eventType: string;
  actorId: string;
  actorType: string;
  occurredAt: string;
  eventHash: string;
  previousHash: string | null;
}

export interface ForensicPackage {
  schemaVersion: string;
  packageType: string;
  packageId: string;
  exportedAt: string;
  exportProfile: string;
  investigations: Investigation[];
  claims: Claim[];
  claimRevisions: ClaimRevision[];
  sources: Source[];
  sourceSnapshots: SourceSnapshot[];
  sourceRegistryEntries: SourceRegistryEntry[];
  claimSourceRelationships: ClaimSourceRelationship[];
  temporalAnchors: TemporalAnchor[];
  contradictions: Contradiction[];
  rightsDecisions: RightsDecision[];
  confidenceAssessments: ConfidenceAssessment[];
  editorialReviews: EditorialReview[];
  auditEvents: AuditEvent[];
  assets: Array<{ id: string; title: string; mediaType: string }>;
  assetCaptures: Array<{ id: string; assetId: string; localPath: string; sha256: string; byteSize: number }>;
  entities: Array<{ id: string; canonicalName: string; entityType: string; aliases: string[] }>;
  observations: Array<{ id: string; description: string; evidenceState: EvidenceState; sourceId: string }>;
  reconstructionElements: Array<{ id: string; label: string; elementClass: string }>;
  reconstructionRevisions: Array<{ id: string; elementId: string; method: string; outputHash: string; uncertainty: string[] }>;
  exports: unknown[];
  expertCandidates: unknown[];
  interviews: unknown[];
  consentRecords: unknown[];
}
