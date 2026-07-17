import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { auditPackage, readJson, ROOT } from "../lib.mjs";

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) throw new Error("Usage: node scripts/reporting/export-report-v2.mjs <package.json> <report.md>");

const data = readJson(input);
const audit = auditPackage(data);
if (!audit.valid) throw new Error(`Report blocked by package audit:\n${audit.issues.join("\n")}`);

const investigation = data.investigations[0];
const revisionById = new Map(data.claimRevisions.map((revision) => [revision.id, revision]));
const confidenceById = new Map(data.confidenceAssessments.map((assessment) => [assessment.id, assessment]));
const sourceCodes = new Map(data.sources.map((source, index) => [source.id, `S${String(index + 1).padStart(3, "0")}`]));

const clean = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
const claimText = (claim) => revisionById.get(claim.currentRevisionId)?.text ?? "Current claim revision missing";
const relationships = (claimId) => data.claimSourceRelationships.filter((relationship) => relationship.claimId === claimId);
const citations = (claimId) => relationships(claimId).map((relationship) => {
  const locator = relationship.locator?.label || relationship.locator?.value || "locator unavailable";
  return `[${sourceCodes.get(relationship.sourceId)} - ${clean(locator)}]`;
}).join(" ");

const established = data.claims.filter((claim) => ["directly_observed_primary_evidence", "authenticated_official_record", "independently_corroborated"].includes(claim.evidenceState)).slice(0, 6);
const attributed = data.claims.filter((claim) => claim.evidenceState === "attributed_unverified").slice(0, 6);
const disputed = data.claims.filter((claim) => ["disputed", "contradicted", "unresolved"].includes(claim.evidenceState)).slice(0, 6);
const unknowns = [...new Set(data.claims.flatMap((claim) => claim.unresolvedQuestions ?? []))];

