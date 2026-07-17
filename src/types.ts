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
  slug: string;
  title: string;
  status: string;
  purpose: string;
  scope?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  investigationId: string;
  title: string;
  description: string;
  entityIds: string[];
  temporalAnchorIds: string[];
  createdAt: string;
}

export interface ClaimRevision {
  id: string;
  claimId: string;
  revisionNumber: number;
  claimant: string;
  text: string;
  changeReason: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  investigationId: string;
  currentRevisionId: string;
  entityIds: string[];
  evidenceState: EvidenceState;
  proceduralStatus: string | null;
  confidenceAssessmentIds: string[];
  unresolvedQuestions?: string[];
  createdAt: string;
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  author?: string | null;
  publishedAt?: string | null;
  sourceType: string;
  canonicalUrl: string;
  locators: Locator[];
  retrievedAt: string;
  lastCheckedAt: string;
  rightsDecisionId: string;
  registryEntryId: string;
  createdAt: string;
  sourceFamilyId?: string;
  underlyingAssetIds?: string[];
  preservationState?: string;
  authorityClass?: string;
  freshnessStatus?: string;
}

export interface SourceSnapshot {
  id: string;
  sourceId: string;
  storageState: string;
  contentHash: string | null;
  httpStatus: number | null;
  limitations: string;
  preservationState?: string;
  authenticationStatus?: string;
  metadataFingerprint?: string | null;
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
  missionElapsedSeconds: number | null;
  normalizedUtc: string | null;
  precisionSeconds: number;
  uncertaintyLowerSeconds: number;
  uncertaintyUpperSeconds: number;
  sourceId: string;
  conversionRationale: string;
  locator: Locator;
}

export interface SpatialAnchor {
  id: string;
  label: string;
  geometry: Record<string, unknown>;
  crs: string;
  uncertaintyMeters: number;
  method: string;
  sourceRelationshipIds: string[];
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
  subjectType: string;
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
  lowerBound: number | null;
  upperBound: number | null;
  method: string;
  rationale: string;
  uncertainty: string[];
  calibrationType?: "ordinal_not_statistical" | string;
  dimensions?: Record<string, number>;
  rubricVersion?: string;
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
  actorIdentity?: {
    displayName: string;
    identityType: string;
    authenticated: boolean;
    serviceVersion?: string | null;
  };
}

export interface AssetCapture {
  id: string;
  assetId: string;
  localPath: string;
  sha256: string;
  byteSize: number;
  mimeType: string;
}

export interface ReconstructionElement {
  id: string;
  label: string;
  elementClass: string;
  observationIds: string[];
  currentRevisionId: string;
}

export interface ReconstructionRevision {
  id: string;
  elementId: string;
  method: string;
  outputHash: string;
  uncertainty: string[];
}

export interface ForensicPackage {
  schemaVersion: string;
  packageType: string;
  packageId: string;
  exportedAt: string;
  exportProfile: string;
  investigations: Investigation[];
  events: EventRecord[];
  claims: Claim[];
  claimRevisions: ClaimRevision[];
  sources: Source[];
  sourceSnapshots: SourceSnapshot[];
  sourceRegistryEntries: SourceRegistryEntry[];
  claimSourceRelationships: ClaimSourceRelationship[];
  temporalAnchors: TemporalAnchor[];
  spatialAnchors: SpatialAnchor[];
  contradictions: Contradiction[];
  rightsDecisions: RightsDecision[];
  confidenceAssessments: ConfidenceAssessment[];
  editorialReviews: EditorialReview[];
  auditEvents: AuditEvent[];
  assets: Array<{ id: string; title: string; mediaType: string; rightsDecisionId: string }>;
  assetCaptures: AssetCapture[];
  assetTransformations: Array<{ id: string; method: string; softwareVersion: string }>;
  entities: Array<{ id: string; canonicalName: string; entityType: string; aliases: string[] }>;
  observations: Array<{ id: string; description: string; evidenceState: EvidenceState; sourceId: string | null }>;
  reconstructionElements: ReconstructionElement[];
  reconstructionRevisions: ReconstructionRevision[];
  exports: unknown[];
  expertCandidates: unknown[];
  interviews: unknown[];
  consentRecords: unknown[];
  sourceAcquisitions?: SourceAcquisition[];
  sourceFamilies?: SourceFamily[];
  underlyingAssets?: UnderlyingAsset[];
  transformationLedger?: TransformationLedgerEntry[];
  correctionLedger?: unknown[];
  packageRevisions?: PackageRevision[];
  spatialArtifacts?: SpatialArtifact[];
  integritySummary?: IntegritySummary;
  methodology?: Methodology;
  glossary?: Array<{ term: string; definition: string }>;
}

