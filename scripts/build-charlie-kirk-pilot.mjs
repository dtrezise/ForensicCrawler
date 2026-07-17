import { Buffer } from "node:buffer";
import { canonicalStringify, sealAuditEvents, sha256, writeJson } from "./lib.mjs";

const CREATED = "2026-07-17T13:30:00Z";
const CUTOFF = "2026-07-17T13:30:00Z";

function id(prefix, value) {
  const tail = value.toString(16).padStart(12, "0");
  return `fc_${prefix}_00000000-0000-4000-8000-${tail}`;
}

const I = {
  package: id("pkg", 101),
  investigation: id("inv", 101),
  asset: id("ast", 101),
  captureInput: id("cap", 101),
  captureScene: id("cap", 102),
  transformation: id("xfm", 101),
};

const sourceDefinitions = [
  {
    key: "charging",
    title: "State v. Tyler James Robinson — Information",
    publisher: "Utah County Attorney's Office",
    sourceType: "official_report",
    url: "https://atty.utahcounty.gov/cms/uploads/TJR_Information_49872215e3.pdf",
    publishedAt: "2025-09-16T18:00:00Z",
    locators: [
      { kind: "page", value: "PDF pp. 1-10", label: "Seven charged counts and probable-cause statement" },
      { kind: "page", value: "PDF pp. 4-5", label: "Event layout, alleged roof route, distance, and recovery area" },
    ],
    origin: "https://atty.utahcounty.gov",
    paths: ["/cms/uploads/"],
    rights: "unknown",
  },
  {
    key: "fbi_updates",
    title: "Utah Valley Shooting Updates",
    publisher: "Federal Bureau of Investigation",
    sourceType: "official_web_record",
    url: "https://www.fbi.gov/news/press-releases/utah-valley-shooting-updates",
    publishedAt: "2025-09-11T00:00:00Z",
    locators: [{ kind: "section", value: "Multimedia", label: "Official release log and rooftop-exit description" }],
    origin: "https://www.fbi.gov",
    paths: ["/news/press-releases/", "/video-repository/"],
    rights: "government_work_review",
  },
  {
    key: "fbi_remarks",
    title: "Director Patel's September 12 press-conference remarks",
    publisher: "Federal Bureau of Investigation",
    sourceType: "official_web_record",
    url: "https://www.fbi.gov/news/speeches-and-testimony/director-patel-remarks-september-12-press-conference-utah-valley-university-shooting",
    publishedAt: "2025-09-12T00:00:00Z",
    locators: [{ kind: "paragraph", value: "Timeline paragraphs", label: "12:23 incident, 12:39 arrival, releases, and custody" }],
    origin: "https://www.fbi.gov",
    paths: ["/news/speeches-and-testimony/"],
    rights: "government_work_review",
  },
  {
    key: "dps_initial",
    title: "Updates on Charlie Kirk Shooting at UVU",
    publisher: "Utah Department of Public Safety",
    sourceType: "official_web_record",
    url: "https://dps.utah.gov/press-releases/updates-on-charlie-kirk-shooting-at-uvu/",
    publishedAt: "2025-09-10T00:00:00Z",
    locators: [{ kind: "paragraph", value: "Opening and event-security paragraphs", label: "12:20 source expression, quad, attendance, and detainee correction" }],
    origin: "https://dps.utah.gov",
    paths: ["/press-releases/"],
    rights: "unknown",
  },
  {
    key: "county_updates",
    title: "Charlie Kirk Case Updates",
    publisher: "Utah County Attorney's Office",
    sourceType: "official_web_record",
    url: "https://atty.utahcounty.gov/media/ckpr",
    publishedAt: null,
    locators: [{ kind: "section", value: "June 26, 2026 and February 24, 2026 updates", label: "Preliminary-hearing scope and public procedural history" }],
    origin: "https://atty.utahcounty.gov",
    paths: ["/media/ckpr"],
    rights: "unknown",
  },
  {
    key: "court_notice",
    title: "Public Information Regarding the Tyler Robinson Preliminary Hearing",
    publisher: "Utah State Courts",
    sourceType: "official_web_record",
    url: "https://legacy.utcourts.gov/utc/news/2026/07/06/public-information-regarding-the-tyler-robinson-preliminary-hearing/",
    publishedAt: "2026-07-06T00:00:00Z",
    locators: [{ kind: "section", value: "Public notice", label: "July 6-10 hearing schedule and access conditions" }],
    origin: "https://legacy.utcourts.gov",
    paths: ["/utc/news/2026/07/"],
    rights: "unknown",
  },
  {
    key: "uvu_alert",
    title: "UVU Alert: Police Investigating Shooting",
    publisher: "Utah Valley University",
    sourceType: "official_web_record",
    url: "https://www.uvu.info/2025/09/uvu-alert-police-investigating-shooting.html",
    publishedAt: "2025-09-10T18:48:00Z",
    locators: [{ kind: "paragraph", value: "12:48 PM alert", label: "Contemporaneous one-shot report and superseded custody statement" }],
    origin: "https://www.uvu.info",
    paths: ["/2025/09/"],
    rights: "ordinary_copyright",
  },
  {
    key: "uvu_map",
    title: "Fall 2025 UVU Campus Map",
    publisher: "Utah Valley University",
    sourceType: "official_report",
    url: "https://www.uvu.edu/advising/university/docs/campusmap-fall2025-0311.pdf",
    publishedAt: "2025-01-01T00:00:00Z",
    locators: [{ kind: "page", value: "Single-page campus map", label: "Hall of Flags, Losee Center, and campus adjacency" }],
    origin: "https://www.uvu.edu",
    paths: ["/advising/university/docs/", "/news/2025/"],
    rights: "ordinary_copyright",
  },
  {
    key: "uvu_review",
    title: "UVU Initiating Comprehensive Independent Review",
    publisher: "Utah Valley University",
    sourceType: "official_web_record",
    url: "https://www.uvu.edu/news/2025/uvu-initiating-comprehensive-review.html",
    publishedAt: "2025-09-18T00:00:00Z",
    locators: [{ kind: "section", value: "Announcement", label: "External review initiated; final report not located in this pass" }],
    origin: "https://www.uvu.edu",
    paths: ["/news/2025/"],
    rights: "ordinary_copyright",
  },
  {
    key: "ap_takeaways",
    title: "Takeaways from a weeklong preliminary hearing",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/21f979ed659cbe9c216481dd9f41c56e",
    publishedAt: "2026-07-11T15:00:25Z",
    locators: [{ kind: "section", value: "Hearing takeaways", label: "Open-court procedural status and evidence disputes" }],
    origin: "https://apnews.com",
    paths: ["/article/"],
    rights: "ordinary_copyright",
  },
  {
    key: "ap_final_day",
    title: "Testimony concludes in pre-trial hearing in Charlie Kirk killing",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/5c31058e15ea28fe1551b5bcf4cf92d3",
    publishedAt: "2026-07-10T13:47:58Z",
    locators: [{ kind: "section", value: "Final-day live report", label: "DNA terminology, ballistics dispute, and September 1 argument" }],
    origin: "https://apnews.com",
    paths: ["/article/"],
    rights: "ordinary_copyright",
  },
  {
    key: "ap_hearing_day2",
    title: "Investigator says video shows defendant going onto roof",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/06e3bb2f1112f45e1b9205270d718eb4",
    publishedAt: "2026-07-07T04:01:59Z",
    locators: [{ kind: "section", value: "Preliminary-hearing report", label: "Surveillance compilation, DNA mixture, and unrelated campus evidence" }],
    origin: "https://apnews.com",
    paths: ["/article/"],
    rights: "ordinary_copyright",
  },
  {
    key: "ksl_distance",
    title: "Investigators share new surveillance video",
    publisher: "KSL",
    sourceType: "article",
    url: "https://www.ksl.com/article/news/utah/police-and-courts/watch-investigators-share-new-surveillance-video-of-charlie-kirk-shooting-suspect/51373399",
    publishedAt: "2025-09-11T00:00:00Z",
    locators: [{ kind: "paragraph", value: "Commissioner distance estimate", label: "Early roughly 200-yard estimate" }],
    origin: "https://www.ksl.com",
    paths: ["/article/news/utah/"],
    rights: "ordinary_copyright",
  },
];

