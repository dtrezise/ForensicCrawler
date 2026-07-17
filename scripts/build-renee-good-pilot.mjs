import { Buffer } from "node:buffer";
import { canonicalStringify, sealAuditEvents, sha256, writeJson } from "./lib.mjs";

const CREATED = "2026-07-17T14:30:00Z";
const CUTOFF = "2026-07-17T14:30:00Z";

function id(prefix, value) {
  return `fc_${prefix}_00000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
}

const I = {
  package: id("pkg", 301),
  investigation: id("inv", 301),
  asset: id("ast", 301),
  captureInput: id("cap", 301),
  captureScene: id("cap", 302),
  transformation: id("xfm", 301),
};

const sourceDefinitions = [
  {
    key: "city_response",
    title: "City response to fatal federal-agent shooting",
    publisher: "City of Minneapolis",
    sourceType: "official_web_record",
    url: "https://www.minneapolismn.gov/news/2026/january/fatal-shooting-response/",
    publishedAt: "2026-01-07T00:00:00Z",
    locator: "Incident area, response timing, lifesaving measures, and hospital transport",
    rights: "unknown",
  },
  {
    key: "bca_statement",
    title: "BCA statement regarding investigation of ICE fatal shooting in Minneapolis",
    publisher: "Minnesota Bureau of Criminal Apprehension",
    sourceType: "official_web_record",
    url: "https://dps.mn.gov/news/bca/bca-statement-regarding-investigation-ice-fatal-shooting-minneapolis",
    publishedAt: "2026-01-09T00:00:00Z",
    locator: "Joint-investigation reversal and evidence-access limitations",
    rights: "unknown",
  },
  {
    key: "hcao_portal",
    title: "Renee Good evidence-submission portal announcement",
    publisher: "Hennepin County Attorney's Office",
    sourceType: "official_web_record",
    url: "https://www.hennepinattorney.org/news/news/2026/January/HCAO-Evidence-Submission-Portal",
    publishedAt: "2026-01-09T00:00:00Z",
    locator: "Public evidence-preservation and state-investigation announcement",
    rights: "unknown",
  },
  {
    key: "hcao_touhy",
    title: "Touhy demands for federal information in Renee Good investigation",
    publisher: "Hennepin County Attorney's Office",
    sourceType: "official_web_record",
    url: "https://www.hennepinattorney.org/news/news/2026/February/touhy-release",
    publishedAt: "2026-02-02T00:00:00Z",
    locator: "Formal evidence demands and ongoing state-investigation statement",
    rights: "unknown",
  },
  {
    key: "hcao_touhy_pdf",
    title: "Touhy demand to Department of Homeland Security",
    publisher: "Hennepin County Attorney's Office",
    sourceType: "official_report",
    url: "https://www.hennepinattorney.org/-/media/cao/news/2026/touhy-dhs.pdf?hash=FC0703F81E1B72F2712839A682C3B650&rev=1f469aba247b45eebbdfe1b288c5e5fb",
    publishedAt: "2026-02-02T00:00:00Z",
    locator: "Incident location, investigatory scope, and requested physical/digital evidence",
    rights: "unknown",
  },
  {
    key: "hcao_lawsuit",
    title: "Minnesota and Hennepin County sue for Metro Surge shooting evidence",
    publisher: "Hennepin County Attorney's Office",
    sourceType: "official_web_record",
    url: "https://www.hennepinattorney.org/news/news/2026/March/federal-lawsuit",
    publishedAt: "2026-03-24T00:00:00Z",
    locator: "Filed action 1:26-cv-01007 and evidence-access chronology",
    rights: "unknown",
  },
  {
    key: "hcao_order",
    title: "Federal court schedules evidence-access litigation",
    publisher: "Hennepin County Attorney's Office",
    sourceType: "official_web_record",
    url: "https://www.hennepinattorney.org/news/news/2026/May/federal-order",
    publishedAt: "2026-05-21T00:00:00Z",
    locator: "Court schedule and parties' stated positions",
    rights: "unknown",
  },
  {
    key: "hcao_evidence",
    title: "Two-way evidence sharing announced for Metro Surge shootings",
    publisher: "Hennepin County Attorney's Office",
    sourceType: "official_web_record",
    url: "https://www.hennepinattorney.org/news/news/2026/July/evidence-sharing",
    publishedAt: "2026-07-13T00:00:00Z",
    locator: "Hard-drive transfer, vehicle custody, no-prejudgment statement, and ongoing analysis",
    rights: "unknown",
  },
  {
    key: "docket",
    title: "State of Minnesota v. U.S. Department of Justice case record",
    publisher: "Civil Rights Litigation Clearinghouse",
    sourceType: "other",
    url: "https://clearinghouse.net/case/47964/",
    publishedAt: null,
    locator: "D.D.C. 1:26-cv-01007 docket mirror through July 2026",
    rights: "ordinary_copyright",
  },
  {
    key: "dhs_initial",
    title: "Initial DHS account of Minneapolis fatal shooting",
    publisher: "U.S. Department of Homeland Security",
    sourceType: "other",
    url: "https://x.com/DHSgov/status/2008958123092979817?lang=en",
    publishedAt: "2026-01-07T17:45:15Z",
    locator: "Contemporaneous federal claims of vehicle weaponization, self-defense, and domestic terrorism",
    rights: "government_work_review",
  },
  {
    key: "dhs_policy",
    title: "Department of Homeland Security Policy on the Use of Force",
    publisher: "U.S. Department of Homeland Security",
    sourceType: "official_report",
    url: "https://www.dhs.gov/sites/default/files/2023-02/23_0206_s1_use-of-force-policy-update.pdf",
    publishedAt: "2023-02-06T00:00:00Z",
    locator: "Deadly-force and moving-vehicle policy standards",
    rights: "government_work_review",
  },
  {
    key: "hcme",
    title: "Hennepin County Medical Examiner public data portal",
    publisher: "Hennepin County Medical Examiner",
    sourceType: "official_web_record",
    url: "https://hcmeopublicdata.hennepin.us/",
    publishedAt: null,
    locator: "Case 2026-00103 public cause and manner fields",
    rights: "restricted",
  },
  {
    key: "abc_timeline",
    title: "Minute-by-minute timeline of the Renee Good shooting",
    publisher: "ABC News",
    sourceType: "article",
    url: "https://abcnews.com/US/minneapolis-ice-shooting-minute-minute-timeline-renee-nicole/story?id=129021809",
    publishedAt: "2026-01-09T22:07:00Z",
    locator: "Verified-video metadata reconstruction and response chronology",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_initial",
    title: "ICE officer kills Minneapolis driver during immigration operation",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/minnesota-immigration-enforcement-shooting-crackdown-surge-173e00fa7388054e98c3b5b9417c1e5a",
    publishedAt: "2026-01-07T16:55:59Z",
    locator: "Initial incident confirmation, public-video description, and competing official accounts",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_video",
    title: "Longer video adds context before Minneapolis fatal shooting",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/minneapolis-ice-immigration-renee-good-shooting-3f2a9e26ddac9455b931fecee5989d18",
    publishedAt: "2026-01-12T22:40:27Z",
    locator: "Three-and-a-half-minute witness clip and source-family context",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_doj",
    title: "Justice Department distinguishes federal treatment of Good and Pretti shootings",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/65a963816603a08bbc9db83961dd173f",
    publishedAt: "2026-01-30T16:09:23Z",
    locator: "Reported federal decision not to open a civil-rights investigation in Good's death",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_lawsuit",
    title: "Minnesota sues for evidence in federal-agent shootings",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/5a0b98ac7173ce0e9ecc3bf9a39e3919",
    publishedAt: "2026-03-24T17:55:36Z",
    locator: "Evidence-access lawsuit and competing jurisdictional positions",
    rights: "ordinary_copyright",
  },
  {
    key: "ap_evidence",
    title: "Minnesota prosecutors obtain evidence in Renee Good investigation",
    publisher: "Associated Press",
    sourceType: "article",
    url: "https://apnews.com/article/immigration-enforcement-minnesota-alex-pretti-renee-good-21835226891f2a8d91710519b457031d",
    publishedAt: "2026-07-13T16:48:13Z",
    locator: "Current evidence-transfer reporting and ongoing state investigation",
    rights: "ordinary_copyright",
  },
  {
    key: "wapo_witness",
    title: "Witness-video analysis of the Minneapolis ICE shooting",
    publisher: "The Washington Post",
    sourceType: "article",
    url: "https://www.washingtonpost.com/investigations/2026/01/08/video-ice-shooting-minneapolis/",
    publishedAt: "2026-01-08T00:00:00Z",
    locator: "Frame-by-frame witness-view analysis of vehicle and agent topology",
    rights: "ordinary_copyright",
  },
  {
    key: "wapo_agent",
    title: "Five moments in the ICE agent's cellphone video",
    publisher: "The Washington Post",
    sourceType: "article",
    url: "https://www.washingtonpost.com/investigations/2026/01/09/moments-before-ice-shooting-minneapolis/",
    publishedAt: "2026-01-09T00:00:00Z",
    locator: "Agent-phone clip provenance, movement, commands, and unresolved contact",
    rights: "ordinary_copyright",
  },
  {
    key: "apm_response",
    title: "Synchronized review of medical response after the shooting",
    publisher: "APM Reports / MPR News",
    sourceType: "article",
    url: "https://www.apmreports.org/story/2026/01/17/ice-agents-didnt-use-cpr-after-jonathan-ross-shot-renee-macklin-good-in-minneapolis",
    publishedAt: "2026-01-17T00:00:00Z",
    locator: "Video, dispatch, and fire-record synchronization of response actions",
    rights: "ordinary_copyright",
  },
  {
    key: "bellingcat",
    title: "Multi-video analysis of the Minneapolis ICE shooting",
    publisher: "Bellingcat",
    sourceType: "article",
    url: "https://www.bellingcat.com/news/2026/01/13/analysing-footage-of-minneapolis-ice-shooting/",
    publishedAt: "2026-01-13T00:00:00Z",
    locator: "Source-family inventory and synchronized qualitative reconstruction",
    rights: "ordinary_copyright",
  },
  {
    key: "park_portland",
    title: "Park and Portland safety improvements",
    publisher: "Hennepin County",
    sourceType: "official_web_record",
    url: "https://www.hennepincounty.gov/services/roads-bridges/construction-projects/park-portland-safety-improvements",
    publishedAt: null,
    locator: "One-way road-pair context for Portland Avenue",
    rights: "unknown",
  },
  {
    key: "green_central",
    title: "Green Central Safe Routes to School project",
    publisher: "City of Minneapolis",
    sourceType: "official_web_record",
    url: "https://www.minneapolismn.gov/government/projects/green-central/",
    publishedAt: null,
    locator: "2025-complete East 34th Street walking and biking improvements",
    rights: "unknown",
  },
];

const registriesByOrigin = new Map();
for (const source of sourceDefinitions) {
  const origin = new URL(source.url).origin;
  const path = new URL(source.url).pathname.split("/").slice(0, 3).join("/") || "/";
  if (!registriesByOrigin.has(origin)) {
    registriesByOrigin.set(origin, {
      id: id("reg", registriesByOrigin.size + 301),
      displayName: new URL(origin).hostname,
      canonicalOrigin: origin,
      allowedPaths: [path],
      purpose: "Human-reviewed public-source metadata and exact locators for the private Renee Good case fixture.",
      accessClass: "manual_metadata_only",
      status: "approved_metadata_only",
      rightsMode: source.rights === "government_work_review" ? "government_work_review" : "link_only",
      storageMode: "no_bytes",
      networkUseApproved: false,
      ownerRole: "source-scope reviewer",
      reviewedAt: CREATED,
      expiresAt: "2026-10-17T14:30:00Z",
      createdAt: CREATED,
    });
  } else {
    const registry = registriesByOrigin.get(origin);
    registry.allowedPaths = [...new Set([...registry.allowedPaths, path])];
  }
}

const sourceMap = new Map();
const sources = sourceDefinitions.map((definition, index) => {
  const sourceId = id("src", index + 301);
  const rightsId = id("rgt", index + 301);
  const snapshotId = id("snap", index + 301);
  sourceMap.set(definition.key, { sourceId, rightsId, snapshotId, definition });
  return {
    id: sourceId,
    registryEntryId: registriesByOrigin.get(new URL(definition.url).origin).id,
    title: definition.title,
    publisher: definition.publisher,
    author: null,
    publishedAt: definition.publishedAt,
    sourceType: definition.sourceType,
    canonicalUrl: definition.url,
    retrievedAt: CUTOFF,
    lastCheckedAt: CUTOFF,
    rightsDecisionId: rightsId,
    locators: [{ kind: "section", value: definition.locator, label: definition.locator }],
    createdAt: CREATED,
  };
});

const sourceSnapshots = sourceDefinitions.map((definition, index) => ({
  id: id("snap", index + 301),
  sourceId: id("src", index + 301),
  checkedAt: CUTOFF,
  url: definition.url,
  httpStatus: null,
  contentHash: null,
  storageState: "metadata_only",
  limitations: "URL, publication metadata, exact locator, and restrained paraphrase only. No remote response body or source media is retained.",
  createdAt: CREATED,
}));

const rightsDecisions = sourceDefinitions.map((definition, index) => ({
  id: id("rgt", index + 301),
  subjectType: "source",
  subjectId: id("src", index + 301),
  rightsStatus: definition.rights,
  storagePermission: "metadata_only",
  displayPermission: "private_metadata",
  exportPermission: "metadata_only",
  rationale: definition.rights === "sensitive_official_record"
    ? "Use only the public cause-and-manner fields. Full medical and autopsy records are restricted and excluded."
    : "Public availability does not establish reuse permission. Store metadata, locators, and restrained factual paraphrase only.",
  reviewedAt: CREATED,
  reviewerRole: "rights-privacy compliance editor",
  basisUrls: [definition.url],
  createdAt: CREATED,
}));

const entities = [
  ["Renee Nicole Good", "person"],
  ["Jonathan Ross", "person"],
  ["U.S. Immigration and Customs Enforcement", "organization"],
  ["Minnesota Bureau of Criminal Apprehension", "organization"],
  ["Hennepin County Attorney's Office", "organization"],
  ["East 34th Street and Portland Avenue incident area", "place"],
  ["Renee Good's Honda Pilot", "object"],
  ["State of Minnesota v. U.S. Department of Justice", "concept"],
  ["Hennepin County Medical Examiner", "organization"],
].map(([canonicalName, entityType], index) => ({
  id: id("ent", index + 301),
  investigationId: I.investigation,
  canonicalName,
  entityType,
  aliases: [],
  createdAt: CREATED,
}));
const E = Object.fromEntries(entities.map((entity, index) => [index + 1, entity.id]));

const temporalDefinitions = [
  ["Diagonal vehicle position visible", "9:35:05 a.m. CST", "2026-01-07T15:35:05Z", 1, "abc_timeline", "9:35:05 timeline entry"],
  ["Additional agents approach", "9:37:08 a.m. CST", "2026-01-07T15:37:08Z", 1, "abc_timeline", "9:37:08 timeline entry"],
  ["First reported gunshot", "9:37:13 a.m. CST", "2026-01-07T15:37:13Z", 1, "abc_timeline", "9:37:13 metadata analysis"],
  ["Vehicle reaches final-rest sequence", "approximately three to five seconds after gunfire", "2026-01-07T15:37:17Z", 3, "abc_timeline", "Post-shot vehicle sequence"],
  ["Bystander physician offers assistance", "approximately 9:40:08 a.m. CST", "2026-01-07T15:40:08Z", 2, "apm_response", "Synchronized response timeline"],
  ["First municipal responder reaches vehicle", "approximately 9:43:14-9:43:34 a.m. CST", "2026-01-07T15:43:24Z", 20, "apm_response", "Fire-response synchronization"],
  ["Municipal resuscitation sequence", "approximately 9:45:30-9:47:30 a.m. CST", "2026-01-07T15:46:30Z", 120, "abc_timeline", "Visible response interval"],
  ["Initial DHS account published", "11:45:15 a.m. CST", "2026-01-07T17:45:15Z", 1, "dhs_initial", "X platform timestamp"],
  ["Medical Examiner public classification", "January 23, 2026", null, 86400, "hcme", "Case 2026-00103"],
  ["Touhy evidence demands submitted", "February 2, 2026", null, 86400, "hcao_touhy", "Official release"],
  ["Evidence-access lawsuit filed", "March 24, 2026", null, 86400, "hcao_lawsuit", "Official filing announcement"],
  ["Federal evidence and vehicle transferred", "July 13, 2026", null, 86400, "hcao_evidence", "Official evidence-sharing update"],
  ["Research cutoff", "July 17, 2026", null, 86400, "hcao_evidence", "Current-state review"],
].map(([label, originalExpression, normalizedUtc, precisionSeconds, sourceKey, locator], index) => ({
  id: id("tmp", index + 301),
  investigationId: I.investigation,
  label,
  originalExpression,
  normalizedUtc,
  missionElapsedSeconds: null,
  timeSystem: normalizedUtc ? "local_civil" : "unknown",
  precisionSeconds,
  uncertaintyLowerSeconds: precisionSeconds,
  uncertaintyUpperSeconds: precisionSeconds,
  conversionRationale: normalizedUtc
    ? "Central Standard Time normalized to UTC. Absolute seconds derive from publisher analysis or record synchronization, not an authenticated master scene clock."
    : "The source supplies a date or range without a reliable time of day; no exact instant is invented.",
  sourceId: sourceMap.get(sourceKey).sourceId,
  locator: { kind: "other", value: locator },
  createdAt: CREATED,
}));
const T = Object.fromEntries(temporalDefinitions.map((anchor, index) => [index + 1, anchor.id]));

const claimDefinitions = [
  { text: "Renee Good was fatally shot in her vehicle by ICE agent Jonathan Ross in Minneapolis on January 7, 2026.", state: "independently_corroborated", status: "The death and identity of the shooting agent are established across official state/local records and independent reporting; legal justification is a separate unresolved question.", entities: [1, 2, 3, 6, 7], sources: [["city_response", "supports", "Incident response"], ["hcao_touhy", "supports", "Ongoing investigation statement"], ["ap_initial", "contextualizes", "Incident report"]], confidence: "high", questions: [] },
  { text: "Official public records place the incident near East 34th Street and Portland Avenue in Minneapolis.", state: "authenticated_official_record", status: "Intersection-level public location; no house address or tighter private-person location is retained.", entities: [1, 6], sources: [["city_response", "supports", "Incident area"], ["hcao_touhy_pdf", "contextualizes", "Attachment location"]], confidence: "high", questions: ["What surveyed as-built control corresponds to the January 2026 street configuration?"] },
  { text: "ABC's synchronized public-video analysis places the first gunshot at approximately 9:37:13 a.m. CST and three audible reports within about 0.7 seconds.", state: "independently_corroborated", status: "Publisher-derived media timing; high value for sequence but not an authenticated evidence-clock finding.", entities: [1, 2, 6, 7], sources: [["abc_timeline", "supports", "9:37:13 metadata analysis"], ["bellingcat", "contextualizes", "Multi-video synchronization"]], confidence: "moderate", questions: ["Do original files and device clocks confirm the absolute second and inter-shot intervals?"] },
  { text: "Public video analyses show Good's SUV stopped diagonally across part of Portland Avenue while other vehicles passed.", state: "independently_corroborated", status: "Qualitative spatial observation from several published views; not a surveyed vehicle pose.", entities: [1, 6, 7], sources: [["abc_timeline", "supports", "9:35:05 timeline entry"], ["ap_video", "contextualizes", "Longer precursor video"], ["wapo_witness", "contextualizes", "Witness-video analysis"]], confidence: "high", questions: ["What exact vehicle footprint and curb coordinates are recoverable from original files and survey data?"] },
  { text: "Public recordings contain repeated directions from an approaching agent for Good to get out while another agent reached toward the driver's door area.", state: "independently_corroborated", status: "Audible/visible public-video sequence; legal authority, comprehension, and the participants' perceptions are not resolved by the recording alone.", entities: [1, 2, 3, 7], sources: [["abc_timeline", "supports", "9:37:08 timeline entry"], ["ap_video", "contextualizes", "Public-video description"], ["wapo_witness", "contextualizes", "Witness-view analysis"]], confidence: "high", questions: ["What do original audio, agent statements, and operational records establish about commands and perception?"] },
  { text: "Public video analyses show the SUV reverse briefly, then move forward while the steering wheel turned right; video alone does not establish the driver's intent.", state: "independently_corroborated", status: "Movement is source-bounded; labels such as attack, escape, or accident require additional evidence and legal analysis.", entities: [1, 2, 6, 7], sources: [["abc_timeline", "supports", "9:37:08-9:37:13 sequence"], ["wapo_agent", "contextualizes", "Agent-phone analysis"], ["bellingcat", "contextualizes", "Synchronized movement"]], confidence: "high", questions: ["What do vehicle telemetry, steering data, and original calibrated views establish?"] },
  { text: "DHS alleged that Good weaponized her vehicle, tried to kill officers, committed domestic terrorism, and was shot in self-defense.", state: "attributed_unverified", status: "Contemporaneous federal party assertion issued about two hours after the shooting; not an adjudicated or independent investigative finding.", entities: [1, 2, 3, 7], sources: [["dhs_initial", "supports", "Initial DHS statement"], ["abc_timeline", "contextualizes", "11:45 publication event"]], confidence: "high", questions: ["What evidence and review process supported each characterization when it was published?"] },
  { text: "The public footage does not show the vehicle passing over Ross and does not conclusively resolve whether brief physical contact occurred.", state: "unresolved", status: "Contact remains an open physical-evidence question; remaining upright does not exclude injury or brief contact.", entities: [2, 7], sources: [["ap_initial", "supports", "Contact ambiguity"], ["wapo_agent", "contextualizes", "Agent-phone limitation"], ["bellingcat", "contextualizes", "Multi-angle analysis"]], confidence: "moderate", questions: ["What do original frames, vehicle inspection, clothing, medical records, and scene measurements establish about contact?"] },
  { text: "Independent visual analyses place Ross near the SUV's front-left area at the first shot and increasingly alongside the vehicle as firing continued.", state: "independently_corroborated", status: "Coarse relative topology from compressed public video; not a centimeter-level pose or trajectory finding.", entities: [1, 2, 6, 7], sources: [["abc_timeline", "supports", "First-shot topology"], ["wapo_witness", "supports", "Frame-by-frame topology"], ["bellingcat", "contextualizes", "Synchronized views"]], confidence: "moderate", questions: ["Can independent originals and surveyed control produce validated pose estimates and uncertainty ellipses?"] },
  { text: "Three gunshots are audible in under one second in the published recordings; the exact bullet paths and wound correlations are not established by public video.", state: "independently_corroborated", status: "Audio count and interval are publisher-supported; ballistic sequence and trajectory require physical evidence and qualified analysis.", entities: [1, 2, 7], sources: [["abc_timeline", "supports", "Inter-shot interval analysis"], ["ap_initial", "contextualizes", "Public-video shooting sequence"]], confidence: "moderate", questions: ["What do casings, firearm examination, vehicle damage, and complete medical evidence establish?"] },
  { text: "The Medical Examiner's public data classifies Good's death as homicide caused by multiple gunshot wounds; homicide is a medical manner-of-death category, not a finding of murder or unlawful force.", state: "authenticated_official_record", status: "Public medical classification with an explicit legal-meaning boundary; graphic details and the full autopsy are excluded.", entities: [1, 9], sources: [["hcme", "supports", "Case 2026-00103 public fields"]], confidence: "high", questions: ["What non-graphic findings may lawfully be used by qualified reviewers if charging analysis requires them?"] },
  { text: "Synchronized reporting indicates federal agents briefly assessed Good but did not visibly perform CPR before municipal responders arrived roughly six minutes after the shots.", state: "independently_corroborated", status: "Source-bounded response sequence; credentials, clinical assessments, and exact CPR start remain partly unresolved.", entities: [1, 3, 6, 7], sources: [["apm_response", "supports", "Synchronized response timeline"], ["abc_timeline", "contextualizes", "9:42-9:45 response entries"], ["city_response", "contextualizes", "Municipal response summary"]], confidence: "moderate", questions: ["What do original video, responder records, and federal medical-response logs establish about assessments and treatment?"] },
  { text: "The public record does not establish whether an earlier or different medical response would have changed the outcome.", state: "unresolved", status: "Counterfactual clinical causation is outside what the public response timeline can prove.", entities: [1, 9], sources: [["apm_response", "contextualizes", "Response timeline"], ["hcme", "contextualizes", "Public cause and manner"]], confidence: "high", questions: ["Would qualified medical review of complete records support any counterfactual conclusion?"] },
  { text: "Public reporting says the Justice Department did not open a federal criminal civil-rights investigation into Good's death.", state: "independently_corroborated", status: "Federal procedural decision as publicly reported; not an adjudication that the shooting was lawful.", entities: [1, 2, 3], sources: [["ap_doj", "supports", "Good/Pretti investigation distinction"], ["hcao_touhy", "contextualizes", "Federal non-investigation statement"]], confidence: "high", questions: ["Will DOJ publish a formal closing or declination memorandum?"] },
  { text: "HCAO and BCA are conducting a state investigation and say they have not prejudged whether any law was violated.", state: "authenticated_official_record", status: "Active uncharged state investigation; investigative offenses and evidence requests are not charges or probable-cause findings.", entities: [2, 4, 5], sources: [["hcao_touhy", "supports", "Ongoing investigation"], ["hcao_evidence", "supports", "No-prejudgment and ongoing-analysis statement"]], confidence: "high", questions: ["When will HCAO publish a charging or declination decision and supporting rationale?"] },
  { text: "State and federal authorities initially contemplated joint work, but federal authorities ended evidence sharing on January 7 and state investigators reported being unable to complete a full use-of-force investigation.", state: "authenticated_official_record", status: "State institutional account of investigative coordination; separate from the merits of the shooting.", entities: [3, 4, 5], sources: [["bca_statement", "supports", "Joint-investigation reversal"], ["hcao_touhy_pdf", "contextualizes", "Investigation background"]], confidence: "high", questions: ["What federal records describe the change in coordination and its legal basis?"] },
  { text: "HCAO submitted formal demands for physical evidence, original imagery, communications, statements, medical material, policy, training, and chain-of-custody records.", state: "authenticated_official_record", status: "Evidence request establishes investigatory scope, not that every requested item exists or supports a violation.", entities: [2, 3, 4, 5, 7], sources: [["hcao_touhy", "supports", "Demand summary"], ["hcao_touhy_pdf", "supports", "Requested evidence schedule"]], confidence: "high", questions: ["Which requested categories were produced, withheld, unavailable, or never created?"] },
  { text: "Minnesota, HCAO, and BCA filed a federal action seeking access to evidence withheld by DOJ and DHS.", state: "authenticated_official_record", status: "Filed civil evidence-access litigation; allegations in pleadings are not merits findings about the shooting.", entities: [4, 5, 8], sources: [["hcao_lawsuit", "supports", "Filing announcement"], ["ap_lawsuit", "contextualizes", "Litigation report"], ["docket", "contextualizes", "Case docket"]], confidence: "high", questions: ["How will the July evidence exchange affect the still-pending action?"] },
  { text: "On July 13, state authorities announced receipt of previously withheld hard drives and Good's vehicle; HCAO said analysis began immediately and remained ongoing.", state: "authenticated_official_record", status: "Most current official evidence posture; the announcement does not itemize every file or prove production is complete.", entities: [1, 4, 5, 7, 8], sources: [["hcao_evidence", "supports", "Evidence-sharing update"], ["ap_evidence", "contextualizes", "Current reporting"]], confidence: "high", questions: ["What evidence inventory and chain-of-custody documentation will be publicly described after review?"] },
  { text: "No state charge, state declination, final independent use-of-force determination, or public final DHS report was identified by the July 17 research cutoff.", state: "unresolved", status: "Current procedural gap. Absence from reviewed public pages is not proof that no nonpublic decision or internal record exists.", entities: [2, 3, 4, 5, 8], sources: [["hcao_evidence", "supports", "Ongoing analysis"], ["docket", "contextualizes", "Pending evidence-access case"], ["ap_evidence", "contextualizes", "Current investigation report"]], confidence: "moderate", questions: ["Obtain any future charging, declination, or final administrative-review record from its official source."] },
  { text: "Public reporting does not establish whether Good-specific ICE body-camera footage exists; transferred hard drives reportedly include body-camera material from the broader Minnesota cases, but the wearer and incident are not identified.", state: "unresolved", status: "Do not mislabel Ross's handheld cellphone video as bodycam footage.", entities: [2, 3, 4], sources: [["ap_evidence", "supports", "Transferred digital evidence description"], ["wapo_agent", "contextualizes", "Handheld cellphone provenance"]], confidence: "moderate", questions: ["Which body-camera files, wearers, clocks, and incidents are represented in the transferred material?"] },
  { text: "The public visual record contains several camera families, but public copies are re-encoded and lack complete native metadata, authenticated clocks, lens calibration, and chain of custody.", state: "independently_corroborated", status: "Media-provenance limitation; analyses by different publishers may use the same underlying recordings.", entities: [1, 2, 6, 7], sources: [["bellingcat", "supports", "Camera-source inventory"], ["abc_timeline", "contextualizes", "At least four verified views"], ["ap_video", "contextualizes", "Longer video provenance"]], confidence: "high", questions: ["Can lawful originals be obtained with device metadata and creator attestations?"] },
  { text: "The present scene is a source-linked street schematic, not metric photogrammetry, collision reconstruction, ballistics, or a trajectory analysis.", state: "inferred", status: "Forensic-method conclusion for this private first pass.", entities: [1, 2, 6, 7], sources: [["abc_timeline", "contextualizes", "Published spatial sequence"], ["bellingcat", "contextualizes", "Multi-view limitations"], ["park_portland", "contextualizes", "Road topology"], ["green_central", "contextualizes", "Recent street changes"]], confidence: "high", questions: ["Can original independent files, surveyed as-built control, vehicle scans, and physical evidence support a validated reconstruction?"] },
  { text: "DHS use-of-force policy supplies an evaluative standard for deadly force and moving vehicles, but the policy alone does not establish compliance or violation in this incident.", state: "authenticated_official_record", status: "Policy context only; legal and factual application remains under investigation.", entities: [2, 3, 7], sources: [["dhs_policy", "supports", "Deadly force and moving-vehicle provisions"], ["hcao_touhy_pdf", "contextualizes", "Requested policy/training material"]], confidence: "high", questions: ["What operative training, briefings, and officer-perception evidence apply to the encounter?"] },
];

const confidenceRange = { high: [0.82, 0.96], moderate: [0.5, 0.78], low: [0.2, 0.45] };
const claims = [];
const claimRevisions = [];
const claimSourceRelationships = [];
const confidenceAssessments = [];

claimDefinitions.forEach((definition, claimIndex) => {
  const claimId = id("clm", claimIndex + 301);
  const revisionId = id("clmr", claimIndex + 301);
  const confidenceId = id("conf", claimIndex + 301);
  claims.push({ id: claimId, investigationId: I.investigation, currentRevisionId: revisionId, entityIds: definition.entities.map((value) => E[value]), evidenceState: definition.state, proceduralStatus: definition.status, confidenceAssessmentIds: [confidenceId], unresolvedQuestions: definition.questions, createdAt: CREATED });
  claimRevisions.push({ id: revisionId, claimId, revisionNumber: 1, text: definition.text, claimant: "Forensic Crawler first-pass analysis", changeReason: "Initial source-bounded case synthesis.", createdAt: CREATED });
  const range = confidenceRange[definition.confidence];
  confidenceAssessments.push({ id: confidenceId, subjectType: "claim", subjectId: claimId, descriptor: definition.confidence, lowerBound: range[0], upperBound: range[1], method: "Editorial descriptor based on source status, independence, precision, and access to underlying evidence; bounds are review aids, not statistical probabilities.", rationale: definition.status, uncertainty: definition.questions, assessedAt: CREATED, assessorRole: "forensic integration editor", createdAt: CREATED });
  definition.sources.forEach(([sourceKey, relationshipFunction, locator], relationshipIndex) => {
    const source = sourceMap.get(sourceKey);
    claimSourceRelationships.push({
      id: id("rel", claimIndex * 30 + relationshipIndex + 301),
      claimId,
      sourceId: source.sourceId,
      sourceSnapshotId: source.snapshotId,
      function: relationshipFunction,
      locator: { kind: "other", value: locator },
      rationale: `This locator ${relationshipFunction.replaceAll("_", " ")} the current text without converting official rhetoric, litigation allegations, or publisher analysis into an adjudicated finding.`,
      independenceNote: ["abc_timeline", "ap_initial", "ap_video", "ap_doj", "ap_lawsuit", "ap_evidence", "wapo_witness", "wapo_agent", "apm_response", "bellingcat"].includes(sourceKey)
        ? "Editorially independent analysis or reporting, but it may use the same underlying public videos, records, or official statements as other sources."
        : "Official, medical, policy, or litigation source; direct for what the institution recorded or asserted, not presumed neutral or independently corroborative of disputed conduct.",
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
  { label: "Incident intersection region", geometry: { type: "local-region", center: [0, 0, 0], radiusMeters: 18 }, uncertaintyMeters: 18, method: "Intersection-level placement from official records; no house address or geodetic coordinate retained.", relationships: [relationFor(2, "city_response")] },
  { label: "Initial diagonal SUV region", geometry: { type: "topological-pose", displayCenter: [-2, -16, 0], orientation: "diagonal across part of avenue" }, uncertaintyMeters: 6, method: "Qualitative publisher-verified video topology; not a surveyed pose.", relationships: [relationFor(4, "abc_timeline")] },
  { label: "Agent approach region", geometry: { type: "topological-zone", displayCenter: [2, -13, 0], radiusMeters: 5 }, uncertaintyMeters: 5, method: "Coarse relative placement from synchronized public views.", relationships: [relationFor(5, "abc_timeline")] },
  { label: "Ross first-shot region", geometry: { type: "topological-zone", displayCenter: [-4, -8, 0], radiusMeters: 4 }, uncertaintyMeters: 4, method: "Front-left qualitative topology; not a body-pose or trajectory solution.", relationships: [relationFor(9, "abc_timeline"), relationFor(9, "wapo_witness")] },
  { label: "Vehicle motion corridor", geometry: { type: "qualitative-path", points: [[-2, -16, 0], [-2, -20, 0], [1, -10, 0], [8, 4, 0]] }, uncertaintyMeters: 8, method: "Display-only reverse-then-forward/right topology; distances and curvature are not measurements.", relationships: [relationFor(6, "abc_timeline")] },
  { label: "Vehicle final-rest region", geometry: { type: "topological-zone", displayCenter: [9, 9, 0], radiusMeters: 9 }, uncertaintyMeters: 9, method: "Nearby post-shot crash region; no address, exact obstacle, or surveyed pose retained.", relationships: [relationFor(3, "abc_timeline")] },
  { label: "Witness-camera family A", geometry: { type: "camera-zone", displayCenter: [-14, -8, 1.6] }, uncertaintyMeters: 12, method: "Illustrative camera zone; exact witness position, orientation, lens, and identity withheld or unknown.", relationships: [relationFor(22, "bellingcat")] },
  { label: "Witness-camera family B", geometry: { type: "camera-zone", displayCenter: [13, -5, 1.6] }, uncertaintyMeters: 12, method: "Illustrative camera zone; exact witness position, orientation, lens, and identity withheld or unknown.", relationships: [relationFor(22, "bellingcat")] },
  { label: "Federal-agent handheld camera", geometry: { type: "body-carried-handheld-source", displayCenter: [-4, -8, 1.6] }, uncertaintyMeters: 5, method: "Attached to a coarse agent region only; it is a cellphone source, not authenticated body-camera footage.", relationships: [relationFor(21, "wapo_agent")] },
  { label: "Municipal medical-response region", geometry: { type: "topological-zone", displayCenter: [9, 9, 0], radiusMeters: 12 }, uncertaintyMeters: 12, method: "Response zone synchronized to public recordings and public records; not a clinical treatment reconstruction.", relationships: [relationFor(12, "apm_response")] },
].map((definition, index) => ({
  id: id("spa", index + 301),
  investigationId: I.investigation,
  label: definition.label,
  geometry: definition.geometry,
  crs: "STREET_FRAME_V1_RELATIONAL_LOCAL_METERS_NOT_GEOREFERENCED",
  uncertaintyMeters: definition.uncertaintyMeters,
  method: definition.method,
  sourceRelationshipIds: definition.relationships,
  createdAt: CREATED,
}));
const S = Object.fromEntries(spatialAnchors.map((anchor, index) => [index + 1, anchor.id]));

const observations = [
  ["Published video analyses show an SUV diagonally occupying part of Portland Avenue while other vehicles passed.", "independently_corroborated", "abc_timeline", "9:35:05 sequence", [1, 6, 7], [1], [1, 2]],
  ["Published recordings show federal agents approach the driver's side and contain repeated directions to exit.", "independently_corroborated", "abc_timeline", "9:37:08 sequence", [1, 2, 3, 7], [2], [3]],
  ["Synchronized analyses show a brief reverse followed by forward/right movement before the shooting.", "independently_corroborated", "bellingcat", "Qualitative synchronized movement", [1, 2, 7], [2, 3], [4, 5]],
  ["Three reports occur in under one second in publisher analysis; no public-media trajectory solve is available.", "independently_corroborated", "abc_timeline", "Inter-shot timing", [1, 2, 7], [3], [4]],
  ["Published response synchronization shows a brief federal assessment, help offers, and later municipal response.", "independently_corroborated", "apm_response", "Response synchronization", [1, 3, 6, 7], [5, 6, 7], [6, 10]],
  ["The January 2026 street form includes recent East 34th walking and biking changes that older basemaps may not show.", "authenticated_official_record", "green_central", "Completed project context", [6], [], [1]],
].map(([description, evidenceState, sourceKey, locator, entityNumbers, temporalNumbers, spatialNumbers], index) => ({
  id: id("obs", index + 301),
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
  coordinateSystem: "STREET_FRAME_V1 relational local meters; not georeferenced or metric-validated",
  sourceReportedValues: {
    shotTime: "approximately 9:37:13 a.m. CST",
    interShotIntervalsSeconds: [0.399, 0.299],
    municipalArrivalExpression: "approximately 9:43:14-9:43:34 a.m. CST",
  },
  fixedFacts: ["intersection-level incident area", "qualitative reverse-then-forward/right sequence", "three reported gunshots", "vehicle reaches a nearby final-rest region"],
  attributedClaims: ["DHS vehicle-weaponization account", "DHS self-defense account", "DHS domestic-terrorism characterization"],
  unknowns: ["driver intent", "exact physical contact", "vehicle speed", "agent body pose", "bullet trajectories", "camera intrinsics", "native clock offsets", "surveyed road and vehicle control", "Good-specific ICE body-camera existence"],
  prohibitedInferences: ["intent from motion alone", "lawfulness from an agency statement", "contact or injury from a compressed frame", "trajectory from sightline", "counterfactual survivability", "identity from pixels", "graphic injury reconstruction"],
};

const reconstructionScene = {
  schema: "forensic-crawler.scene/1",
  title: "Renee Good killing - schematic public-record reconstruction",
  status: "WORKING - QUALITATIVE STREET SCHEMATIC, NOT PHOTOGRAMMETRIC OR COURT-VALIDATED",
  coordinateSystem: { id: "STREET_FRAME_V1", units: "display meters", georeferenced: false, northAligned: false, origin: "intersection-level incident region; display Y follows Portland Avenue" },
  calibration: { metricPhotogrammetry: false, originalImages: false, cameraIntrinsics: false, surveyedControl: false, collisionValidated: false, trajectoryValidated: false },
  layers: [
    { id: "context", label: "Parametric street context", class: "PARAMETRIC_PLACEHOLDER", color: "#28323b" },
    { id: "observed", label: "Publisher-verified observations", class: "OBSERVED_SOURCE_STATED", color: "#e6c779" },
    { id: "federal", label: "Attributed federal account", class: "ATTRIBUTED_UNVERIFIED", color: "#ef8f62" },
    { id: "analysis", label: "Independent analysis", class: "INDEPENDENTLY_CORROBORATED", color: "#6aa8d8" },
    { id: "uncertainty", label: "Unresolved / prohibited inference", class: "UNRESOLVED", color: "#d56b78" },
  ],
  objects: [
    { id: "ground", type: "plane", center: [0, 0, 0], size: [86, 126], layer: "context", label: "Illustrative local ground plane" },
    { id: "portland", type: "box", center: [0, 0, 0.04], size: [18, 112, 0.08], layer: "context", label: "Portland Avenue one-way corridor - width illustrative" },
    { id: "east-34th", type: "box", center: [0, 0, 0.06], size: [76, 14, 0.08], layer: "context", label: "East 34th Street cross corridor - width illustrative" },
    { id: "bike-walk", type: "box", center: [0, -4, 0.11], size: [74, 2.2, 0.05], layer: "context", label: "Recent walking/biking context - schematic only" },
    { id: "initial-suv-zone", type: "disc", center: [-2, -16, 0.12], radius: 5.5, layer: "observed", label: "Initial diagonal SUV region - pose not measured" },
    { id: "initial-suv", type: "box", center: [-2, -16, 1], size: [2.2, 4.8, 1.8], layer: "observed", label: "SUV placeholder - orientation and dimensions illustrative" },
    { id: "approach-region", type: "disc", center: [2, -13, 0.15], radius: 4.5, layer: "observed", label: "Agent approach / driver's-side region" },
    { id: "ross-first-shot", type: "marker", center: [-4, -8, 1.6], layer: "analysis", label: "Ross coarse first-shot region - front-left topology" },
    { id: "other-agent", type: "marker", center: [2, -12, 1.6], layer: "observed", label: "Second-agent coarse region" },
    { id: "vehicle-motion", type: "path", points: [[-2, -16, 0.3], [-2, -20, 0.3], [1, -10, 0.3], [8, 4, 0.3]], layer: "analysis", label: "Qualitative reverse then forward/right corridor - not speed or collision analysis" },
    { id: "federal-vehicle-account", type: "path", points: [[-2, -16, 0.38], [-2, -20, 0.38], [1, -10, 0.38], [8, 4, 0.38]], layer: "federal", label: "DHS-attributed vehicle weaponization account - not a finding" },
    { id: "contact-unknown", type: "disc", center: [-3, -8, 0.2], radius: 4.5, layer: "uncertainty", label: "Contact / injury unresolved zone" },
    { id: "trajectory-prohibited", type: "disc", center: [-1, -6, 0.24], radius: 9, layer: "uncertainty", label: "No trajectory volume drawn: physical evidence unavailable" },
    { id: "final-rest", type: "box", center: [9, 9, 1], size: [2.2, 4.8, 1.8], layer: "observed", label: "Vehicle final-rest region - exact pose withheld/unknown" },
    { id: "camera-a", type: "marker", center: [-14, -8, 2], layer: "analysis", label: "Witness-camera family A - exact position unknown" },
    { id: "camera-b", type: "marker", center: [13, -5, 2], layer: "analysis", label: "Witness-camera family B - exact position unknown" },
    { id: "agent-phone", type: "marker", center: [-4, -8, 2.3], layer: "analysis", label: "Agent handheld phone source - not bodycam" },
    { id: "response-zone", type: "disc", center: [9, 9, 0.2], radius: 11, layer: "observed", label: "Municipal medical-response region - no clinical counterfactual" },
  ],
  cameraPresets: [
    { id: "overview", label: "Overview", position: [70, -78, 66], target: [0, -2, 0] },
    { id: "encounter", label: "Encounter topology", position: [28, -48, 24], target: [-1, -11, 1] },
    { id: "cameras", label: "Camera families", position: [40, -30, 32], target: [0, -8, 1] },
    { id: "response", label: "Final-rest / response", position: [38, -22, 28], target: [8, 7, 0] },
  ],
  limitations: [
    "No rights-cleared native multi-view set, authenticated master clock, or complete chain of custody was available.",
    "Road widths, vehicle dimensions, display orientation, paths, camera positions, and all distances are illustrative.",
    "The display separates observed motion from the DHS account; neither layer establishes intent or legal justification.",
    "No bullet path, wound path, collision solve, vehicle speed, physical-contact determination, or clinical counterfactual is shown.",
    "No faces, children, graphic injury, private addresses, plates, witness positions, or sensitive tactical detail are included.",
  ],
};

const inputPath = "fixtures/pilots/renee-good-killing/local/reconstruction-inputs.json";
const scenePath = "fixtures/pilots/renee-good-killing/local/reconstruction-scene.json";
const inputText = canonicalStringify(sceneInputs);
const sceneText = canonicalStringify(reconstructionScene);
writeJson(inputPath, sceneInputs);
writeJson(scenePath, reconstructionScene);

const assets = [{
  id: I.asset,
  investigationId: I.investigation,
  title: "Project-authored qualitative street reconstruction",
  mediaType: "dataset",
  sourceIds: ["abc_timeline", "bellingcat", "wapo_witness", "wapo_agent", "apm_response", "park_portland", "green_central"].map((key) => sourceMap.get(key).sourceId),
  rightsDecisionId: id("rgt", 401),
  createdAt: CREATED,
}];

rightsDecisions.push({
  id: id("rgt", 401),
  subjectType: "asset",
  subjectId: I.asset,
  rightsStatus: "project_authored",
  storagePermission: "permitted_bytes",
  displayPermission: "private_bytes",
  exportPermission: "project_bytes",
  rationale: "Project-authored JSON contains no copied source pixels, bodies, or graphic material. External release still requires qualified rights, privacy, legal, and editorial review.",
  reviewedAt: CREATED,
  reviewerRole: "rights-privacy compliance editor",
  basisUrls: [sourceMap.get("abc_timeline").definition.url, sourceMap.get("green_central").definition.url],
  createdAt: CREATED,
});

const assetCaptures = [
  { id: I.captureInput, assetId: I.asset, capturedAt: CREATED, acquisitionMethod: "Human-authored source-bounded parameter register", softwareVersion: "forensic-crawler-scene/1.0.0", sha256: sha256(inputText), byteSize: Buffer.byteLength(inputText), mimeType: "application/json", storageState: "permitted", localPath: inputPath, createdAt: CREATED },
  { id: I.captureScene, assetId: I.asset, capturedAt: CREATED, acquisitionMethod: "Deterministic qualitative-scene normalization", softwareVersion: "forensic-crawler-scene/1.0.0", sha256: sha256(sceneText), byteSize: Buffer.byteLength(sceneText), mimeType: "application/json", storageState: "permitted", localPath: scenePath, createdAt: CREATED },
];

const assetTransformations = [{
  id: I.transformation,
  assetId: I.asset,
  inputCaptureId: I.captureInput,
  outputCaptureId: I.captureScene,
  method: "Map source-bounded qualitative street relationships into a non-georeferenced display frame while preserving attributed federal assertions and unresolved questions on separate layers.",
  softwareVersion: "forensic-crawler-scene/1.0.0",
  parameters: { coordinateSystem: "STREET_FRAME_V1", georeferenced: false, metricPhotogrammetry: false, inferIntent: false, solveTrajectory: false },
  operator: "local deterministic fixture builder",
  createdAt: CREATED,
}];

const assetSourceRelationships = ["abc_timeline", "bellingcat", "wapo_witness", "wapo_agent", "apm_response", "park_portland", "green_central"].map((sourceKey, index) => ({
  id: id("asrel", index + 301),
  assetId: I.asset,
  sourceId: sourceMap.get(sourceKey).sourceId,
  function: "derives_from",
  locator: { kind: "other", value: sourceMap.get(sourceKey).definition.locator },
  createdAt: CREATED,
}));

const reconstructionDefinitions = [
  ["Intersection and street-form context", "illustrative", [1, 6]],
  ["Initial vehicle and agent topology", "observed", [1, 2, 3]],
  ["Vehicle movement corridor", "observed", [3]],
  ["Attributed federal vehicle account", "disputed", [2, 3]],
  ["Camera-source family placeholders", "illustrative", [3]],
  ["Final-rest and response region", "observed", [5]],
  ["Contact and trajectory exclusion zones", "disputed", [3, 4]],
].map(([label, elementClass, observationNumbers], index) => ({ label, elementClass, observationNumbers, elementId: id("rec", index + 301), revisionId: id("recr", index + 301) }));

const reconstructionElements = reconstructionDefinitions.map((definition) => ({
  id: definition.elementId,
  investigationId: I.investigation,
  label: definition.label,
  elementClass: definition.elementClass,
  observationIds: definition.observationNumbers.map((number) => observations[number - 1].id),
  assetTransformationIds: [I.transformation],
  currentRevisionId: definition.revisionId,
  createdAt: CREATED,
}));

const reconstructionRevisions = reconstructionDefinitions.map((definition) => ({
  id: definition.revisionId,
  elementId: definition.elementId,
  revisionNumber: 1,
  method: "Source-linked qualitative construction in a relational local street frame; no pixel-derived photogrammetry, collision, ballistic, or intent solve.",
  parameters: { sceneCaptureId: I.captureScene, evidenceClass: definition.elementClass, metricClaim: false },
  inputIds: [...definition.observationNumbers.map((number) => observations[number - 1].id), I.captureInput],
  outputHash: sha256(sceneText),
  uncertainty: reconstructionScene.limitations,
  createdAt: CREATED,
}));

const contradictions = [
  { title: "Road obstruction terminology", claimIds: [C[4], C[7]], temporalAnchorIds: [T[1], T[8]], description: "Video analyses show partial diagonal obstruction while other vehicles passed; DHS characterized the vehicle as having been used to block the road. Both source expressions remain visible.", status: "explained", alternatives: ["Different temporal slices", "Different operational and ordinary-language meanings of block", "Rhetorical compression in the initial account"] },
  { title: "Vehicle intent and weaponization", claimIds: [C[6], C[7]], temporalAnchorIds: [T[2], T[3], T[8]], description: "Observed reverse/forward/right movement does not by itself establish the DHS allegations of deliberate weaponization or attempted killing.", status: "open", alternatives: ["Intentional escape", "Intentional assault", "Panic or steering error", "A mixed or changing intent"] },
  { title: "Physical contact with agent", claimIds: [C[7], C[8]], temporalAnchorIds: [T[2], T[3]], description: "The federal account invoked danger to officers; public views do not show a run-over and do not conclusively resolve brief contact or injury.", status: "open", alternatives: ["No contact", "Brief upper-body contact", "Contact not visible in compressed views"] },
  { title: "Agent position during firing", claimIds: [C[7], C[9]], temporalAnchorIds: [T[2], T[3]], description: "Independent analyses place Ross near the front-left and increasingly alongside; the public record cannot recover a complete body pose or legal perception from that topology alone.", status: "open", alternatives: ["View-dependent occlusion", "Rapid relative movement", "Different reference points for front versus side"] },
  { title: "Federal and state investigative posture", claimIds: [C[14], C[15], C[16]], temporalAnchorIds: [T[10], T[13]], description: "DOJ reportedly did not open a federal civil-rights investigation while the state investigation continued after federal evidence access was curtailed.", status: "explained", alternatives: ["Different sovereign investigative authority", "Different offense and review scopes"] },
  { title: "Evidence access over time", claimIds: [C[16], C[17], C[18], C[19]], temporalAnchorIds: [T[10], T[11], T[12]], description: "The state moved from curtailed access, to formal demands and litigation, to receipt of hard drives and the vehicle. The July transfer does not prove every requested item was produced.", status: "superseded", alternatives: ["Substantial but incomplete production", "Staged exchange", "Remaining dispute over inventory or access terms"] },
  { title: "Medical response timing and treatment", claimIds: [C[12], C[13]], temporalAnchorIds: [T[5], T[6], T[7]], description: "Public synchronizations broadly align on delayed visible municipal resuscitation but vary on exact CPR-start labeling; outcome causation remains unproved.", status: "open", alternatives: ["Different visibility thresholds", "Different clinical-action definitions", "Clock offset between records and recordings"] },
  { title: "Medical homicide versus legal culpability", claimIds: [C[11], C[20]], temporalAnchorIds: [T[9], T[13]], description: "The Medical Examiner's homicide classification records death caused by another person; it does not answer murder, criminal liability, or justification.", status: "explained", alternatives: ["Medical and legal classifications answer different questions"] },
].map((definition, index) => ({
  id: id("ctr", index + 301),
  investigationId: I.investigation,
  title: definition.title,
  claimIds: definition.claimIds,
  temporalAnchorIds: definition.temporalAnchorIds,
  description: definition.description,
  magnitudeSeconds: null,
  status: definition.status,
  alternateExplanations: definition.alternatives,
  reviewStatus: "working",
  createdAt: CREATED,
}));

const events = [
  ["Vehicle visible in diagonal position", "Publisher synchronization shows Good's SUV partly across Portland Avenue while traffic could pass.", [1, 6, 7], [1]],
  ["Federal agents approach", "Recordings show agents exit a federal vehicle and approach the driver's side with repeated directions to exit.", [1, 2, 3, 7], [2]],
  ["Fatal shooting", "Publisher analysis places three reports in under one second beginning at approximately 9:37:13 a.m.; trajectory and legal justification remain unresolved.", [1, 2, 3, 6, 7], [3]],
  ["Vehicle reaches nearby final-rest region", "The SUV continues and crashes nearby within seconds of the gunfire.", [1, 6, 7], [4]],
  ["Bystander physician offers assistance", "Synchronized reporting records a bystander identifying as a physician offering help.", [1, 3, 6], [5]],
  ["Municipal responders arrive", "Public synchronization places the first municipal/fire responder at the vehicle roughly six minutes after the shots.", [1, 6], [6]],
  ["Municipal resuscitation sequence", "Published synchronization shows municipal lifesaving efforts; exact CPR-start terminology differs.", [1, 6, 9], [7]],
  ["Initial DHS account", "DHS publishes claims of vehicle weaponization, attempted killing, domestic terrorism, and self-defense; these remain attributed.", [1, 2, 3, 7], [8]],
  ["Medical Examiner classification", "Public ME data records multiple gunshot wounds and manner of death as homicide; this is not a legal culpability finding.", [1, 9], [9]],
  ["Formal state evidence demands", "HCAO submits Touhy demands for federal evidence needed by the state investigation.", [2, 3, 4, 5, 7], [10]],
  ["Evidence-access lawsuit filed", "Minnesota, HCAO, and BCA file a federal action seeking access to evidence.", [4, 5, 8], [11]],
  ["Federal evidence and vehicle transferred", "State authorities announce receipt of hard drives and Good's vehicle and begin analysis without prejudgment.", [1, 4, 5, 7, 8], [12]],
  ["Research cutoff", "No public state charge, declination, final independent use-of-force determination, or final DHS report was identified.", [2, 3, 4, 5, 8], [13]],
].map(([title, description, entityNumbers, temporalNumbers], index) => ({
  id: id("evt", index + 301),
  investigationId: I.investigation,
  title,
  description,
  entityIds: entityNumbers.map((number) => E[number]),
  temporalAnchorIds: temporalNumbers.map((number) => T[number]),
  createdAt: CREATED,
}));

const editorialReviews = [
  { reviewType: "source", subjects: sources.map((source) => source.id), findings: ["Twenty-four exact public locators are registered with retrieval metadata.", "Current official posture is separated from contemporaneous agency claims and publisher analysis."], limitations: ["No remote source body, paid docket record, or authenticated account content is retained.", "Search-negative procedural statements may require future refresh."] },
  { reviewType: "rights", subjects: [...sources.map((source) => source.id), I.asset], findings: ["Copyrighted video and reporting are metadata/link-only.", "The 3D scene contains project-authored geometry and no source pixels, graphic imagery, faces, plates, or private addresses."], limitations: ["Public release requires item-specific qualified rights, privacy, legal, and editorial review."] },
  { reviewType: "forensic", subjects: reconstructionElements.map((element) => element.id), findings: ["Scene is qualitative, relational, non-georeferenced, and source-linked.", "Attributed federal claims and unresolved questions occupy distinct layers.", "No trajectory, collision, intent, identity, or clinical-causation solve is claimed."], limitations: reconstructionScene.limitations },
  { reviewType: "editorial", subjects: claims.map((claim) => claim.id), findings: ["The shooting agent is identified as an uncharged subject of an open state investigation.", "Homicide is labeled as a medical category, not murder.", "Initial DHS claims remain attributed and are not presented as findings."], limitations: ["No external publication is approved.", "Future charging, declination, court, or administrative records may change the posture."] },
  { reviewType: "security", subjects: [I.investigation, I.asset], findings: ["No crawler, outreach, authentication bypass, private-person research, deployment, or publication was performed.", "No graphic media or sensitive location detail was ingested."], limitations: ["A production private workspace still requires authentication, authorization, encryption, audit, retention, and egress controls."] },
].map((definition, index) => ({
  id: id("rev", index + 301),
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
  slug: "renee-good-killing",
  title: "Renee Good killing - public-record reconstruction",
  status: "working",
  purpose: "Build a provenance-first, non-graphic first-pass reconstruction of the January 7, 2026 fatal federal-agent shooting of Renee Good while preserving disputed intent, current uncharged investigative posture, source conflicts, rights limits, response chronology, and spatial uncertainty.",
  scope: ["Lawful public sources through July 17, 2026", "Incident and response chronology", "Current federal/state investigative posture", "Visual-source lineage", "Qualitative 3D street reconstruction", "Contradictions, corrections, rights, dignity, privacy, and evidence gaps"],
  createdAt: CREATED,
  updatedAt: CUTOFF,
};

const auditEvents = sealAuditEvents([
  { id: id("aud", 301), investigationId: I.investigation, sequence: 1, eventType: "case_scope_authorized", actorType: "human_role", actorId: "project owner via Codex task", occurredAt: CREATED, subjectIds: [I.investigation], details: { publicResearch: true, localImplementation: true, publication: false, outreach: false, accessBypass: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 302), investigationId: I.investigation, sequence: 2, eventType: "official_chronology_rights_and_spatial_research_reconciled", actorType: "human_role", actorId: "delegated research roles", occurredAt: CREATED, subjectIds: sources.map((source) => source.id), details: { remoteBodiesRetained: false, paidDocketAccess: false, graphicMediaExcluded: true }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 303), investigationId: I.investigation, sequence: 3, eventType: "claims_and_contradictions_recorded", actorType: "human_role", actorId: "forensic integration editor", occurredAt: CREATED, subjectIds: [...claims.map((claim) => claim.id), ...contradictions.map((item) => item.id)], details: { criminalChargeIdentified: false, legalJustificationAdjudicated: false, sourceConflictsFlattened: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 304), investigationId: I.investigation, sequence: 4, eventType: "qualitative_scene_built", actorType: "local_tool", actorId: "forensic-crawler-scene/1.0.0", occurredAt: CREATED, subjectIds: [I.asset, I.captureInput, I.captureScene, I.transformation, ...reconstructionElements.map((element) => element.id)], details: { photogrammetry: false, georeferenced: false, collisionSolved: false, trajectorySolved: false, copiedSourcePixels: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 305), investigationId: I.investigation, sequence: 5, eventType: "rights_privacy_forensic_and_editorial_reviews_recorded", actorType: "human_role", actorId: "review roles", occurredAt: CREATED, subjectIds: editorialReviews.map((review) => review.id), details: { publicReleaseApproved: false, personalDataIncluded: false, qualifiedLegalReviewComplete: false }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
  { id: id("aud", 306), investigationId: I.investigation, sequence: 6, eventType: "working_package_assembled", actorType: "local_tool", actorId: "forensic-crawler-package/1.0.0", occurredAt: CREATED, subjectIds: [I.package, I.investigation], details: { schemaVersion: "1.0.0", status: "working", researchCutoff: CUTOFF }, previousHash: null, eventHash: "0".repeat(64), createdAt: CREATED },
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

writeJson("fixtures/pilots/renee-good-killing/forensic-package.json", data);
console.log(`Wrote Renee Good pilot with ${claims.length} claims, ${sources.length} sources, ${contradictions.length} contradictions, and ${events.length} timeline events.`);
