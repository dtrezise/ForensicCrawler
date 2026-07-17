import { Buffer } from "node:buffer";
import { canonicalStringify, sealAuditEvents, sha256, writeJson } from "./lib.mjs";

const CREATED = "2026-07-17T18:00:00Z";
const CUTOFF = "2026-07-17T18:00:00Z";

function id(prefix, value) {
  return `fc_${prefix}_00000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
}

const I = {
  package: id("pkg", 501),
  investigation: id("inv", 501),
  asset: id("ast", 501),
  captureInput: id("cap", 501),
  captureScene: id("cap", 502),
  transformation: id("xfm", 501),
};

const sourceDefinitions = [
  {
    key: "lead_ig",
    title: "Operation Southern Spear, Report to Congress, January 1-March 31, 2026",
    publisher: "Lead Inspectors General of the Departments of War and State",
    sourceType: "official_report",
    url: "https://media.defense.gov/2026/May/21/2003935694/-1/-1/1/OSS_Q2_MAR2026_FINAL_508.PDF",
    publishedAt: "2026-05-21T00:00:00Z",
    locator: "Strikes and Interdictions, page 10; legal basis, oversight, survivor, and campaign-limit sections",
    rights: "government_work_review",
  },
  {
    key: "southcom_archive",
    title: "U.S. Southern Command press-release archive",
    publisher: "U.S. Southern Command",
    sourceType: "official_web_record",
    url: "https://www.southcom.mil/News/PressReleases/Tag/321528/kinetic-strike/",
    publishedAt: null,
    locator: "Public vessel-strike releases through June 21, 2026",
    rights: "government_work_review",
  },
  {
    key: "southcom_jun21",
    title: "Lethal Kinetic Strike, June 21, 2026",
    publisher: "U.S. Southern Command",
    sourceType: "official_web_record",
    url: "https://www.southcom.mil/News/PressReleases/Article/4522545/lethal-kinetic-strike-june-21-2026/",
    publishedAt: "2026-06-21T00:00:00Z",
    locator: "Caribbean vessel, claimed target status, two reported deaths, six survivors, and SAR notification",
    rights: "government_work_review",
  },
  {
    key: "dvids_jun21",
    title: "Lethal Kinetic Strike, June 21, 2026 - published video record",
    publisher: "Defense Visual Information Distribution Service",
    sourceType: "media",
    url: "https://www.dvidshub.net/video/1011842/lethal-kinetic-strike-june-21-2026",
    publishedAt: "2026-06-21T00:00:00Z",
    locator: "Edited government publication metadata and short video; remote bytes excluded",
    rights: "government_work_review",
  },
  {
    key: "southcom_jan23",
    title: "Lethal Kinetic Strike, January 23, 2026",
    publisher: "U.S. Southern Command",
    sourceType: "official_web_record",
    url: "https://www.southcom.mil/News/PressReleases/Article/4388870/lethal-kinetic-strike-jan-23-2026/",
    publishedAt: "2026-01-23T00:00:00Z",
    locator: "Two reported deaths, one survivor, and SAR notification",
    rights: "government_work_review",
  },
  {
    key: "southcom_mar19",
    title: "Lethal Kinetic Strike, March 19, 2026",
    publisher: "U.S. Southern Command",
    sourceType: "official_web_record",
    url: "https://www.southcom.mil/News/PressReleases/Article/4439576/lethal-kinetic-strike-march-19-2026/",
    publishedAt: "2026-03-20T00:00:00Z",
    locator: "Eastern Pacific vessel and three survivors with SAR notification",
    rights: "government_work_review",
  },
  {
    key: "ap_current",
    title: "US strike on an alleged drug boat kills 2, leaves 6 survivors, in the Caribbean",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/d97e406d3cb2b0246a5d055a58a338b6",
    publishedAt: "2026-06-22T03:16:43Z",
    locator: "Current aggregate, June 21 incident, evidence limits, survivor uncertainty, and correction note",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_timeline",
    title: "Timeline of U.S. strikes on alleged drug boats",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/trump-boat-strikes-caribbean-military-venezuela-timeline-2dd9d16f4f74d9dfa4aca76d3123678d",
    publishedAt: null,
    locator: "Early campaign chronology and incident-counting context",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_conflict",
    title: "Trump administration tells Congress the U.S. is in armed conflict with cartels",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/cb57804807e55a00ace60ad5f4d4f24d",
    publishedAt: "2025-10-02T00:00:00Z",
    locator: "Administration armed-conflict characterization and unlawful-combatant terminology",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_oct14",
    title: "US kills 6 people in strike on boat accused of carrying drugs near Venezuela",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/af1a784864268707a76755a98615563e",
    publishedAt: "2025-10-14T17:52:04Z",
    locator: "October 14 U.S. assertions, location description, casualties, and published-video description",
    rights: "ordinary_copyright",
  },
  {
    key: "iachr",
    title: "IACHR urges the United States to ensure respect for human rights in extraterritorial security operations",
    publisher: "Inter-American Commission on Human Rights",
    sourceType: "official_web_record",
    url: "https://www.oas.org/en/IACHR/jsForm/?File=%2Fen%2Fiachr%2Fmedia_center%2FPReleases%2F2025%2F248.asp",
    publishedAt: "2025-12-02T00:00:00Z",
    locator: "Institutional human-rights assessment, early chronology, and accountability recommendations",
    rights: "unknown",
  },
  {
    key: "ohchr",
    title: "Special Procedures communication AL USA 30/2025",
    publisher: "United Nations Office of the High Commissioner for Human Rights",
    sourceType: "official_report",
    url: "https://spcommreports.ohchr.org/TMResultsBase/DownLoadPublicCommunicationFile?gId=30350",
    publishedAt: null,
    locator: "Concerns regarding the August order and September 2 strike under human-rights and international-law frameworks",
    rights: "unknown",
  },
  {
    key: "burnley_complaint",
    title: "Burnley v. United States - Complaint",
    publisher: "U.S. District Court for the District of Massachusetts via ACLU of Massachusetts",
    sourceType: "official_report",
    url: "https://www.aclum.org/app/uploads/2026/01/1-2.pdf",
    publishedAt: "2026-01-27T00:00:00Z",
    locator: "Case 1:26-cv-10364, Document 1, allegations concerning two October 14 decedents",
    rights: "ordinary_copyright",
  },
  {
    key: "burnley_docket",
    title: "Burnley v. United States docket",
    publisher: "CourtListener",
    sourceType: "other",
    url: "https://www.courtlistener.com/docket/72191479/burnley-v-united-states/",
    publishedAt: null,
    locator: "Civil Action 1:26-cv-10364 procedural docket through July 17, 2026",
    rights: "ordinary_copyright",
  },
  {
    key: "video_bill",
    title: "S.3539 - September 2 vessel-strike video release bill",
    publisher: "United States Congress",
    sourceType: "official_web_record",
    url: "https://www.congress.gov/bill/119th-congress/senate-bill/3539/text",
    publishedAt: "2025-12-17T00:00:00Z",
    locator: "Proposed congressional and public release of unedited September 2 video",
    rights: "government_work_review",
  },
  {
    key: "targeting_oig",
    title: "Evaluation of U.S. Southern Command Joint Targeting Cycle Procedures",
    publisher: "Department of War Office of Inspector General",
    sourceType: "official_web_record",
    url: "https://www.dodig.mil/Reports/Audits-and-Evaluations/Article/4486668/project-announcement-evaluation-of-us-southern-command-joint-targeting-cycle-pr/",
    publishedAt: "2026-05-11T00:00:00Z",
    locator: "Ongoing review scope and express exclusion of legal-authority review",
    rights: "government_work_review",
  },
  {
    key: "war_powers_report",
    title: "Presidential War Powers report of September 4, 2025",
    publisher: "Executive Office of the President via GovInfo",
    sourceType: "official_report",
    url: "https://www.govinfo.gov/content/pkg/CDOC-119hdoc92/pdf/CDOC-119hdoc92.pdf",
    publishedAt: "2025-09-04T00:00:00Z",
    locator: "Article II and self-defense rationale reported to Congress",
    rights: "government_work_review",
  },
  {
    key: "unclos_territorial",
    title: "United Nations Convention on the Law of the Sea - Part II, Territorial Sea",
    publisher: "United Nations Division for Ocean Affairs and the Law of the Sea",
    sourceType: "policy",
    url: "https://www.un.org/depts/los/convention_agreements/texts/unclos/part2.htm",
    publishedAt: null,
    locator: "Territorial-sea breadth and baseline framework",
    rights: "unknown",
  },
  {
    key: "unclos_high_seas",
    title: "United Nations Convention on the Law of the Sea - Part VII, High Seas",
    publisher: "United Nations Division for Ocean Affairs and the Law of the Sea",
    sourceType: "policy",
    url: "https://www.un.org/depts/los/convention_agreements/texts/unclos/part7.htm",
    publishedAt: null,
    locator: "High-seas scope and treatment of persons in danger at sea",
    rights: "unknown",
  },
  {
    key: "noaa_zones",
    title: "What is the law of the sea?",
    publisher: "National Oceanic and Atmospheric Administration",
    sourceType: "official_web_record",
    url: "https://oceanservice.noaa.gov/facts/lawofsea.html",
    publishedAt: null,
    locator: "Plain-language distinctions among territorial sea, EEZ, and high seas",
    rights: "government_work_review",
  },
];

const registriesByOrigin = new Map();
for (const source of sourceDefinitions) {
  const parsed = new URL(source.url);
  const origin = parsed.origin;
  const path = parsed.pathname.split("/").slice(0, 3).join("/") || "/";
  if (!registriesByOrigin.has(origin)) {
    registriesByOrigin.set(origin, {
      id: id("reg", registriesByOrigin.size + 501),
      displayName: parsed.hostname,
      canonicalOrigin: origin,
      allowedPaths: [path],
      purpose: "Human-reviewed public-source metadata and exact locators for the private vessel-strike campaign fixture.",
      accessClass: "manual_metadata_only",
      status: "approved_metadata_only",
      rightsMode: source.rights === "government_work_review" ? "government_work_review" : "link_only",
      storageMode: "no_bytes",
      networkUseApproved: false,
      ownerRole: "source-scope reviewer",
      reviewedAt: CREATED,
      expiresAt: "2026-10-17T18:00:00Z",
      createdAt: CREATED,
    });
  } else {
    const registry = registriesByOrigin.get(origin);
    registry.allowedPaths = [...new Set([...registry.allowedPaths, path])];
  }
}

const sourceMap = new Map();
const sources = sourceDefinitions.map((definition, index) => {
  const value = index + 501;
  const record = {
    id: id("src", value),
    registryEntryId: registriesByOrigin.get(new URL(definition.url).origin).id,
    title: definition.title,
    publisher: definition.publisher,
    author: null,
    publishedAt: definition.publishedAt,
    sourceType: definition.sourceType,
    canonicalUrl: definition.url,
    retrievedAt: CUTOFF,
    lastCheckedAt: CUTOFF,
    rightsDecisionId: id("rgt", value),
    locators: [{ kind: "section", value: definition.locator, label: definition.locator }],
    createdAt: CREATED,
  };
  sourceMap.set(definition.key, { ...definition, sourceId: record.id, snapshotId: id("snap", value) });
  return record;
});

const sourceSnapshots = sourceDefinitions.map((definition, index) => ({
  id: id("snap", index + 501),
  sourceId: id("src", index + 501),
  checkedAt: CUTOFF,
  url: definition.url,
  httpStatus: null,
  contentHash: null,
  storageState: "metadata_only",
  limitations: "URL, publication metadata, exact locator, and restrained paraphrase only. No remote response body, source video, image, or pleading bytes are retained.",
  createdAt: CREATED,
}));

const rightsDecisions = sourceDefinitions.map((definition, index) => ({
  id: id("rgt", index + 501),
  subjectType: "source",
  subjectId: id("src", index + 501),
  rightsStatus: definition.rights,
  storagePermission: "metadata_only",
  displayPermission: "private_metadata",
  exportPermission: "metadata_only",
  rationale: "Public availability does not establish completeness, authenticity, reuse permission, or evidentiary weight. Retain metadata, locators, and restrained factual paraphrase only.",
  reviewedAt: CREATED,
  reviewerRole: "rights-privacy compliance editor",
  basisUrls: [definition.url],
  createdAt: CREATED,
}));

const entityDefinitions = [
  ["Operation Southern Spear vessel-strike campaign", "concept"],
  ["U.S. Southern Command", "organization"],
  ["Joint Task Force Southern Spear", "organization"],
  ["U.S. Coast Guard", "organization"],
  ["Caribbean Sea campaign area", "place"],
  ["Eastern Pacific campaign area", "place"],
  ["June 21, 2026 targeted vessel", "vehicle"],
  ["October 14, 2025 targeted vessel", "vehicle"],
  ["Burnley v. United States", "concept"],
  ["People aboard targeted vessels", "concept"],
  ["Inter-American Commission on Human Rights", "organization"],
  ["UN Special Procedures mandate holders", "organization"],
];
const entities = entityDefinitions.map(([canonicalName, entityType], index) => ({
  id: id("ent", index + 501), investigationId: I.investigation, canonicalName, entityType, aliases: [], createdAt: CREATED,
}));
const E = Object.fromEntries(entities.map((entity, index) => [index + 1, entity.id]));

const temporalDefinitions = [
  ["First publicly announced vessel strike", "September 2, 2025", null, 86400, "ap_timeline", "First campaign entry"],
  ["October 14 challenged strike", "October 14, 2025", null, 86400, "ap_oct14", "October 14 incident"],
  ["Operation Southern Spear formally announced", "November 13, 2025", null, 86400, "lead_ig", "Campaign overview"],
  ["January 23 survivor incident", "January 23, 2026", null, 86400, "southcom_jan23", "Press release"],
  ["Lead IG aggregate cutoff", "March 31, 2026", null, 86400, "lead_ig", "Report period end"],
  ["March 19 survivor incident", "March 19, 2026", null, 86400, "southcom_mar19", "Press release"],
  ["June 21 Caribbean incident", "June 21, 2026", null, 86400, "southcom_jun21", "Press release"],
  ["AP current aggregate", "June 22, 2026 publication", "2026-06-22T03:16:43Z", 1, "ap_current", "Publication timestamp"],
  ["Targeting-cycle evaluation announced", "May 11, 2026", null, 86400, "targeting_oig", "Project announcement"],
  ["Research cutoff", "July 17, 2026", null, 86400, "southcom_archive", "Archive review cutoff"],
].map(([label, originalExpression, normalizedUtc, precisionSeconds, sourceKey, locator], index) => ({
  id: id("tmp", index + 501),
  investigationId: I.investigation,
  label,
  originalExpression,
  normalizedUtc,
  missionElapsedSeconds: null,
  timeSystem: normalizedUtc ? "utc" : "unknown",
  precisionSeconds,
  uncertaintyLowerSeconds: precisionSeconds,
  uncertaintyUpperSeconds: precisionSeconds,
  conversionRationale: normalizedUtc
    ? "The publisher supplies a UTC publication timestamp; it is not the strike time."
    : "The public source supplies a calendar date without a reliable time of day; no exact event instant is invented.",
  sourceId: sourceMap.get(sourceKey).sourceId,
  locator: { kind: "other", value: locator },
  createdAt: CREATED,
}));
const T = Object.fromEntries(temporalDefinitions.map((anchor, index) => [index + 1, anchor.id]));

const claimDefinitions = [
  { text: "The public vessel-strike campaign began with a U.S.-announced attack on September 2, 2025 and later operated under the name Operation Southern Spear.", state: "independently_corroborated", status: "Campaign boundary for this package; land strikes, tanker seizures, interdictions, and the separate Venezuela operation are excluded.", entities: [1, 2, 3, 5, 10], confidence: "high", sources: [["lead_ig", "supports"], ["ap_timeline", "contextualizes"]], questions: [] },
  { text: "U.S. officials asserted that the September 2 vessel departed Venezuela, was operated by Tren de Aragua, carried narcotics, and that eleven people were killed.", state: "attributed_unverified", status: "Attributed U.S. target, cargo, affiliation, origin, and casualty assertions; no underlying public target packet is included.", entities: [1, 2, 5, 10], confidence: "moderate", sources: [["lead_ig", "contextualizes"], ["ap_timeline", "supports"], ["war_powers_report", "contextualizes"]], questions: ["What independently verifiable evidence identifies the vessel, occupants, cargo, affiliation, route, and exact position?"] },
  { text: "Later official briefings and reporting state that nine people were killed in the first September 2 strike and two survivors clinging to wreckage were killed in a follow-on strike.", state: "independently_corroborated", status: "The existence of a follow-on strike is acknowledged; the survivors' legal status, orders, necessity, and legality remain disputed and unadjudicated.", entities: [1, 2, 10], confidence: "moderate", sources: [["lead_ig", "supports"], ["ap_current", "supports"], ["video_bill", "contextualizes"]], questions: ["What does the complete, unedited sensor record show between the two strikes?", "What orders, threat assessment, and survivor procedures governed the follow-on strike?"] },
  { text: "The administration reported Article II and self-defense grounds and later characterized the United States as being in a non-international armed conflict with designated cartels or drug-trafficking organizations.", state: "attributed_unverified", status: "Attributed legal position, not a judicial holding or independent legality finding.", entities: [1, 2], confidence: "high", sources: [["war_powers_report", "supports"], ["ap_conflict", "supports"], ["lead_ig", "contextualizes"]], questions: ["What is the complete public legal analysis and its incident-specific application?"] },
  { text: "Operation Southern Spear was formally announced in November 2025, after the first vessel strikes had already occurred.", state: "authenticated_official_record", status: "Naming and chronology, not an assessment of authority or legality.", entities: [1, 2, 3], confidence: "high", sources: [["lead_ig", "supports"]], questions: [] },
  { text: "SOUTHCOM told the Lead Inspector General that it could not provide a publicly releasable accounting of all strikes and interdictions under Operation Southern Spear.", state: "authenticated_official_record", status: "Controlling completeness limit for every aggregate and incident register in this package.", entities: [1, 2, 3], confidence: "high", sources: [["lead_ig", "supports"]], questions: ["Will SOUTHCOM publish a canonical incident and vessel ledger with correction history?"] },
  { text: "The Lead Inspector General reported that public reporting indicated at least 47 boats were struck between September 2025 and March 2026, with 156 people killed or presumed dead through March 31.", state: "authenticated_official_record", status: "Official oversight report quoting a public-reporting aggregate, not a complete SOUTHCOM strike ledger.", entities: [1, 2, 5, 6, 10], confidence: "high", sources: [["lead_ig", "supports"]], questions: ["Which specific vessels and casualty-status changes compose the 47 and 156 totals?"] },
  { text: "The Lead Inspector General reported that approximately two-thirds of the strikes through March 31 occurred in the eastern Pacific and one-third in the Caribbean.", state: "authenticated_official_record", status: "Basin-level aggregate only; exact coordinates are not supplied.", entities: [1, 5, 6], confidence: "high", sources: [["lead_ig", "supports"]], questions: [] },
  { text: "A record-by-record minimum reconciliation yields at least 66 vessels through June 21 by adding 19 publicly announced April-June vessels to the Lead IG's 47-boat cutoff.", state: "inferred", status: "Derived lower bound, not an official campaign total; strike, engagement, and vessel counts can diverge.", entities: [1, 2, 5, 6], confidence: "moderate", sources: [["lead_ig", "supports"], ["southcom_archive", "supports"]], questions: ["Does a later authoritative ledger confirm the 66-vessel lower bound and its counting unit?"] },
  { text: "Associated Press reported more than 60 attacks and more than 210 people killed by June 22, 2026.", state: "independently_corroborated", status: "Publisher aggregate with its own cutoff and counting rules; it is not silently merged with the Lead IG aggregate.", entities: [1, 5, 6, 10], confidence: "high", sources: [["ap_current", "supports"]], questions: ["How does the publisher count multiple vessels, follow-on strikes, missing persons, and presumed deaths?"] },
  { text: "No single unqualified campaign death total is supportable because public sources use different cutoffs and distinguish immediate deaths, later missing persons, survivors, and presumed deaths differently.", state: "inferred", status: "Editorial counting rule: preserve each source's number, cutoff, unit, and casualty categories.", entities: [1, 10], confidence: "high", sources: [["lead_ig", "supports"], ["ap_current", "supports"], ["southcom_archive", "contextualizes"]], questions: ["Which survivors were later rescued, detained, repatriated, or presumed dead?"] },
  { text: "The documented campaign spans the Caribbean Sea and eastern Pacific Ocean; describing all vessel strikes as bombings in Venezuela is geographically overbroad.", state: "independently_corroborated", status: "Some early incidents were described as near, off, or involving routes from Venezuela, but the campaign is not confined to Venezuelan territory.", entities: [1, 5, 6], confidence: "high", sources: [["lead_ig", "supports"], ["ap_current", "supports"]], questions: [] },
  { text: "U.S. releases often characterize incidents as occurring in international waters, but most public releases do not supply exact coordinates, datum, or a legally precise maritime-zone determination.", state: "attributed_unverified", status: "International-waters wording remains an attributed location claim, not a geospatial solution.", entities: [1, 2, 5, 6], confidence: "high", sources: [["lead_ig", "contextualizes"], ["southcom_archive", "supports"], ["ap_oct14", "contextualizes"]], questions: ["What coordinates, datum, coastal baselines, and boundary data apply to each event?"] },
  { text: "Without exact coordinates and applicable baselines, the public record cannot distinguish territorial sea, exclusive economic zone outside territorial sea, and high seas for the reconstructed incident cell.", state: "inferred", status: "Legal-geospatial analysis boundary; no circular Venezuela-zone graphic is treated as a finding.", entities: [5, 6, 7], confidence: "high", sources: [["unclos_territorial", "supports"], ["unclos_high_seas", "supports"], ["noaa_zones", "contextualizes"]], questions: ["Can authoritative coordinates and baseline-vintage records be lawfully obtained?"] },
  { text: "SOUTHCOM stated that its June 21 Caribbean strike killed two men, left six male survivors, and triggered notification to the Coast Guard search-and-rescue system.", state: "attributed_unverified", status: "Attributed official casualty, target, and SAR account; the release did not report a final rescue outcome.", entities: [2, 3, 4, 5, 7, 10], confidence: "high", sources: [["southcom_jun21", "supports"], ["ap_current", "contextualizes"]], questions: ["Were the six survivors located, rescued, detained, transferred, or later presumed dead?"] },
  { text: "The June 21 release asserts the vessel was operated by a designated terrorist organization and engaged in narcotics trafficking, while the public materials reviewed do not disclose the underlying intelligence or cargo evidence.", state: "disputed", status: "Target and cargo assertions remain attributed; absence of public evidence is not proof that no classified evidence exists.", entities: [2, 3, 7, 10], confidence: "moderate", sources: [["southcom_jun21", "supports"], ["ap_current", "contradicts"], ["lead_ig", "contextualizes"]], questions: ["What reviewable evidence supports the vessel, occupant, cargo, route, and organization classifications?"] },
  { text: "The June 21 DVIDS item is an edited government publication, not a preserved native sensor record with public coordinates, camera calibration, platform telemetry, or munition metadata.", state: "authenticated_official_record", status: "Publication-provenance fact and missing-data boundary; the video bytes are excluded from this fixture.", entities: [2, 3, 7], confidence: "high", sources: [["dvids_jun21", "supports"], ["southcom_jun21", "contextualizes"]], questions: ["Do native, authenticated files and a complete derivative history exist for qualified review?"] },
  { text: "U.S. officials reported that an October 14, 2025 strike in waters off Venezuela killed six people and asserted the vessel was trafficking narcotics in international waters.", state: "attributed_unverified", status: "Attributed official account of the incident later challenged in civil litigation.", entities: [2, 5, 8, 10], confidence: "high", sources: [["ap_oct14", "supports"], ["ap_timeline", "contextualizes"]], questions: ["What exact location, vessel identity, cargo record, target packet, and occupant identities support the account?"] },
  { text: "The Burnley complaint alleges that two people killed in the October 14 strike were Trinidadian fishermen and farmworkers returning home from Venezuela and were not drug traffickers.", state: "disputed", status: "Plaintiffs' allegations in pending civil litigation; no merits finding has resolved them.", entities: [8, 9, 10], confidence: "moderate", sources: [["burnley_complaint", "supports"], ["burnley_docket", "contextualizes"], ["ap_oct14", "contradicts"]], questions: ["What evidence will be admitted, contested, or withheld if the case reaches merits discovery?"] },
  { text: "Burnley v. United States remained pending without a merits ruling at the July 17, 2026 research cutoff.", state: "authenticated_official_record", status: "Procedural status only; allegations and defenses are not findings.", entities: [9], confidence: "high", sources: [["burnley_docket", "supports"]], questions: ["How will estate proceedings and sovereign-immunity arguments affect the case?"] },
  { text: "The IACHR called for the United States to protect the right to life, due process, and accountability and to investigate deaths and detentions arising from the extraterritorial operations.", state: "authenticated_official_record", status: "Institutional human-rights assessment and recommendation, not a court judgment.", entities: [1, 10, 11], confidence: "high", sources: [["iachr", "supports"]], questions: [] },
  { text: "UN Special Procedures mandate holders expressed concern that the August authorization and September 2 strike could involve serious violations of the right to life and other international obligations.", state: "authenticated_official_record", status: "Institutional communication requesting information; not an adjudication.", entities: [1, 10, 12], confidence: "high", sources: [["ohchr", "supports"]], questions: [] },
  { text: "The Department of War Inspector General announced an evaluation of SOUTHCOM targeting-cycle procedures but expressly did not frame it as a review of the strikes' legality.", state: "authenticated_official_record", status: "Ongoing procedural oversight; no completed legality finding was identified.", entities: [1, 2, 3], confidence: "high", sources: [["targeting_oig", "supports"], ["lead_ig", "contextualizes"]], questions: ["What findings, recommendations, and incident sample will the completed evaluation publish?"] },
  { text: "No public complete strike ledger, target packets, incident coordinates, native sensor files, completed campaign-legality investigation, or court merits judgment was identified through July 17, 2026.", state: "unresolved", status: "Search-negative first-pass boundary, subject to correction as records emerge.", entities: [1, 2, 3, 9], confidence: "moderate", sources: [["lead_ig", "supports"], ["southcom_archive", "contextualizes"], ["burnley_docket", "contextualizes"], ["targeting_oig", "contextualizes"]], questions: ["Which records can be released without compromising lawful security interests or personal dignity?"] },
];

const claims = [];
const claimRevisions = [];
const confidenceAssessments = [];
const claimSourceRelationships = [];
let relationshipCounter = 501;
claimDefinitions.forEach((definition, index) => {
  const value = index + 501;
  const claimId = id("clm", value);
  const revisionId = id("clmr", value);
  const confidenceId = id("conf", value);
  claims.push({
    id: claimId,
    investigationId: I.investigation,
    currentRevisionId: revisionId,
    entityIds: definition.entities.map((number) => E[number]),
    evidenceState: definition.state,
    proceduralStatus: definition.status,
    confidenceAssessmentIds: [confidenceId],
    unresolvedQuestions: definition.questions,
    createdAt: CREATED,
  });
  claimRevisions.push({ id: revisionId, claimId, revisionNumber: 1, text: definition.text, claimant: "forensic integration editor", changeReason: "Initial source-bounded campaign claim", createdAt: CREATED });
  const bounds = definition.confidence === "high" ? [0.8, 0.95] : definition.confidence === "moderate" ? [0.5, 0.79] : [0.2, 0.49];
  confidenceAssessments.push({
    id: confidenceId,
    subjectType: "claim",
    subjectId: claimId,
    descriptor: definition.confidence,
    lowerBound: bounds[0],
    upperBound: bounds[1],
    method: "Structured source-independence, attribution, completeness, and procedural-posture review",
    rationale: definition.status,
    uncertainty: definition.questions,
    assessedAt: CREATED,
    assessorRole: "forensic integration editor",
    createdAt: CREATED,
  });
  for (const [sourceKey, relationshipFunction] of definition.sources) {
    const source = sourceMap.get(sourceKey);
    claimSourceRelationships.push({
      id: id("rel", relationshipCounter++),
      claimId,
      sourceId: source.sourceId,
      sourceSnapshotId: source.snapshotId,
      function: relationshipFunction,
      locator: { kind: "section", value: source.locator },
      rationale: `Source is linked only for the stated ${relationshipFunction} function; publication does not collapse attribution or prove completeness.`,
      independenceNote: sourceKey.startsWith("southcom") || sourceKey === "lead_ig" || sourceKey === "war_powers_report" ? "U.S. government source family; not independent of the underlying operation." : "Separate publisher or institution; its reliance on government statements is preserved where applicable.",
      createdAt: CREATED,
    });
  }
});
const C = Object.fromEntries(claims.map((claim, index) => [index + 1, claim.id]));

const spatialAnchors = [
  {
    id: id("spa", 501), investigationId: I.investigation, label: "Caribbean campaign area - basin only",
    geometry: { type: "qualitative_region", basin: "Caribbean Sea", exactCoordinates: null }, crs: "UNRESOLVED_MARITIME_ZONE", uncertaintyMeters: 1000000,
    method: "Basin label from public reporting; no centroid, route, target point, or operational geometry claimed.", sourceRelationshipIds: claimSourceRelationships.filter((item) => item.claimId === C[12]).map((item) => item.id), createdAt: CREATED,
  },
  {
    id: id("spa", 502), investigationId: I.investigation, label: "Eastern Pacific campaign area - basin only",
    geometry: { type: "qualitative_region", basin: "Eastern Pacific Ocean", exactCoordinates: null }, crs: "UNRESOLVED_MARITIME_ZONE", uncertaintyMeters: 1000000,
    method: "Basin label from public reporting; no centroid, route, target point, or operational geometry claimed.", sourceRelationshipIds: claimSourceRelationships.filter((item) => item.claimId === C[8]).map((item) => item.id), createdAt: CREATED,
  },
  {
    id: id("spa", 503), investigationId: I.investigation, label: "June 21 event-local vessel cell",
    geometry: { type: "local_frame", origin: "apparent vessel centroid", heading: "unknown", scale: "unknown", coordinates: null }, crs: "EVENT_LOCAL_V1", uncertaintyMeters: 100000,
    method: "Unitless non-georeferenced event cell. Maritime-zone hypotheses remain mutually exclusive and unresolved.", sourceRelationshipIds: claimSourceRelationships.filter((item) => [C[14], C[15], C[16]].includes(item.claimId)).map((item) => item.id), createdAt: CREATED,
  },
];

const observations = [
  { description: "The Lead IG public aggregate places roughly two-thirds of strikes through March in the eastern Pacific and one-third in the Caribbean.", state: "authenticated_official_record", source: "lead_ig", entities: [1, 5, 6], temporal: [5], spatial: [1, 2] },
  { description: "The June 21 SOUTHCOM release reports two deaths, six survivors, and notification of the Coast Guard SAR system.", state: "attributed_unverified", source: "southcom_jun21", entities: [2, 3, 4, 7, 10], temporal: [7], spatial: [3] },
  { description: "The DVIDS publication exposes an edited public video record but not native sensor telemetry, coordinates, camera calibration, platform, or munition metadata.", state: "authenticated_official_record", source: "dvids_jun21", entities: [2, 3, 7], temporal: [7], spatial: [3] },
  { description: "AP reports that the June 21 public statement did not provide evidence that the vessel carried drugs.", state: "independently_corroborated", source: "ap_current", entities: [7, 10], temporal: [7, 8], spatial: [3] },
  { description: "The Burnley complaint contests the U.S. characterization of two people allegedly killed in the October 14 strike.", state: "disputed", source: "burnley_complaint", entities: [8, 9, 10], temporal: [2], spatial: [1] },
  { description: "The public SOUTHCOM kinetic-strike archive reviewed through July 17 shows June 21 as the latest vessel-strike release located for this first pass.", state: "unresolved", source: "southcom_archive", entities: [1, 2, 3], temporal: [7, 10], spatial: [] },
].map((definition, index) => ({
  id: id("obs", index + 501),
  investigationId: I.investigation,
  description: definition.description,
  evidenceState: definition.state,
  sourceId: sourceMap.get(definition.source).sourceId,
  assetId: null,
  entityIds: definition.entities.map((number) => E[number]),
  locators: [{ kind: "section", value: sourceMap.get(definition.source).locator }],
  temporalAnchorIds: definition.temporal.map((number) => T[number]),
  spatialAnchorIds: definition.spatial.map((number) => spatialAnchors[number - 1].id),
  createdAt: CREATED,
}));

const sceneInputs = {
  schema: "forensic-crawler/reconstruction-inputs/1.0.0",
  investigationId: I.investigation,
  event: "June 21, 2026 public-release comparison cell",
  coordinateSystem: "EVENT_LOCAL_V1",
  evidentiaryPurpose: "Visualize provenance, reported state transitions, survivor/SAR uncertainty, and unresolved maritime-zone hypotheses without depicting impact or operational targeting geometry.",
  controls: {
    georeferenced: false,
    metricScale: false,
    sourcePixelsRetained: false,
    graphicContentRetained: false,
    platformInference: false,
    munitionInference: false,
    routeInference: false,
    personIdentification: false,
  },
  sourceKeys: ["lead_ig", "southcom_jun21", "dvids_jun21", "ap_current", "unclos_territorial", "unclos_high_seas", "noaa_zones"],
  unknowns: ["strike coordinates", "event time", "true vessel dimensions", "heading and speed", "camera model and pose", "platform and munition", "cargo and occupant identities", "final survivor outcome", "maritime legal zone"],
};

const reconstructionScene = {
  schema: "forensic-crawler/reconstruction-scene/1.0.0",
  title: "June 21 maritime event cell - qualitative source-state reconstruction",
  status: "working_non_metric",
  coordinateSystem: { id: "EVENT_LOCAL_V1", units: "arbitrary", georeferenced: false, northAligned: false, origin: "Apparent vessel centroid in a selected pre-event publication frame" },
  calibration: { metricScale: false, cameraPose: false, georeference: false, nativeClock: false, multiView: false, sensorModel: false },
  layers: [
    { id: "context", label: "Illustrative maritime context", class: "illustrative", color: "#183b4b" },
    { id: "published", label: "Published-source observations", class: "observed", color: "#70b6cf" },
    { id: "official", label: "Attributed U.S. claims", class: "disputed", color: "#d1ad52" },
    { id: "survivor", label: "Survivor and SAR states", class: "observed", color: "#75c99b" },
    { id: "zones", label: "Unresolved maritime-zone hypotheses", class: "illustrative", color: "#a982cf" },
    { id: "withheld", label: "Withheld or unknown", class: "disputed", color: "#d26969" },
  ],
  objects: [
    { id: "sea-cell", type: "plane", center: [0, 0, 0], size: [190, 130], layer: "context", label: "Unitless sea surface - not a map or surveyed area" },
    { id: "vessel", type: "box", center: [0, 0, 2.4], size: [18, 6, 4.8], layer: "published", label: "Generic vessel silhouette - dimensions, identity, and flag unknown" },
    { id: "source-camera", type: "marker", center: [-55, -35, 24], layer: "published", label: "Published remote-view source - camera platform and pose unknown" },
    { id: "frustum-a", type: "line", points: [[-55, -35, 24], [-10, -5, 2]], layer: "published", label: "Illustrative source sightline - no targeting geometry" },
    { id: "reported-two", type: "disc", center: [0, 0, 0.25], radius: 13, layer: "official", label: "U.S.-reported two deaths - abstract count, no bodies depicted" },
    { id: "reported-six", type: "ring", center: [0, 0, 0.32], radius: 20, width: 2.5, layer: "survivor", label: "U.S.-reported six survivors - identities and final outcome unresolved" },
    { id: "sar-state", type: "disc", center: [38, 28, 0.3], radius: 18, layer: "survivor", label: "Search-and-rescue notification state - rescue result unknown" },
    { id: "state-flow", type: "path", points: [[0, 0, 1], [18, 12, 1], [38, 28, 1]], layer: "survivor", label: "Abstract publication-to-SAR state transition - not a vessel or survivor route" },
    { id: "territorial-hypothesis", type: "arc-sectors", center: [0, 0, 0.15], radius: [30, 42], sectors: [[10, 105]], layer: "zones", label: "Territorial-sea hypothesis - unresolved and non-geographic" },
    { id: "eez-hypothesis", type: "arc-sectors", center: [0, 0, 0.16], radius: [45, 57], sectors: [[125, 220]], layer: "zones", label: "EEZ-outside-territorial-sea hypothesis - unresolved and non-geographic" },
    { id: "high-seas-hypothesis", type: "arc-sectors", center: [0, 0, 0.17], radius: [60, 72], sectors: [[240, 335]], layer: "zones", label: "High-seas hypothesis - unresolved and non-geographic" },
    { id: "cargo-unknown", type: "marker", center: [-12, 20, 2], layer: "withheld", label: "Cargo evidence not publicly disclosed in reviewed materials" },
    { id: "identity-unknown", type: "marker", center: [14, -22, 2], layer: "withheld", label: "Occupant identities and organization affiliations not publicly established here" },
    { id: "coordinate-unknown", type: "marker", center: [48, -28, 2], layer: "withheld", label: "Coordinates, datum, and maritime zone unknown" },
  ],
  cameraPresets: [
    { id: "overview", label: "Event-cell overview", position: [100, -115, 88], target: [0, 0, 0] },
    { id: "source", label: "Source and vessel", position: [62, -82, 48], target: [-8, -6, 2] },
    { id: "survivor", label: "Survivor / SAR states", position: [82, -45, 52], target: [22, 17, 0] },
    { id: "zones", label: "Maritime-zone hypotheses", position: [40, -105, 105], target: [0, 0, 0] },
  ],
  limitations: [
    "The scene is unitless, non-georeferenced, non-metric, and not north-aligned; it is not a map, digital twin, or photogrammetric reconstruction.",
    "No native sensor file, complete derivative history, exact clock, coordinates, datum, camera calibration, platform telemetry, or vessel control dimensions were available.",
    "No attack trajectory, launch point, weapon, guidance, platform, sensor, route, speed, or target-recognition inference is shown.",
    "Deaths and survivors are represented only as abstract source-reported states; no impact, body, face, injury, remains, or graphic imagery is depicted.",
    "Territorial sea, EEZ outside territorial sea, and high seas are mutually exclusive hypotheses, not concentric distance claims or findings.",
    "Cargo, vessel status, flag, organization membership, identities, casualty status changes, and final SAR outcome remain source-specific or unknown.",
  ],
};

const inputPath = "fixtures/pilots/southern-spear-vessel-strikes/local/reconstruction-inputs.json";
const scenePath = "fixtures/pilots/southern-spear-vessel-strikes/local/reconstruction-scene.json";
const inputText = canonicalStringify(sceneInputs);
const sceneText = canonicalStringify(reconstructionScene);
writeJson(inputPath, sceneInputs);
writeJson(scenePath, reconstructionScene);

const assets = [{
  id: I.asset,
  investigationId: I.investigation,
  title: "Project-authored qualitative maritime source-state reconstruction",
  mediaType: "diagram",
  sourceIds: sceneInputs.sourceKeys.map((key) => sourceMap.get(key).sourceId),
  rightsDecisionId: id("rgt", 601),
  createdAt: CREATED,
}];
rightsDecisions.push({
  id: id("rgt", 601), subjectType: "asset", subjectId: I.asset, rightsStatus: "project_authored",
  storagePermission: "permitted_bytes", displayPermission: "private_bytes", exportPermission: "project_bytes",
  rationale: "Project-authored JSON contains generic geometry and source-state labels only; no source pixels, impact imagery, bodies, identities, operational geometry, or copied media are included.",
  reviewedAt: CREATED, reviewerRole: "rights-privacy compliance editor", basisUrls: [sourceMap.get("southcom_jun21").url, sourceMap.get("dvids_jun21").url], createdAt: CREATED,
});

const assetCaptures = [
  { id: I.captureInput, assetId: I.asset, capturedAt: CREATED, acquisitionMethod: "Human-authored source-bounded parameter register", softwareVersion: "forensic-crawler-scene/1.0.0", sha256: sha256(inputText), byteSize: Buffer.byteLength(inputText), mimeType: "application/json", storageState: "permitted", localPath: inputPath, createdAt: CREATED },
  { id: I.captureScene, assetId: I.asset, capturedAt: CREATED, acquisitionMethod: "Deterministic qualitative-scene normalization", softwareVersion: "forensic-crawler-scene/1.0.0", sha256: sha256(sceneText), byteSize: Buffer.byteLength(sceneText), mimeType: "application/json", storageState: "permitted", localPath: scenePath, createdAt: CREATED },
];

const assetTransformations = [{
  id: I.transformation, assetId: I.asset, inputCaptureId: I.captureInput, outputCaptureId: I.captureScene,
  method: "Map source-bounded maritime event states into a unitless non-georeferenced display frame while keeping target, cargo, casualty, zone, and legal claims attributed or unresolved.",
  softwareVersion: "forensic-crawler-scene/1.0.0",
  parameters: { coordinateSystem: "EVENT_LOCAL_V1", georeferenced: false, metricPhotogrammetry: false, attackReplay: false, inferPlatform: false, inferMunition: false, inferRoute: false },
  operator: "local deterministic fixture builder", createdAt: CREATED,
}];

const assetSourceRelationships = sceneInputs.sourceKeys.map((sourceKey, index) => ({
  id: id("asrel", index + 501), assetId: I.asset, sourceId: sourceMap.get(sourceKey).sourceId, function: "derives_from",
  locator: { kind: "other", value: sourceMap.get(sourceKey).locator }, createdAt: CREATED,
}));

const reconstructionDefinitions = [
  ["Unitless maritime event cell", "illustrative", [1, 2, 3]],
  ["Generic vessel and publication source", "observed", [2, 3]],
  ["Attributed casualty-count states", "disputed", [2, 4]],
  ["Survivor and SAR transition", "observed", [2, 4]],
  ["Mutually exclusive maritime-zone hypotheses", "illustrative", [1, 2]],
  ["Target, cargo, identity, and coordinate unknowns", "disputed", [3, 4, 5, 6]],
].map(([label, elementClass, observationNumbers], index) => ({ label, elementClass, observationNumbers, elementId: id("rec", index + 501), revisionId: id("recr", index + 501) }));

const reconstructionElements = reconstructionDefinitions.map((definition) => ({
  id: definition.elementId, investigationId: I.investigation, label: definition.label, elementClass: definition.elementClass,
  observationIds: definition.observationNumbers.map((number) => observations[number - 1].id), assetTransformationIds: [I.transformation], currentRevisionId: definition.revisionId, createdAt: CREATED,
}));

const reconstructionRevisions = reconstructionDefinitions.map((definition) => ({
  id: definition.revisionId, elementId: definition.elementId, revisionNumber: 1,
  method: "Source-linked qualitative construction in EVENT_LOCAL_V1; no copied pixels, geolocation, photogrammetry, targeting geometry, platform, munition, or attack replay.",
  parameters: { sceneCaptureId: I.captureScene, evidenceClass: definition.elementClass, metricClaim: false, geospatialClaim: false },
  inputIds: [...definition.observationNumbers.map((number) => observations[number - 1].id), I.captureInput], outputHash: sha256(sceneText), uncertainty: reconstructionScene.limitations, createdAt: CREATED,
}));

const contradictions = [
  { title: "Complete ledger versus public lower bounds", claims: [6, 7, 9, 24], anchors: [5, 10], description: "The government says it cannot provide a complete public accounting, while oversight and reporting publish partial aggregates and a source-by-source lower bound.", status: "open", alternatives: ["Classified or non-public incidents", "Different strike, engagement, and vessel counting units", "Publication lag or correction history"] },
  { title: "Campaign casualty totals", claims: [7, 10, 11], anchors: [5, 8], description: "Lead IG and AP totals use different dates and casualty categories; neither should overwrite the other.", status: "explained", alternatives: ["Different cutoffs", "Immediate deaths versus presumed deaths", "Survivor outcomes changing after publication"] },
  { title: "Venezuela shorthand versus basin-wide campaign", claims: [1, 12, 13], anchors: [1, 7], description: "Early incidents were framed near or from Venezuela, but the documented campaign extends across the Caribbean and eastern Pacific and usually lacks exact coordinates.", status: "explained", alternatives: ["Political shorthand", "Origin, route, and strike location conflated", "Different incident subsets"] },
  { title: "International waters versus legal maritime zone", claims: [13, 14], anchors: [2, 7], description: "Official international-waters wording is not enough to choose territorial sea, EEZ outside territorial sea, or high seas without coordinates and baselines.", status: "open", alternatives: ["High seas", "EEZ outside territorial sea", "Territorial sea", "Boundary or baseline dispute"] },
  { title: "June 21 target and cargo status", claims: [15, 16], anchors: [7, 8], description: "SOUTHCOM asserts DTO operation and trafficking; the public release does not expose the underlying intelligence or cargo proof.", status: "open", alternatives: ["Reliable classified evidence not publicly releasable", "Mistaken identification", "Correct vessel but disputed occupant or cargo characterization"] },
  { title: "October 14 occupant characterization", claims: [18, 19, 20], anchors: [2, 10], description: "The U.S. trafficking characterization conflicts with plaintiffs' allegation that two decedents were fishermen and farmworkers returning home; no merits ruling resolves the conflict.", status: "open", alternatives: ["Government classification supported by non-public evidence", "Plaintiffs' account supported by discovery", "Mixed occupant roles", "Mistaken vessel or identity linkage"] },
  { title: "September 2 follow-on strike", claims: [2, 3, 23], anchors: [1, 9], description: "The acknowledged follow-on strike and survivor deaths raise unresolved factual and legal questions that the public edited record and current oversight do not decide.", status: "open", alternatives: ["Continuing threat assessment", "Vessel-destruction objective", "Persons hors de combat", "Incomplete or edited public chronology"] },
].map((definition, index) => ({
  id: id("ctr", index + 501), investigationId: I.investigation, title: definition.title,
  claimIds: definition.claims.map((number) => C[number]), temporalAnchorIds: definition.anchors.map((number) => T[number]), description: definition.description,
  magnitudeSeconds: null, status: definition.status, alternateExplanations: definition.alternatives, reviewStatus: "working", createdAt: CREATED,
}));

const events = [
  ["First publicly announced vessel strike", "The U.S. announces a Caribbean strike tied to a vessel alleged to have departed Venezuela; target, cargo, affiliation, casualty, and follow-on-strike details remain source-specific.", [1, 2, 5, 10], [1]],
  ["October 14 strike later challenged", "U.S. officials report six killed; the Burnley plaintiffs later contest the trafficking characterization for two alleged occupants.", [2, 5, 8, 9, 10], [2]],
  ["Operation Southern Spear formally named", "The military campaign receives its formal operation name after the first vessel strikes.", [1, 2, 3], [3]],
  ["January 23 survivor incident", "SOUTHCOM reports two killed, one survivor, and SAR notification.", [2, 3, 4, 10], [4]],
  ["March 19 survivor incident", "SOUTHCOM reports three survivors and SAR notification after an eastern Pacific strike.", [2, 3, 4, 6, 10], [6]],
  ["Lead IG aggregate cutoff", "The oversight report later records a public lower bound of 47 boats and 156 killed or presumed dead through March 31 while stating no complete public accounting was available.", [1, 2, 5, 6, 10], [5]],
  ["Targeting-cycle evaluation announced", "The Inspector General opens a targeting-procedure evaluation that does not purport to decide legality.", [1, 2, 3], [9]],
  ["June 21 Caribbean strike", "SOUTHCOM reports two killed, six survivors, and SAR notification; exact position, evidence packet, and survivor result are not disclosed in the release.", [2, 3, 4, 5, 7, 10], [7]],
  ["AP current aggregate and correction", "AP reports more than 60 attacks and more than 210 killed, and corrects the incident basin/date framing in its June 22 report.", [1, 5, 6, 10], [8]],
  ["Research cutoff", "No later SOUTHCOM vessel-strike release, complete public ledger, completed legality review, or civil merits judgment was identified through the cutoff.", [1, 2, 3, 9], [10]],
].map(([title, description, entityNumbers, temporalNumbers], index) => ({
  id: id("evt", index + 501), investigationId: I.investigation, title, description,
  entityIds: entityNumbers.map((number) => E[number]), temporalAnchorIds: temporalNumbers.map((number) => T[number]), createdAt: CREATED,
}));

const editorialReviews = [
  { type: "source", subjects: sources.map((source) => source.id), findings: ["Twenty exact source records separate official claims, oversight, institutional legal positions, reporting, and litigation.", "The Lead IG completeness warning governs every aggregate."], limitations: ["No remote body, social-media payload, source video, classified target packet, or paid docket record is retained.", "The chronology is representative, not a fabricated complete strike ledger."] },
  { type: "rights", subjects: [...sources.map((source) => source.id), I.asset], findings: ["All third-party materials are metadata and link only.", "The scene contains project-authored abstract geometry and no copied source pixels, impact replay, bodies, faces, or identifying imagery."], limitations: ["Government-work status does not establish authenticity, completeness, evidentiary reliability, or public-release approval."] },
  { type: "forensic", subjects: reconstructionElements.map((element) => element.id), findings: ["The scene is unitless, qualitative, non-georeferenced, and state-based.", "No platform, munition, route, target-recognition, impact, identity, cargo, or photogrammetric solve is claimed."], limitations: reconstructionScene.limitations },
  { type: "editorial", subjects: claims.map((claim) => claim.id), findings: ["Target, cargo, DTO, international-waters, casualty, and legal-authority claims remain attributed to their sources.", "Litigation allegations and institutional legal positions are not presented as merits findings.", "Deaths, missing people, survivors, presumed deaths, and SAR outcomes are not silently merged."], limitations: ["No external publication is approved.", "Later releases, casualty-status changes, oversight findings, or court orders may supersede this cutoff."] },
  { type: "security", subjects: [I.investigation, I.asset], findings: ["No crawler, outreach, authentication bypass, private-person research, media ingestion, deployment, or publication was performed.", "Operationally precise coordinates, platforms, munitions, surveillance geometry, routes, and SAR locations are excluded."], limitations: ["A production private workspace still requires authentication, authorization, encryption, retention, audit, and egress controls."] },
].map((definition, index) => ({
  id: id("rev", index + 501), investigationId: I.investigation, reviewType: definition.type, subjectIds: definition.subjects,
  findings: definition.findings, limitations: definition.limitations, reviewedAt: CREATED, reviewerRole: `${definition.type} review role`, createdAt: CREATED,
}));

const investigation = {
  id: I.investigation,
  slug: "southern-spear-vessel-strikes",
  title: "Operation Southern Spear vessel strikes - public-record reconstruction",
  status: "working",
  purpose: "Build a provenance-first, non-graphic first-pass reconstruction of the U.S. lethal vessel-strike campaign that began near Venezuela and expanded across the Caribbean and eastern Pacific, while preserving target and cargo attribution, incomplete public accounting, casualty-category changes, survivor and SAR uncertainty, legal disputes, civil allegations, rights limits, and the absence of metric reconstruction inputs.",
  scope: ["Public records through July 17, 2026", "Vessel strikes from September 2, 2025 through June 21, 2026", "Campaign aggregates and representative incidents", "Official assertions, independent reporting, litigation allegations, and institutional legal positions as separate layers", "Qualitative unitless maritime event cell", "Contradictions, source corrections, dignity, rights, security, and missing-evidence register", "Excludes interdictions, tanker seizures, land strikes, and the separate Venezuela operation"],
  createdAt: CREATED,
  updatedAt: CUTOFF,
};

const auditEvents = sealAuditEvents([
  { id: id("aud", 501), investigationId: I.investigation, sequence: 1, eventType: "case_scope_authorized", actorType: "human_role", actorId: "project owner via Codex task", occurredAt: CREATED, subjectIds: [I.investigation], details: { publicResearch: true, localImplementation: true, publication: false, outreach: false, accessBypass: false, vesselCampaignOnly: true }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 502), investigationId: I.investigation, sequence: 2, eventType: "official_chronology_rights_and_spatial_research_reconciled", actorType: "human_role", actorId: "delegated research roles", occurredAt: CREATED, subjectIds: sources.map((source) => source.id), details: { remoteBodiesRetained: false, graphicMediaExcluded: true, operationalGeometryExcluded: true, authoritativeCompleteLedgerFound: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 503), investigationId: I.investigation, sequence: 3, eventType: "campaign_claims_and_counting_rules_recorded", actorType: "human_role", actorId: "forensic integration editor", occurredAt: CREATED, subjectIds: [...claims.map((claim) => claim.id), ...contradictions.map((item) => item.id)], details: { singleUnqualifiedDeathTotal: false, attributedTargetClaimsPreserved: true, litigationAllegationsTreatedAsFindings: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 504), investigationId: I.investigation, sequence: 4, eventType: "qualitative_maritime_scene_built", actorType: "local_tool", actorId: "forensic-crawler-scene/1.0.0", occurredAt: CREATED, subjectIds: [I.asset, I.captureInput, I.captureScene, I.transformation, ...reconstructionElements.map((element) => element.id)], details: { photogrammetry: false, georeferenced: false, attackReplay: false, platformInferred: false, munitionInferred: false, sourcePixelsCopied: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 505), investigationId: I.investigation, sequence: 5, eventType: "rights_privacy_security_forensic_and_editorial_reviews_recorded", actorType: "human_role", actorId: "review roles", occurredAt: CREATED, subjectIds: editorialReviews.map((review) => review.id), details: { publicReleaseApproved: false, graphicContentIncluded: false, operationallySensitiveDetailIncluded: false, qualifiedLegalReviewComplete: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 506), investigationId: I.investigation, sequence: 6, eventType: "working_package_assembled", actorType: "local_tool", actorId: "forensic-crawler-package/1.0.0", occurredAt: CREATED, subjectIds: [I.package, I.investigation], details: { schemaVersion: "1.0.0", status: "working", researchCutoff: CUTOFF, publicRelease: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
]);

const data = {
  schemaVersion: "1.0.0", packageType: "forensic_workspace", packageId: I.package, exportedAt: CUTOFF, exportProfile: "private_workspace",
  investigations: [investigation], events, claims, claimRevisions, sources, sourceSnapshots, sourceRegistryEntries: [...registriesByOrigin.values()],
  assets, assetCaptures, assetTransformations, entities, observations, temporalAnchors: temporalDefinitions, spatialAnchors,
  claimSourceRelationships, assetSourceRelationships, contradictions, rightsDecisions, confidenceAssessments, reconstructionElements, reconstructionRevisions,
  expertCandidates: [], interviews: [], consentRecords: [], editorialReviews, corrections: [], exports: [], importRuns: [], auditEvents,
};

writeJson("fixtures/pilots/southern-spear-vessel-strikes/forensic-package.json", data);
console.log(`Wrote Southern Spear vessel-strike pilot with ${claims.length} claims, ${sources.length} sources, ${contradictions.length} contradictions, and ${events.length} timeline events.`);