const registriesByOrigin = new Map();
for (const source of sourceDefinitions) {
  if (!registriesByOrigin.has(source.origin)) {
    registriesByOrigin.set(source.origin, {
      id: id("reg", registriesByOrigin.size + 101),
      displayName: new URL(source.origin).hostname,
      canonicalOrigin: source.origin,
      allowedPaths: [...source.paths],
      purpose: "Human-reviewed public-source metadata and exact locators for the private Charlie Kirk case fixture.",
      accessClass: "manual_metadata_only",
      status: "approved_metadata_only",
      rightsMode: source.rights === "government_work_review" ? "government_work_review" : "link_only",
      storageMode: "no_bytes",
      networkUseApproved: false,
      ownerRole: "source-scope reviewer",
      reviewedAt: CREATED,
      expiresAt: "2026-10-17T13:30:00Z",
      createdAt: CREATED,
    });
  } else {
    const registry = registriesByOrigin.get(source.origin);
    registry.allowedPaths = [...new Set([...registry.allowedPaths, ...source.paths])];
  }
}

const sourceMap = new Map();
const sources = sourceDefinitions.map((definition, index) => {
  const sourceId = id("src", index + 101);
  const rightsId = id("rgt", index + 101);
  const snapshotId = id("snap", index + 101);
  sourceMap.set(definition.key, { sourceId, rightsId, snapshotId, definition });
  return {
    id: sourceId,
    registryEntryId: registriesByOrigin.get(definition.origin).id,
    title: definition.title,
    publisher: definition.publisher,
    author: null,
    publishedAt: definition.publishedAt,
    sourceType: definition.sourceType,
    canonicalUrl: definition.url,
    retrievedAt: CUTOFF,
    lastCheckedAt: CUTOFF,
    rightsDecisionId: rightsId,
    locators: definition.locators,
    createdAt: CREATED,
  };
});

const sourceSnapshots = sourceDefinitions.map((definition, index) => ({
  id: id("snap", index + 101),
  sourceId: id("src", index + 101),
  checkedAt: CUTOFF,
  url: definition.url,
  httpStatus: null,
  contentHash: null,
  storageState: "metadata_only",
  limitations: "URL, publication metadata, locators, and restrained paraphrase only. No third-party response body is retained in the repository.",
  createdAt: CREATED,
}));

const rightsDecisions = sourceDefinitions.map((definition, index) => ({
  id: id("rgt", index + 101),
  subjectType: "source",
  subjectId: id("src", index + 101),
  rightsStatus: definition.rights,
  storagePermission: "metadata_only",
  displayPermission: "private_metadata",
  exportPermission: "metadata_only",
  rationale: definition.rights === "ordinary_copyright"
    ? "Copyrighted reporting or institutional material. Store and display metadata, locators, and restrained factual paraphrase only."
    : "Public official record with item-specific reuse status not fully resolved. Link and metadata use only in this private fixture.",
  reviewedAt: CREATED,
  reviewerRole: "rights-privacy compliance editor",
  basisUrls: [definition.url],
  createdAt: CREATED,
}));

const entities = [
  ["Charlie Kirk", "person"],
  ["Tyler James Robinson", "person"],
  ["Utah Valley University", "organization"],
  ["Turning Point USA", "organization"],
  ["Fountain Courtyard event region", "place"],
  ["Hall of Flags", "place"],
  ["State-alleged rooftop region", "place"],
  ["Recovered rifle described by investigators", "object"],
  ["Fourth Judicial District Court", "organization"],
].map(([canonicalName, entityType], index) => ({
  id: id("ent", index + 101),
  investigationId: I.investigation,
  canonicalName,
  entityType,
  aliases: [],
  createdAt: CREATED,
}));

const E = Object.fromEntries(entities.map((entity, index) => [index + 1, entity.id]));