const lines = [
  `# ${investigation.title}`,
  "",
  "## First-pass forensic briefing and technical audit",
  "",
  `**Status:** ${investigation.status.toUpperCase()} private working analysis`,
  "",
  `**Research cutoff:** ${data.exportedAt}`,
  "",
  `**Package:** \`${data.packageId}\``,
  "",
  `**Schema:** ${data.schemaVersion}`,
  "",
  `**Package revision:** ${data.packageRevisions?.at(-1)?.revisionNumber ?? 1}`,
  "",
  "> This source-linked working analysis is not a finding of guilt, certification, court-admissibility opinion, metric-reconstruction validation, or public-release approval.",
  "",
  "## Executive summary",
  "",
  "### Established within this package",
  "",
  ...(established.length ? established.map((claim) => `- ${claimText(claim)} ${citations(claim.id)}`) : ["- No proposition is designated established within the current evidence model."]),
  "",
  "### Attributed claims",
  "",
  ...(attributed.length ? attributed.map((claim) => `- ${claimText(claim)} ${citations(claim.id)}`) : ["- No separately attributed claims are recorded."]),
  "",
  "### Disputed or unresolved",
  "",
  ...(disputed.length ? disputed.map((claim) => `- ${claimText(claim)} ${citations(claim.id)}`) : data.contradictions.slice(0, 6).map((item) => `- **${item.title}:** ${item.description}`)),
  "",
  "### Unknown and next evidence",
  "",
  ...(unknowns.length ? unknowns.slice(0, 12).map((question) => `- ${question}`) : ["- No open question was recorded; this does not mean the public record is complete."]),
  "",
  "## Scope and methodology",
  "",
  investigation.purpose,
  "",
  ...(investigation.scope ?? []).map((item) => `- ${item}`),
  "",
  `**Inclusion rule:** ${data.methodology?.inclusionRule ?? "Defined public-record scope."}`,
  "",
  `**Exclusion rule:** ${data.methodology?.exclusionRule ?? "No unsupported inference or unauthorized source retention."}`,
  "",
  "**Source hierarchy:**",
  "",
  ...(data.methodology?.sourceHierarchy ?? []).map((item, index) => `${index + 1}. ${item}`),
  "",
  "## Chronology",
  "",
  ...data.events.flatMap((event, index) => {
    const anchors = event.temporalAnchorIds.map((id) => data.temporalAnchors.find((item) => item.id === id)).filter(Boolean);
    return [`### ${String(index + 1).padStart(2, "0")} - ${event.title}`, "", `**Source time:** ${anchors.map((anchor) => anchor.originalExpression).join(" / ") || "Unresolved"}`, "", event.description, ""];
  }),
  "## Findings and claim ledger",
  "",
  "| Claim | State | Confidence | Current proposition | Evidence citations |",
  "|---|---|---|---|---|",
  ...data.claims.map((claim, index) => {
    const confidence = confidenceById.get(claim.confidenceAssessmentIds[0]);
    return `| CLM-${String(index + 1).padStart(3, "0")} | ${clean(claim.evidenceState.replaceAll("_", " "))} | ${clean(confidence?.descriptor ?? "not assessed")} | ${clean(claimText(claim))} | ${clean(citations(claim.id))} |`;
  }),
  "",
  "## Contradictions and correction status",
  "",
  ...data.contradictions.flatMap((item) => [`### ${item.title}`, "", item.description, "", `**Status:** ${item.status}; **review:** ${item.reviewStatus}.`, "", ...item.alternateExplanations.map((explanation) => `- Retained hypothesis: ${explanation}`), ""]),
  ...(data.correctionLedger?.length ? ["### Correction ledger", "", ...data.correctionLedger.map((item) => `- ${clean(item.summary ?? item.id)}`), ""] : ["### Correction ledger", "", "No correction record is currently active. Superseded claim revisions remain preserved in the package.", ""]),
  "## Spatial reconstruction and measurement gate",
  "",
  data.reconstructionElements.length ? "The package includes a project-authored schematic reconstruction. Measurement remains disabled unless a spatial artifact is separately marked metric-validated." : "No interactive reconstruction is included in this case.",
  "",
  "| Artifact | Type | Frame | Metric validated | Measurement | Validation |",
  "|---|---|---|---|---|---|",
  ...(data.spatialArtifacts?.length ? data.spatialArtifacts.map((artifact) => `| ${clean(artifact.title)} | ${clean(artifact.artifactType)} | ${clean(artifact.coordinateSystem)} | ${artifact.metricValidated ? "yes" : "no"} | ${artifact.measurementEnabled ? "enabled" : "disabled"} | ${clean(artifact.validation.status)} |`) : ["| No artifact | - | - | no | disabled | not available |"]),
  "",
  "## Package integrity",
  "",
  `- Structural validation: **${data.integritySummary?.structuralValidation ?? "passed"}**.`,
  `- Evidentiary authentication: **${data.integritySummary?.evidentiaryAuthentication ?? "limited"}**.`,
  `- Claim confidence coverage: **${data.integritySummary?.confidenceCoverage ? "complete" : "incomplete"}**.`,
  `- Claim locator coverage: **${data.integritySummary?.locatorCoverage ? "complete" : "incomplete"}**.`,
  `- Source bodies preserved: **${data.integritySummary?.sourceBodiesPreserved ?? 0}** of **${data.sources.length}**.`,
  `- Audit events: **${data.auditEvents.length}**, hash-linked.`,
  `- Signature state: **${data.integritySummary?.signatureStatus ?? "unsigned"}**.`,
  "",
  ...(data.integritySummary?.warnings ?? []).map((warning) => `- Warning: ${warning}`),
  "",
  "## Claim-to-source matrix",
  "",
  "| Claim | Source | Function | Locator | Independence / family |",
  "|---|---|---|---|---|",
  ...data.claimSourceRelationships.map((relationship) => {
    const claimIndex = data.claims.findIndex((claim) => claim.id === relationship.claimId);
    const source = data.sources.find((item) => item.id === relationship.sourceId);
    return `| CLM-${String(claimIndex + 1).padStart(3, "0")} | ${sourceCodes.get(relationship.sourceId)} | ${clean(relationship.function)} | ${clean(relationship.locator?.value)} | ${clean(relationship.independenceNote)} |`;
  }),
  "",
  "## Bibliography and preservation registry",
  "",
  ...data.sources.map((source) => {
    const code = sourceCodes.get(source.id);
    const snapshot = data.sourceSnapshots.find((item) => item.sourceId === source.id);
    const acquisition = data.sourceAcquisitions?.find((item) => item.sourceId === source.id);
    return `- **${code}. ${source.title}.** ${source.publisher}${source.author ? `, ${source.author}` : ""}. Published ${source.publishedAt ?? "date unresolved"}; checked ${source.lastCheckedAt}. ${source.canonicalUrl} Locator: ${source.locators.map((locator) => `${locator.kind}: ${locator.value}`).join("; ")}. Preservation: ${snapshot?.preservationState ?? snapshot?.storageState ?? "unknown"}; metadata fingerprint: ${acquisition?.metadataHash ?? "not recorded"}.`;
  }),
  "",
  "## Rights, privacy, and dignity",
  "",
  ...data.rightsDecisions.map((decision) => `- **${clean(decision.subjectId)}:** ${clean(decision.storagePermission)}; ${clean(decision.exportPermission)}. ${clean(decision.rationale)}`),
  "",
  "## Review record",
  "",
  ...data.editorialReviews.flatMap((review) => [`### ${review.reviewType.replaceAll("_", " ")} review`, "", ...review.findings.map((finding) => `- Finding: ${finding}`), ...review.limitations.map((limitation) => `- Limitation: ${limitation}`), ""]),
  "## Version and change history",
  "",
  ...(data.packageRevisions ?? []).map((revision) => `- Revision ${revision.revisionNumber}, ${revision.createdAt}: ${revision.changeSummary}`),
  "",
  "## Glossary",
  "",
  ...(data.glossary ?? []).map((entry) => `- **${entry.term}:** ${entry.definition}`),
  "",
  "---",
  "",
  "No raw third-party article body, graphic impact media, private address, court-restricted exhibit, or unsupported identity inference is included in this export.",
  "",
];

const absolute = resolve(ROOT, output);
mkdirSync(dirname(absolute), { recursive: true });
writeFileSync(absolute, lines.join("\n"), "utf8");
console.log(`Wrote v2 forensic report ${output}`);