export interface SourceAcquisition {
  id: string;
  sourceId: string;
  requestedUrl: string;
  canonicalUrl: string;
  redirectChain: string[];
  retrievalMethod: string;
  retrievalStartedAt: string;
  retrievalCompletedAt: string;
  result: string;
  httpStatus: number | null;
  responseHeaders: Record<string, string>;
  mimeType: string | null;
  byteLength: number | null;
  durationMs: number | null;
  archiveUrls: string[];
  metadataHash: string;
  contentHash: string | null;
  rightsDecisionId: string;
  limitations: string;
  createdAt: string;
}

export interface SourceFamily {
  id: string;
  label: string;
  publisher: string;
  origin: string;
  independenceRule: string;
  createdAt: string;
}

export interface UnderlyingAsset {
  id: string;
  label: string;
  assetClass: string;
  sourceIds: string[];
  derivativeRelationship: string;
  preservationState: string;
  createdAt: string;
}

export interface TransformationLedgerEntry {
  id: string;
  transformationId: string;
  inputCaptureIds: string[];
  outputCaptureIds: string[];
  method: string;
  softwareVersion: string;
  configurationHash: string;
  executedAt: string;
  deterministic: boolean;
}

export interface PackageRevision {
  id: string;
  packageId: string;
  revisionNumber: number;
  previousPackageId: string;
  changeSummary: string;
  createdAt: string;
}

export interface SpatialArtifact {
  id: string;
  investigationId: string;
  artifactType: "schematic_scene" | "camera_solution" | "point_cloud" | "metric_mesh" | "gaussian_splat" | string;
  title: string;
  sourceCaptureIds: string[];
  reconstructionRevisionId?: string;
  coordinateSystem: string;
  units: string;
  georeferenced: boolean;
  metricValidated: boolean;
  measurementEnabled: boolean;
  validation: {
    status: string;
    reprojectionErrorPx: number | null;
    controlPointRmse: number | null;
    residualReportPath: string | null;
  };
  toolchain: Array<{ name: string; version: string; configurationHash: string }>;
  displayStatus: string;
  createdAt: string;
}

export interface IntegritySummary {
  structuralValidation: string;
  evidentiaryAuthentication: string;
  sourceBodiesPreserved: number;
  sourceBodiesNotPreserved: number;
  confidenceCoverage: boolean;
  locatorCoverage: boolean;
  auditChainLinked: boolean;
  signatureStatus: string;
  warnings: string[];
}

export interface Methodology {
  scope: string[];
  researchCutoff: string;
  inclusionRule: string;
  exclusionRule: string;
  sourceHierarchy: string[];
}

export interface SceneLayer {
  id: string;
  label: string;
  class: string;
  color: string;
}

export interface SceneObject {
  id: string;
  type: string;
  center?: [number, number, number];
  size?: [number, number] | [number, number, number];
  radius?: number | [number, number];
  width?: number;
  sectors?: Array<[number, number]>;
  points?: Array<[number, number, number]>;
  layer: string;
  label: string;
  semanticType?: string;
  temporalState?: string;
  confidence?: string;
  evidenceState?: string;
  claimIds?: string[];
  sourceIds?: string[];
  uncertainty?: string;
}

export interface ReconstructionSceneData {
  schema: string;
  title: string;
  status: string;
  coordinateSystem: { id: string; units: string; georeferenced: boolean; northAligned: boolean; origin: string };
  calibration: Record<string, boolean>;
  layers: SceneLayer[];
  objects: SceneObject[];
  cameraPresets: Array<{ id: string; label: string; position: [number, number, number]; target: [number, number, number] }>;
  limitations: string[];
  temporalStates?: Array<{ id: string; label: string; order: number }>;
  scaleState?: "unitless" | "approximate" | "metric_validated";
  georeferenceState?: "none" | "approximate" | "validated";
}