const temporalDefinitions = [
  ["Surveillance-described north campus entry", "approximately 11:51 a.m. MDT", "2025-09-10T17:51:00Z", 60, "charging", "PDF p. 5"],
  ["Surveillance-described roof access", "approximately 12:15 p.m. MDT", "2025-09-10T18:15:00Z", 60, "charging", "PDF p. 5"],
  ["DPS incident time", "approximately 12:20 p.m. MST [source label]", "2025-09-10T18:20:00Z", 180, "dps_initial", "Opening paragraph"],
  ["FBI / charging incident time", "12:23 p.m. MDT", "2025-09-10T18:23:00Z", 60, "fbi_remarks", "Timeline paragraph"],
  ["First FBI arrival", "12:39 p.m. MDT", "2025-09-10T18:39:00Z", 60, "fbi_remarks", "Timeline paragraph"],
  ["UVU first custody alert", "12:48 p.m. MDT", "2025-09-10T18:48:00Z", 60, "uvu_alert", "12:48 PM alert"],
  ["FBI first suspect images", "approximately 10:00 a.m. MDT", "2025-09-11T16:00:00Z", 300, "fbi_remarks", "Release chronology"],
  ["FBI rooftop-exit video release", "10:00 p.m. EDT / 8:00 p.m. MDT", "2025-09-12T02:00:00Z", 60, "fbi_updates", "Multimedia release log"],
  ["Custody milestone stated by FBI", "approximately 10:00 p.m. MDT", "2025-09-12T04:00:00Z", 300, "fbi_remarks", "Custody chronology"],
  ["Charges authorized and released", "September 16, 2025", null, 86400, "charging", "PDF p. 10"],
  ["Preliminary-hearing testimony window", "July 6-10, 2026", null, 432000, "court_notice", "Public notice"],
  ["Final preliminary-hearing arguments", "scheduled September 1, 2026", null, 86400, "ap_final_day", "Final-day report"],
].map(([label, originalExpression, normalizedUtc, precisionSeconds, sourceKey, locator], index) => ({
  id: id("tmp", index + 101),
  investigationId: I.investigation,
  label,
  originalExpression,
  normalizedUtc,
  missionElapsedSeconds: null,
  timeSystem: normalizedUtc ? "local_civil" : "unknown",
  precisionSeconds,
  uncertaintyLowerSeconds: precisionSeconds,
  uncertaintyUpperSeconds: precisionSeconds,
  conversionRationale: sourceKey === "dps_initial"
    ? "The source's literal MST label is preserved; normalized UTC uses MDT (UTC-6), which Utah observed on September 10, 2025."
    : normalizedUtc ? "Local Mountain Daylight Time normalized to UTC; displayed precision is source precision, not clock validation." : "The public source does not provide a reliable time of day; no normalized instant is invented.",
  sourceId: sourceMap.get(sourceKey).sourceId,
  locator: { kind: "other", value: locator },
  createdAt: CREATED,
}));

const T = Object.fromEntries(temporalDefinitions.map((anchor, index) => [index + 1, anchor.id]));

