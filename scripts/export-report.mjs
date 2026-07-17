import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { auditPackage, readJson } from "./lib.mjs";

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) throw new Error("Usage: node scripts/export-report.mjs <package.json> <report.md>");

const data = readJson(input);
const audit = auditPackage(data);
if (!audit.valid) throw new Error(`Report blocked by package audit:\n${audit.issues.join("\n")}`);

const investigation = data.investigations[0];
const claimRevisionById = new Map(data.claimRevisions.map((revision) => [revision.id, revision]));
const sourceById = new Map(data.sources.map((source) => [source.id, source]));
const confidenceById = new Map(data.confidenceAssessments.map((assessment) => [assessment.id, assessment]));

function clean(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

const lines = [
  `# ${investigation.title} — First-Pass Audit`,
  "",
  `Status: **${investigation.status.toUpperCase()}** private review export`,
  `Research cutoff: \`${data.exportedAt}\``,
  `Package: \`${data.packageId}\``,
  `Schema: \`${data.schemaVersion}\``,
  "",
  "> This is a source-linked working analysis, not a finding of guilt, a certified forensic report, a court-admissible reconstruction, or a public-release approval.",
  "",
  "## Scope",
  "",
  investigation.purpose,
  "",
  ...(investigation.scope ?? []).map((item) => `- ${item}`),
  "",
  "## Claims",
  "",
  "| Claim | State | Confidence | Procedural status | Current text | Evidence links |",
  "|---|---|---|---|---|---:|",
  ...data.claims.map((claim, index) => {
    const revision = claimRevisionById.get(claim.currentRevisionId);
    const relationshipCount = data.claimSourceRelationships.filter((relationship) => relationship.claimId === claim.id).length;
    const confidence = confidenceById.get(claim.confidenceAssessmentIds[0]);
    return `| CLM-${String(index + 1).padStart(3, "0")} | ${clean(claim.evidenceState.replaceAll("_", " "))} | ${clean(confidence?.descriptor ?? "not assessed")} | ${clean(claim.proceduralStatus)} | ${clean(revision.text)} | ${relationshipCount} |`;
  }),
  "",
  "## Event timeline",
  "",
  ...data.events.flatMap((event) => {
    const anchors = event.temporalAnchorIds.map((anchorId) => data.temporalAnchors.find((candidate) => candidate.id === anchorId)).filter(Boolean);
    return [`### ${event.title}`, "", `${anchors.map((anchor) => anchor.originalExpression).join(" / ") || "Time unresolved"}`, "", event.description, ""];
  }),
  "## Contradictions and corrections",
  "",
  ...data.contradictions.flatMap((contradiction) => [
    `### ${contradiction.title}`,
    "",
    contradiction.description,
    "",
    `Status: **${contradiction.status}**. Review: **${contradiction.reviewStatus}**.`,
    "",
    "Explanations retained for testing:",
    "",
    ...contradiction.alternateExplanations.map((explanation) => `- ${explanation}`),
    "",
  ]),
  "## Spatial reconstruction",
  "",
  data.reconstructionElements.length
    ? "The package contains a project-authored relational scene. It is schematic and does not claim photogrammetric, geodetic, ballistic, acoustic, identity, or trajectory validation."
    : "No interactive spatial scene is included in this fixture.",
  "",
  "| Anchor | CRS / frame | Display uncertainty | Method |",
  "|---|---|---:|---|",
  ...data.spatialAnchors.map((anchor) => `| ${clean(anchor.label)} | ${clean(anchor.crs)} | ${anchor.uncertaintyMeters} m | ${clean(anchor.method)} |`),
  "",
  "## Sources and exact locators",
  "",
  "| Source | Publisher | Type | Locator | Storage |",
  "|---|---|---|---|---|",
  ...data.sources.map((source) => {
    const snapshot = data.sourceSnapshots.find((candidate) => candidate.sourceId === source.id);
    const locators = source.locators.map((locator) => `${locator.kind}: ${locator.value}`).join("; ");
    return `| [${clean(source.title)}](${source.canonicalUrl}) | ${clean(source.publisher)} | ${clean(source.sourceType)} | ${clean(locators)} | ${clean(snapshot.storageState)} |`;
  }),
  "",
  "## Provenance checks",
  "",
  `- ${data.claimSourceRelationships.length} claim-source relationships contain an evidence function and exact locator.`,
  `- ${data.assetCaptures.length} local project captures matched their recorded SHA-256 and byte size.`,
  `- ${data.assetTransformations.length} transformation records link input and output captures.`,
  `- ${data.auditEvents.length} append-only audit events passed hash-chain verification.`,
  `- ${data.sourceSnapshots.filter((snapshot) => snapshot.contentHash === null).length} source records retain metadata without claiming a remote-body hash.`,
  "",
  "## Rights, privacy, and limitations",
  "",
  ...data.rightsDecisions.map((decision) => {
    const subject = sourceById.get(decision.subjectId)?.title ?? data.assets.find((asset) => asset.id === decision.subjectId)?.title ?? decision.subjectId;
    return `- **${subject}:** ${decision.storagePermission}; ${decision.exportPermission}. ${decision.rationale}`;
  }),
  "",
  "## Editorial and forensic reviews",
  "",
  ...data.editorialReviews.flatMap((review) => [
    `### ${review.reviewType.replaceAll("_", " ")} review`,
    "",
    ...review.findings.map((finding) => `- Finding: ${finding}`),
    ...review.limitations.map((limitation) => `- Limitation: ${limitation}`),
    "",
  ]),
  "## Open questions",
  "",
  ...data.claims.flatMap((claim) => claim.unresolvedQuestions.map((question) => `- ${question}`)),
  "",
  "No raw third-party article body, press photograph, graphic impact video, surveillance pixel, private address, or court-restricted exhibit is included in this export.",
  "",
];

const absolute = resolve(output);
mkdirSync(dirname(absolute), { recursive: true });
writeFileSync(absolute, lines.join("\n"), "utf8");
console.log(`Wrote deterministic report ${output}`);
