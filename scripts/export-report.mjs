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
const lines = [
  "# Apollo 11 Landing-Time Audit",
  "",
  `Status: ${investigation.status.toUpperCase()} private review export`,
  `Package: \`${data.packageId}\``,
  `Schema: \`${data.schemaVersion}\``,
  `Exported: \`${data.exportedAt}\``,
  "",
  "## Scope",
  "",
  investigation.purpose,
  "",
  "No NASA source body or media is included. This report does not select a physically exact touchdown second.",
  "",
  "## Claims",
  "",
  "| Claim ID | State | Current text | Evidence relationships |",
  "|---|---|---|---:|",
  ...data.claims.map((claim) => {
    const revision = claimRevisionById.get(claim.currentRevisionId);
    const count = data.claimSourceRelationships.filter((relationship) => relationship.claimId === claim.id).length;
    return `| \`${claim.id}\` | ${claim.evidenceState.replaceAll("_", " ")} | ${revision.text.replaceAll("|", "\\|")} | ${count} |`;
  }),
  "",
  "## Temporal discrepancy",
  "",
  ...data.contradictions.flatMap((contradiction) => [
    `### ${contradiction.title}`,
    "",
    contradiction.description,
    "",
    `Status: **${contradiction.status}**. Review: **${contradiction.reviewStatus}**.`,
    "",
    "Alternate explanations:",
    "",
    ...contradiction.alternateExplanations.map((explanation) => `- ${explanation}`),
    "",
  ]),
  "## Sources and locators",
  "",
  "| Source | Publisher | Locator | Storage |",
  "|---|---|---|---|",
  ...data.sources.map((source) => {
    const snapshot = data.sourceSnapshots.find((candidate) => candidate.sourceId === source.id);
    const locators = source.locators.map((locator) => `${locator.kind}: ${locator.value}`).join("; ");
    return `| [${source.title}](${source.canonicalUrl}) | ${source.publisher} | ${locators} | ${snapshot.storageState} |`;
  }),
  "",
  "## Provenance checks",
  "",
  `- ${data.assetCaptures.length} local captures matched recorded SHA-256 and byte size.`,
  `- ${data.assetTransformations.length} transformation records link input and output captures.`,
  `- ${data.auditEvents.length} append-only audit events passed hash-chain verification.`,
  `- ${data.claimSourceRelationships.length} claim-source relationships include an exact function and locator.`,
  "",
  "## Rights and limitations",
  "",
  ...data.rightsDecisions.map((decision) => {
    const subject = sourceById.get(decision.subjectId)?.title ?? decision.subjectId;
    return `- **${subject}:** ${decision.storagePermission}; ${decision.exportPermission}. ${decision.rationale}`;
  }),
  "",
  "## Open questions",
  "",
  ...data.claims.flatMap((claim) => claim.unresolvedQuestions.map((question) => `- ${question}`)),
  "",
  "This is a WORKING prototype report, not a certified forensic or court-admissible package.",
  "",
];

const absolute = resolve(output);
mkdirSync(dirname(absolute), { recursive: true });
writeFileSync(absolute, lines.join("\n"), "utf8");
console.log(`Wrote deterministic report ${output}`);