const claimDefinitions = [
  { text: "Utah DPS initially reported the shooting at approximately 12:20 p.m.; its first page labeled the time MST.", state: "authenticated_official_record", status: "Official contemporaneous statement; minute is approximate and timezone label requires correction.", entities: [1, 3], sources: [["dps_initial", "supports", "Opening paragraph"]], confidence: "high", questions: ["Was 12:20 a rounded public-information estimate?"] },
  { text: "The FBI states that Charlie Kirk was shot at 12:23 p.m. on September 10, 2025.", state: "authenticated_official_record", status: "Official agency chronology; not independent of the joint investigation.", entities: [1, 3], sources: [["fbi_remarks", "supports", "Timeline paragraph"], ["charging", "contextualizes", "PDF p. 3"]], confidence: "high", questions: ["What source clock established the 12:23 minute?"] },
  { text: "Charlie Kirk was fatally shot during an outdoor public event at Utah Valley University on September 10, 2025.", state: "independently_corroborated", status: "Incident and death established across institutional and official records; identity of the perpetrator is a separate question.", entities: [1, 3, 4, 5], sources: [["dps_initial", "supports", "Opening paragraphs"], ["fbi_updates", "supports", "Page introduction"], ["charging", "contextualizes", "PDF p. 3"]], confidence: "high", questions: [] },
  { text: "The State's filing describes Kirk seated beneath a portable canopy, with a question microphone in front, a crowd on three sides, temporary fencing, and the Hall of Flags above and behind.", state: "attributed_unverified", status: "State allegation and scene description in a probable-cause filing; not an adjudicated finding.", entities: [1, 5, 6], sources: [["charging", "supports", "PDF p. 4"]], confidence: "moderate", questions: ["Which elements are visible in original rights-cleared photographs or survey records?"] },
  { text: "The State alleges that an individual accessed a roof around 12:15 p.m., moved to a prone area about 160 yards from Kirk, and fled northeast after one shot.", state: "attributed_unverified", status: "Prosecution allegation; actor identity, path, and distance have not been adjudicated.", entities: [2, 5, 7], sources: [["charging", "supports", "PDF pp. 4-5"], ["fbi_updates", "contextualizes", "Official video description"]], confidence: "moderate", questions: ["What endpoints and measurement method produced the 160-yard estimate?", "Which rooftop is established by an admitted official exhibit?"] },
  { text: "An early public briefing described the rooftop distance as roughly 200 yards.", state: "attributed_unverified", status: "Secondary report of an early commissioner estimate; retained as a conflicting approximate value.", entities: [1, 7], sources: [["ksl_distance", "supports", "Commissioner distance estimate"]], confidence: "moderate", questions: ["Did the speaker use different start or end points than the charging filing?"] },
  { text: "Investigators reported recovering a bolt-action rifle wrapped in a towel in a wooded area near the university, with one spent and three unspent rounds.", state: "attributed_unverified", status: "Official investigative assertion and charging allegation; underlying lab and custody records are not in this fixture.", entities: [7, 8], sources: [["charging", "supports", "PDF p. 5"], ["fbi_updates", "contextualizes", "Official video description"]], confidence: "moderate", questions: ["What complete chain-of-custody and examination records exist?"] },
  { text: "The charging filing says DNA 'consistent with' Robinson was found on several items; July hearing reporting describes possible-contributor and likelihood-ratio testimony rather than absolute identification.", state: "disputed", status: "Unadjudicated forensic evidence; raw reports and statistical propositions were not reviewed from an official public host.", entities: [2, 8], sources: [["charging", "supports", "PDF p. 6"], ["ap_final_day", "contextualizes", "DNA testimony"], ["ap_hearing_day2", "contextualizes", "DNA mixture testimony"]], confidence: "moderate", questions: ["What exact propositions, likelihood ratios, mixtures, and laboratory limitations appear in the underlying reports?"] },
  { text: "Public hearing coverage describes the bullet-fragment comparison as inconclusive; it should not be labeled either a match or an exclusion.", state: "unresolved", status: "Reported preliminary-hearing evidence; no adjudicated ballistics finding.", entities: [1, 2, 8], sources: [["ap_final_day", "supports", "Ballistics testimony"]], confidence: "moderate", questions: ["Will an admitted report or certified transcript resolve the examiner's exact conclusion?"] },
  { text: "The State filed seven charges against Tyler James Robinson, who is presumed innocent; reviewed official public pages do not yet show a probable-cause disposition.", state: "authenticated_official_record", status: "Preliminary-hearing stage. No plea, verdict, bind-over, or dismissal is represented as verified in the official layer as of the research cutoff.", entities: [2, 8, 9], sources: [["charging", "supports", "PDF pp. 1-3"], ["county_updates", "contextualizes", "Case updates"], ["court_notice", "contextualizes", "July hearing notice"]], confidence: "high", questions: ["Obtain a public court order or docket entry for the eventual probable-cause disposition."] },
  { text: "UVU's 12:48 p.m. alert said a suspect was in custody; later official statements made clear the shooter remained at large and early detainees had no ties to the shooting.", state: "superseded", status: "Contemporaneous alert preserved with its correction; uninvolved detainees must not be associated with the shooting.", entities: [3], sources: [["uvu_alert", "supports", "12:48 PM alert"], ["dps_initial", "supersedes", "Detainee correction paragraph"]], confidence: "high", questions: [] },
  { text: "The charging filing describes several hundred attendees.", state: "attributed_unverified", status: "Source-specific estimate in the State's probable-cause narrative.", entities: [3, 4, 5], sources: [["charging", "supports", "PDF p. 4"]], confidence: "moderate", questions: ["What was the estimate method and temporal scope?"] },
  { text: "Utah DPS estimated approximately 3,000 attendees and six UVU officers assigned to the event.", state: "authenticated_official_record", status: "Early agency estimate; not a verified exact headcount.", entities: [3, 4, 5], sources: [["dps_initial", "supports", "Event-security paragraph"]], confidence: "moderate", questions: ["What was the estimate method and which spaces were counted?"] },
  { text: "Public FBI video and July courtroom compilations are derived from UVU surveillance; zooms, markings, edits, and release timestamps must not be mistaken for native camera evidence.", state: "independently_corroborated", status: "Transformation and source-lineage limitation, not a claim about actor identity.", entities: [3, 7], sources: [["fbi_updates", "supports", "Multimedia release log"], ["ap_takeaways", "contextualizes", "Video evidence section"], ["ap_hearing_day2", "contextualizes", "Surveillance compilation testimony"]], confidence: "high", questions: ["Can native clips, timebases, edit decision lists, and camera metadata be lawfully obtained?"] },
  { text: "The present 3D scene is a source-linked schematic, not photogrammetry: the public, rights-cleared record lacks calibrated original images, surveyed control points, camera intrinsics, verified heights, and a court-validated trajectory.", state: "inferred", status: "Forensic-method conclusion for this private first pass.", entities: [3, 5, 6, 7], sources: [["charging", "contextualizes", "PDF pp. 4-5"], ["uvu_map", "contextualizes", "Single-page campus map"], ["ap_takeaways", "contextualizes", "Public hearing evidence limitations"]], confidence: "high", questions: ["Can original, rights-cleared overlapping imagery and survey control be obtained?", "Will an official external review publish usable scene measurements?"] },
  { text: "Open-court reporting says testimony ended July 10 and final preliminary-hearing arguments are scheduled for September 1, after which the judge will decide probable cause.", state: "independently_corroborated", status: "Secondary open-court reporting; not promoted to the official docket layer until an official order or calendar is verified.", entities: [2, 9], sources: [["ap_takeaways", "supports", "Opening procedural summary"], ["ap_final_day", "supports", "September 1 proceeding"]], confidence: "high", questions: ["Verify the continuation on an official court order or calendar when published."] },
  { text: "UVU announced an independent external review, but this pass did not locate an official final report.", state: "unresolved", status: "Verified announcement and documented public-record gap; absence from this search is not proof no report exists.", entities: [3], sources: [["uvu_review", "supports", "Announcement"]], confidence: "moderate", questions: ["Has a final report been published under another official title or records channel?"] },
  { text: "July preliminary-hearing coverage reports that DNA analysts used mixture, possible-contributor, and likelihood-ratio terminology rather than an absolute identification.", state: "attributed_unverified", status: "Secondary report of open-court forensic testimony; the underlying reports and certified transcript were not reviewed.", entities: [2, 8], sources: [["ap_final_day", "supports", "DNA testimony"], ["ap_hearing_day2", "contextualizes", "DNA mixture testimony"]], confidence: "moderate", questions: ["What exact laboratory propositions and likelihood ratios were admitted?"] },
];

const confidenceRange = { high: [0.82, 0.96], moderate: [0.5, 0.78], low: [0.2, 0.45] };
const claims = [];
const claimRevisions = [];
const claimSourceRelationships = [];
const confidenceAssessments = [];

claimDefinitions.forEach((definition, claimIndex) => {
  const claimId = id("clm", claimIndex + 101);
  const revisionId = id("clmr", claimIndex + 101);
  const confidenceId = id("conf", claimIndex + 101);
  claims.push({
    id: claimId,
    investigationId: I.investigation,
    currentRevisionId: revisionId,
    entityIds: definition.entities.map((value) => E[value]),
    evidenceState: definition.state,
    proceduralStatus: definition.status,
    confidenceAssessmentIds: [confidenceId],
    unresolvedQuestions: definition.questions,
    createdAt: CREATED,
  });
  claimRevisions.push({ id: revisionId, claimId, revisionNumber: 1, text: definition.text, claimant: "Forensic Crawler first-pass analysis", changeReason: "Initial source-bounded case synthesis.", createdAt: CREATED });
  const range = confidenceRange[definition.confidence];
  confidenceAssessments.push({
    id: confidenceId,
    subjectType: "claim",
    subjectId: claimId,
    descriptor: definition.confidence,
    lowerBound: range[0],
    upperBound: range[1],
    method: "Editorial descriptor based on source status, independence, precision, and access to underlying evidence; bounds are review aids, not statistical probabilities.",
    rationale: definition.status,
    uncertainty: definition.questions,
    assessedAt: CREATED,
    assessorRole: "forensic integration editor",
    createdAt: CREATED,
  });
  definition.sources.forEach(([sourceKey, relationshipFunction, locator], relationshipIndex) => {
    const source = sourceMap.get(sourceKey);
    claimSourceRelationships.push({
      id: id("rel", claimIndex * 20 + relationshipIndex + 101),
      claimId,
      sourceId: source.sourceId,
      sourceSnapshotId: source.snapshotId,
      function: relationshipFunction,
      locator: { kind: "other", value: locator },
      rationale: `This locator ${relationshipFunction.replaceAll("_", " ")} the current claim text without converting allegation or reporting into an adjudicated finding.`,
      independenceNote: sourceKey.startsWith("ap_") || sourceKey.startsWith("ksl_")
        ? "Editorially independent reporting, but it may describe the same filing, surveillance, testimony, or investigative evidence as other records."
        : "Official or institutional source within the same event/investigation cluster; not presumed independent merely because it is a separate page.",
      createdAt: CREATED,
    });
  });
});

const C = Object.fromEntries(claims.map((claim, index) => [index + 1, claim.id]));
function relationFor(claimNumber, sourceKey) {
  const sourceId = sourceMap.get(sourceKey).sourceId;
  return claimSourceRelationships.find((relationship) => relationship.claimId === C[claimNumber] && relationship.sourceId === sourceId).id;
}

const spatialAnchors = [
  { label: "Seat / canopy event region", geometry: { type: "local-region", center: [0, 0, 0], radiusMeters: 8 }, uncertaintyMeters: 8, method: "Relational origin from filing; no geodetic coordinate assigned.", relationships: [relationFor(4, "charging")] },
  { label: "Hall of Flags above and behind event", geometry: { type: "relational-volume", relation: "above-and-behind", displayCenter: [0, 22, 8] }, uncertaintyMeters: 15, method: "Relational placement from filing; massing is parametric.", relationships: [relationFor(4, "charging")] },
  { label: "State-alleged rooftop 160-yard ring", geometry: { type: "radial-ring", center: [0, 0, 0], radiusMeters: 146.3, displayBearingDegrees: 0 }, uncertaintyMeters: 18, method: "Converted source-reported approximate yards to meters; endpoint definitions unknown.", relationships: [relationFor(5, "charging")] },
  { label: "Early roughly 200-yard ring", geometry: { type: "radial-ring", center: [0, 0, 0], radiusMeters: 182.9, displayBearingDegrees: 0 }, uncertaintyMeters: 25, method: "Converted secondary report of approximate yards; retained as a contradiction ring.", relationships: [relationFor(6, "ksl_distance")] },
  { label: "Wooded recovery zone", geometry: { type: "topological-zone", displayCenter: [38, 190, 0], radiusMeters: 28 }, uncertaintyMeters: 40, method: "Coarse display placement from alleged northeast departure and nearby wooded-area description; not a search-path map.", relationships: [relationFor(7, "charging")] },
  { label: "Source-described camera nodes", geometry: { type: "unpositioned-set", count: null }, uncertaintyMeters: 100, method: "Camera existence described in filing and public releases; position, orientation, lens, clock, and frame cadence unknown.", relationships: [relationFor(14, "fbi_updates")] },
  { label: "Campus topology context", geometry: { type: "nonmetric-topology", displayCenter: [0, 80, 0] }, uncertaintyMeters: 35, method: "Orientation from an unscaled, non-georeferenced UVU campus map; no map pixels retained.", relationships: [relationFor(15, "uvu_map")] },
].map((definition, index) => ({
  id: id("spa", index + 101),
  investigationId: I.investigation,
  label: definition.label,
  geometry: definition.geometry,
  crs: "SCENE_FRAME_V1_RELATIONAL_LOCAL_METERS_NOT_GEOREFERENCED",
  uncertaintyMeters: definition.uncertaintyMeters,
  method: definition.method,
  sourceRelationshipIds: definition.relationships,
  createdAt: CREATED,
}));

const S = Object.fromEntries(spatialAnchors.map((anchor, index) => [index + 1, anchor.id]));

const observations = [
  ["The filing describes a canopy, table, microphones, fencing, crowd sectors, and Hall of Flags relationship.", "attributed_unverified", "charging", "PDF p. 4", [1, 5, 6], [4], [1, 2]],
  ["The filing describes an alleged roof access and prone shooting-position area approximately 160 yards from the seat.", "attributed_unverified", "charging", "PDF pp. 4-5", [2, 7], [2], [3]],
  ["Official release descriptions show a rooftop departure and ground movement, but the public video is edited and lacks camera calibration.", "authenticated_official_record", "fbi_updates", "Multimedia", [3, 7], [4], [6]],
  ["Investigators reported a rifle wrapped in a towel in a wooded area near campus.", "attributed_unverified", "charging", "PDF p. 5", [7, 8], [4], [5]],
  ["The UVU map establishes useful adjacency but no metric scale or georeference for forensic measurement.", "authenticated_official_record", "uvu_map", "Single-page map", [3, 5, 6], [], [7]],
].map(([description, evidenceState, sourceKey, locator, entityNumbers, temporalNumbers, spatialNumbers], index) => ({
  id: id("obs", index + 101),
  investigationId: I.investigation,
  description,
  evidenceState,
  sourceId: sourceMap.get(sourceKey).sourceId,
  assetId: null,
  entityIds: entityNumbers.map((number) => E[number]),
  locators: [{ kind: "other", value: locator }],
  temporalAnchorIds: temporalNumbers.map((number) => T[number]),
  spatialAnchorIds: spatialNumbers.map((number) => S[number]),
  createdAt: CREATED,
}));

const sceneInputs = {
  schema: "forensic-crawler.reconstruction-inputs/1",
  caseId: I.investigation,
  coordinateSystem: "SCENE_FRAME_V1 relational local meters; not georeferenced",
  sourceReportedValues: {
    eventToRoofMeters: [146.3, 182.9],
    eventToRoofExpressions: ["approximately 160 yards", "roughly 200 yards"],
    timeExpressions: ["approximately 12:20 p.m.", "12:23 p.m."],
  },
  fixedFacts: ["event outdoors in Fountain Courtyard / quad", "Hall of Flags above and behind event region", "alleged northeast roof departure", "wooded recovery area described near campus"],
  unknowns: ["geodetic origin", "exact rooftop building", "building heights", "camera calibration", "native clip timing", "trajectory", "survey control", "original event-scene image rights"],
  prohibitedInferences: ["identity from pixels", "gait or face recognition", "weapon effectiveness", "tactical blind spots", "exact wound path", "motive from association"],
};

const reconstructionScene = {
  schema: "forensic-crawler.scene/1",
  title: "Charlie Kirk assassination — schematic public-record reconstruction",
  status: "WORKING — SCHEMATIC, NOT PHOTOGRAMMETRIC OR COURT-VALIDATED",
  coordinateSystem: { id: "SCENE_FRAME_V1", units: "meters", georeferenced: false, northAligned: false, origin: "unresolved seat/canopy event region" },
  calibration: { metricPhotogrammetry: false, originalImages: false, cameraIntrinsics: false, surveyedControl: false, trajectoryValidated: false },
  layers: [
    { id: "context", label: "Parametric context", class: "PARAMETRIC_PLACEHOLDER", color: "#28323b" },
    { id: "source", label: "Source-stated anchors", class: "OBSERVED_SOURCE_STATED", color: "#e6c779" },
    { id: "alleged", label: "State allegations", class: "STATE_ALLEGED", color: "#ef8f62" },
    { id: "contradiction", label: "Contradiction / uncertainty", class: "CONTRADICTED", color: "#d56b78" },
  ],
  objects: [
    { id: "ground", type: "plane", center: [0, 0, 0], size: [250, 430], layer: "context", label: "Illustrative local ground plane" },
    { id: "event-courtyard", type: "disc", center: [0, 0, 0.05], radius: 18, layer: "source", label: "Fountain Courtyard event region (coarse)" },
    { id: "hall-of-flags", type: "box", center: [0, 27, 7], size: [62, 16, 14], layer: "context", label: "Hall of Flags massing — dimensions unknown" },
    { id: "canopy", type: "canopy", center: [0, 0, 0], size: [5, 5, 3.2], layer: "context", label: "Canopy placeholder — dimensions unknown" },
    { id: "crowd-sectors", type: "arc-sectors", center: [0, 0, 0.1], radius: [7, 18], sectors: [[-155, -35], [-25, 25], [35, 155]], layer: "context", label: "Three qualitative crowd sectors" },
    { id: "roof-building", type: "box", center: [0, 146.3, 6], size: [58, 34, 12], layer: "context", label: "Illustrative rooftop mass — exact building unresolved" },
    { id: "roof-region-160", type: "ring", center: [0, 0, 0.15], radius: 146.3, width: 1.6, layer: "alleged", label: "State filing: approximately 160 yards" },
    { id: "roof-region-200", type: "ring", center: [0, 0, 0.16], radius: 182.9, width: 1.1, layer: "contradiction", label: "Early briefing: roughly 200 yards" },
    { id: "alleged-roof-position", type: "marker", center: [0, 146.3, 12.4], layer: "alleged", label: "State-alleged rooftop region" },
    { id: "sightline-volume", type: "line", points: [[0, 146.3, 12.4], [0, 0, 1.2]], layer: "alleged", label: "Source-stated clear corridor — not a bullet trajectory" },
    { id: "escape-topology", type: "path", points: [[0, 146.3, 12.4], [22, 168, 12.4], [32, 176, 0.2], [38, 205, 0.2]], layer: "alleged", label: "Coarse alleged departure topology; exact route withheld/unknown" },
    { id: "recovery-zone", type: "disc", center: [38, 205, 0.08], radius: 22, layer: "source", label: "Coarse wooded recovery zone" },
  ],
  cameraPresets: [
    { id: "overview", label: "Overview", position: [190, -190, 170], target: [0, 85, 0] },
    { id: "event", label: "Event region", position: [52, -58, 34], target: [0, 8, 3] },
    { id: "roof", label: "Rooftop region", position: [62, 100, 42], target: [0, 146, 6] },
    { id: "corridor", label: "Alleged corridor", position: [90, 68, 34], target: [0, 74, 5] },
  ],
  limitations: [
    "No original calibrated image set or surveyed control points were available.",
    "Massing dimensions, route curvature, heights, and display bearing are illustrative.",
    "The 160- and 200-yard values are source-reported approximate radial constraints with unknown endpoints.",
    "The corridor line visualizes a source allegation and is not a trajectory, firing solution, or wound-path analysis.",
    "Faces, minors, graphic injury, exact tactical details, and private-person locations are excluded.",
  ],
};

const inputPath = "fixtures/pilots/charlie-kirk-assassination/local/reconstruction-inputs.json";
const scenePath = "fixtures/pilots/charlie-kirk-assassination/local/reconstruction-scene.json";
const inputText = canonicalStringify(sceneInputs);
const sceneText = canonicalStringify(reconstructionScene);
writeJson(inputPath, sceneInputs);
writeJson(scenePath, reconstructionScene);

const assets = [{
  id: I.asset,
  investigationId: I.investigation,
  title: "Project-authored schematic reconstruction scene",
  mediaType: "dataset",
  sourceIds: [sourceMap.get("charging").sourceId, sourceMap.get("fbi_updates").sourceId, sourceMap.get("uvu_map").sourceId, sourceMap.get("ksl_distance").sourceId],
  rightsDecisionId: id("rgt", 201),
  createdAt: CREATED,
}];

rightsDecisions.push({
  id: id("rgt", 201),
  subjectType: "asset",
  subjectId: I.asset,
  rightsStatus: "project_authored",
  storagePermission: "permitted_bytes",
  displayPermission: "private_bytes",
  exportPermission: "project_bytes",
  rationale: "Project-authored data contains no copied source pixels or source bodies; public use still requires legal, rights, privacy, and editorial review.",
  reviewedAt: CREATED,
  reviewerRole: "rights-privacy compliance editor",
  basisUrls: [sourceMap.get("charging").definition.url, sourceMap.get("uvu_map").definition.url],
  createdAt: CREATED,
});

const assetCaptures = [
  { id: I.captureInput, assetId: I.asset, capturedAt: CREATED, acquisitionMethod: "Human-authored source-bounded parameter register", softwareVersion: "forensic-crawler-scene/1.0.0", sha256: sha256(inputText), byteSize: Buffer.byteLength(inputText), mimeType: "application/json", storageState: "permitted", localPath: inputPath, createdAt: CREATED },
  { id: I.captureScene, assetId: I.asset, capturedAt: CREATED, acquisitionMethod: "Deterministic relational-scene normalization", softwareVersion: "forensic-crawler-scene/1.0.0", sha256: sha256(sceneText), byteSize: Buffer.byteLength(sceneText), mimeType: "application/json", storageState: "permitted", localPath: scenePath, createdAt: CREATED },
];

const assetTransformations = [{
  id: I.transformation,
  assetId: I.asset,
  inputCaptureId: I.captureInput,
  outputCaptureId: I.captureScene,
  method: "Map source-reported relational anchors into a non-georeferenced local display frame; retain contradictions as separate rings and unknowns as limitations.",
  softwareVersion: "forensic-crawler-scene/1.0.0",
  parameters: { coordinateSystem: "SCENE_FRAME_V1", northAligned: false, georeferenced: false, interpolateRoute: false },
  operator: "local deterministic fixture builder",
  createdAt: CREATED,
}];

const assetSourceRelationships = ["charging", "fbi_updates", "uvu_map", "ksl_distance"].map((sourceKey, index) => ({
  id: id("asrel", index + 101),
  assetId: I.asset,
  sourceId: sourceMap.get(sourceKey).sourceId,
  function: "derives_from",
  locator: { kind: "other", value: sourceMap.get(sourceKey).definition.locators[0].value },
  createdAt: CREATED,
}));

const reconstructionDefinitions = [
  ["Event-region relational anchors", "observed", [1], [I.transformation]],
  ["Conflicting rooftop-distance rings", "disputed", [2], [I.transformation]],
  ["Alleged departure topology", "disputed", [3, 4], [I.transformation]],
  ["Parametric campus massing", "illustrative", [5], [I.transformation]],
  ["Source-described, uncalibrated camera placeholders", "illustrative", [3], [I.transformation]],
].map(([label, elementClass, observationNumbers, transformationIds], index) => ({ label, elementClass, observationNumbers, transformationIds, elementId: id("rec", index + 101), revisionId: id("recr", index + 101) }));

const reconstructionElements = reconstructionDefinitions.map((definition) => ({
  id: definition.elementId,
  investigationId: I.investigation,
  label: definition.label,
  elementClass: definition.elementClass,
  observationIds: definition.observationNumbers.map((number) => observations[number - 1].id),
  assetTransformationIds: definition.transformationIds,
  currentRevisionId: definition.revisionId,
  createdAt: CREATED,
}));

const reconstructionRevisions = reconstructionDefinitions.map((definition) => ({
  id: definition.revisionId,
  elementId: definition.elementId,
  revisionNumber: 1,
  method: "Source-linked schematic construction in a relational local frame; no pixel-derived photogrammetry or trajectory solve.",
  parameters: { sceneCaptureId: I.captureScene, evidenceClass: definition.elementClass, metricClaim: false },
  inputIds: [...definition.observationNumbers.map((number) => observations[number - 1].id), I.captureInput],
  outputHash: sha256(sceneText),
  uncertainty: reconstructionScene.limitations,
  createdAt: CREATED,
}));

const contradictions = [
  { title: "Incident minute and timezone label", claimIds: [C[1], C[2]], temporalAnchorIds: [T[3], T[4]], description: "DPS used approximately 12:20 and initially labeled it MST; FBI and the filing use 12:23. The three-minute difference is retained without inventing a preferred second.", magnitudeSeconds: 180, status: "explained", alternatives: ["DPS rounded an early public-information time", "Different source clocks or dispatch milestones", "Transcription or publication error"] },
  { title: "Source-reported roof distance", claimIds: [C[5], C[6]], temporalAnchorIds: [T[2], T[4]], description: "The filing says approximately 160 yards while an early briefing was reported as roughly 200 yards. Endpoints and methods are not public.", magnitudeSeconds: null, status: "open", alternatives: ["Different start/end points", "Early estimate later refined", "Visual approximation rather than measurement"] },
  { title: "Attendance estimate", claimIds: [C[12], C[13]], temporalAnchorIds: [T[3], T[4]], description: "The filing says several hundred; DPS estimated approximately 3,000. Neither source publishes a counting method or identical temporal scope.", magnitudeSeconds: null, status: "open", alternatives: ["Different counting times", "Different geographic boundaries", "One or both values are rough estimates"] },
  { title: "Early custody statement", claimIds: [C[10], C[11]], temporalAnchorIds: [T[6], T[9]], description: "A contemporaneous alert said a suspect was in custody while later official records said the shooter remained at large and early detainees had no ties to the shooting.", magnitudeSeconds: null, status: "resolved", alternatives: ["The alert referred to a detained person before investigative exclusion", "Fast-moving command information was published before confirmation"] },
  { title: "DNA summary language", claimIds: [C[8], C[18]], temporalAnchorIds: [T[10], T[11]], description: "The charging summary's 'consistent with' wording must not be flattened into an absolute match; hearing reporting describes mixture, possible-contributor, and likelihood-ratio language.", magnitudeSeconds: null, status: "open", alternatives: ["Different exhibits or sample profiles", "Prosecutorial summary compressed qualified laboratory wording", "The public record lacks the full propositions and reports"] },
].map((definition, index) => ({
  id: id("ctr", index + 101),
  investigationId: I.investigation,
  title: definition.title,
  claimIds: definition.claimIds,
  temporalAnchorIds: definition.temporalAnchorIds,
  description: definition.description,
  magnitudeSeconds: definition.magnitudeSeconds,
  status: definition.status,
  alternateExplanations: definition.alternatives,
  reviewStatus: "working",
  createdAt: CREATED,
}));

const events = [
  ["Alleged campus entry", "The filing alleges a north-campus entry visible on surveillance.", [2, 3], [1]],
  ["Alleged roof access", "The filing alleges a railing crossing and roof access.", [2, 7], [2]],
  ["Fatal shooting at UVU event", "A single shot fatally injured Charlie Kirk during the outdoor event; exact public minute differs by source.", [1, 3, 4, 5], [3, 4]],
  ["First FBI arrival", "The FBI says its first agents arrived and helped secure the scene.", [3], [5]],
  ["Superseded custody alert", "UVU issued a contemporaneous alert later corrected by investigative statements.", [3], [6]],
  ["Public suspect-image release", "The FBI released the first public suspect images.", [3], [7]],
  ["Public rooftop-exit video release", "The FBI released edited public video; release time is not capture time.", [3, 7], [8]],
  ["Custody milestone", "The FBI states the suspect was taken into custody; the filing describes surrender that evening.", [2, 9], [9]],
  ["Seven charges filed", "The State authorized and published an Information containing seven charges.", [2, 9], [10]],
  ["Preliminary-hearing testimony", "The official notice scheduled July 6-10; open-court reporting says testimony concluded without an immediate probable-cause decision.", [2, 9], [11]],
  ["Scheduled final arguments", "Secondary open-court reporting schedules final probable-cause arguments for September 1.", [2, 9], [12]],
].map(([title, description, entityNumbers, temporalNumbers], index) => ({
  id: id("evt", index + 101),
  investigationId: I.investigation,
  title,
  description,
  entityIds: entityNumbers.map((number) => E[number]),
  temporalAnchorIds: temporalNumbers.map((number) => T[number]),
  createdAt: CREATED,
}));

const editorialReviews = [
  { reviewType: "source", subjects: sources.map((source) => source.id), findings: ["All sources have exact HTTPS locators and retrieval metadata.", "Official/institutional pages and secondary hearing coverage are kept in separate source roles."], limitations: ["No paid or authenticated docket access was used.", "No remote source bodies are retained."] },
  { reviewType: "rights", subjects: [...sources.map((source) => source.id), I.asset], findings: ["Copyrighted media and reporting are link/metadata-only.", "The 3D scene contains project-authored geometry and no copied map or video pixels."], limitations: ["Item-specific reuse and public-display rights require qualified review."] },
  { reviewType: "forensic", subjects: reconstructionElements.map((element) => element.id), findings: ["Scene is relational, non-georeferenced, and source-linked.", "Contradictory distances are rendered separately.", "No ballistic, acoustic, identity, or photogrammetric solve is claimed."], limitations: reconstructionScene.limitations },
  { reviewType: "editorial", subjects: claims.map((claim) => claim.id), findings: ["Defendant-specific conduct remains attributed to the State or hearing testimony.", "Presumption of innocence and current procedural posture are visible.", "Early detainees are explicitly separated from the charged defendant."], limitations: ["Qualified legal and final editorial review are still required before external use."] },
  { reviewType: "security", subjects: [I.investigation, I.asset], findings: ["No crawler, authenticated source, outreach, deployment, publication, or raw-media ingestion was performed.", "Graphic imagery, minors, private addresses, and tactical detail are excluded."], limitations: ["A production private workspace still requires authentication, authorization, and egress controls."] },
].map((definition, index) => ({
  id: id("rev", index + 101),
  investigationId: I.investigation,
  reviewType: definition.reviewType,
  subjectIds: definition.subjects,
  findings: definition.findings,
  limitations: definition.limitations,
  reviewedAt: CREATED,
  reviewerRole: `${definition.reviewType} review role`,
  createdAt: CREATED,
}));

const investigation = {
  id: I.investigation,
  slug: "charlie-kirk-assassination",
  title: "Charlie Kirk assassination — public-record reconstruction",
  status: "working",
  purpose: "Build a provenance-first, non-graphic first-pass reconstruction of the September 10, 2025 fatal shooting at Utah Valley University while preserving allegations, procedural posture, source conflicts, rights limits, and spatial uncertainty.",
  scope: ["Lawful public sources through July 17, 2026", "Incident and response chronology", "Charges and current procedural posture", "Visual-source lineage", "Schematic 3D spatial reconstruction", "Contradictions, corrections, rights, privacy, and evidence gaps"],
  createdAt: CREATED,
  updatedAt: CUTOFF,
};

const auditEvents = sealAuditEvents([
  { id: id("aud", 101), investigationId: I.investigation, sequence: 1, eventType: "case_scope_authorized", actorType: "human_role", actorId: "project owner via Codex task", occurredAt: CREATED, subjectIds: [I.investigation], details: { publicResearch: true, localImplementation: true, publication: false, outreach: false, accessBypass: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 102), investigationId: I.investigation, sequence: 2, eventType: "official_and_public_sources_reconciled", actorType: "human_role", actorId: "official-record and chronology review roles", occurredAt: CREATED, subjectIds: sources.map((source) => source.id), details: { remoteBodiesRetained: false, paidDocketAccess: false, graphicMediaExcluded: true }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 103), investigationId: I.investigation, sequence: 3, eventType: "claims_and_contradictions_recorded", actorType: "human_role", actorId: "forensic integration editor", occurredAt: CREATED, subjectIds: [...claims.map((claim) => claim.id), ...contradictions.map((item) => item.id)], details: { guiltAdjudicated: false, sourceConflictsFlattened: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 104), investigationId: I.investigation, sequence: 4, eventType: "schematic_scene_built", actorType: "local_tool", actorId: "forensic-crawler-scene/1.0.0", occurredAt: CREATED, subjectIds: [I.asset, I.captureInput, I.captureScene, I.transformation, ...reconstructionElements.map((element) => element.id)], details: { photogrammetry: false, georeferenced: false, trajectorySolved: false, copiedSourcePixels: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 105), investigationId: I.investigation, sequence: 5, eventType: "rights_privacy_and_editorial_reviews_recorded", actorType: "human_role", actorId: "review roles", occurredAt: CREATED, subjectIds: editorialReviews.map((review) => review.id), details: { publicReleaseApproved: false, personalDataIncluded: false, qualifiedLegalReviewComplete: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 106), investigationId: I.investigation, sequence: 6, eventType: "working_package_assembled", actorType: "local_tool", actorId: "forensic-crawler-package/1.0.0", occurredAt: CREATED, subjectIds: [I.package, I.investigation], details: { schemaVersion: "1.0.0", status: "working", researchCutoff: CUTOFF }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
]);

const data = {
  schemaVersion: "1.0.0",
  packageType: "forensic_workspace",
  packageId: I.package,
  exportedAt: CUTOFF,
  exportProfile: "private_workspace",
  investigations: [investigation],
  events,
  claims,
  claimRevisions,
  sources,
  sourceSnapshots,
  sourceRegistryEntries: [...registriesByOrigin.values()],
  assets,
  assetCaptures,
  assetTransformations,
  entities,
  observations,
  temporalAnchors: temporalDefinitions,
  spatialAnchors,
  claimSourceRelationships,
  assetSourceRelationships,
  contradictions,
  rightsDecisions,
  confidenceAssessments,
  reconstructionElements,
  reconstructionRevisions,
  expertCandidates: [],
  interviews: [],
  consentRecords: [],
  editorialReviews,
  corrections: [],
  exports: [],
  importRuns: [],
  auditEvents,
};

writeJson("fixtures/pilots/charlie-kirk-assassination/forensic-package.json", data);
console.log(`Wrote Charlie Kirk pilot with ${claims.length} claims, ${sources.length} sources, ${contradictions.length} contradictions, and ${events.length} timeline events.`);
