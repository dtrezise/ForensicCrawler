import { Fragment, lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  BookOpen,
  Box,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileJson2,
  Fingerprint,
  GitCompareArrows,
  Info,
  Landmark,
  Layers3,
  LockKeyhole,
  Menu,
  Maximize2,
  Minimize2,
  MousePointer2,
  Network,
  PanelRightClose,
  Plus,
  Radar,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import apolloFixture from "../fixtures/pilots/apollo-11-landing/forensic-package.json";
import apolloPackageUrl from "../fixtures/pilots/apollo-11-landing/forensic-package.json?url";
import kirkFixture from "../fixtures/pilots/charlie-kirk-assassination/forensic-package.json";
import kirkPackageUrl from "../fixtures/pilots/charlie-kirk-assassination/forensic-package.json?url";
import kirkSceneFixture from "../fixtures/pilots/charlie-kirk-assassination/local/reconstruction-scene.json";
import goodFixture from "../fixtures/pilots/renee-good-killing/forensic-package.json";
import goodPackageUrl from "../fixtures/pilots/renee-good-killing/forensic-package.json?url";
import goodSceneFixture from "../fixtures/pilots/renee-good-killing/local/reconstruction-scene.json";
import vesselsFixture from "../fixtures/pilots/southern-spear-vessel-strikes/forensic-package.json";
import vesselsPackageUrl from "../fixtures/pilots/southern-spear-vessel-strikes/forensic-package.json?url";
import vesselsSceneFixture from "../fixtures/pilots/southern-spear-vessel-strikes/local/reconstruction-scene.json";
import { auditChainIsLinked, findClaimText, labelize, shortHash } from "./lib/model";
import { createResearchIntake, findDuplicateSubject, loadResearchIntakes, PREPARATION_STAGES, type DuplicateMatch, type ResearchIntake, type SubjectCandidate } from "./intake";
import type {
  Claim,
  Contradiction,
  ForensicPackage,
  ReconstructionSceneData,
  Source,
  TemporalAnchor,
} from "./types";

const ReconstructionScene = lazy(() => import("./ReconstructionScene").then((module) => ({ default: module.ReconstructionScene })));

type View = "briefing" | "timeline" | "evidence" | "reconstruction" | "contradictions" | "provenance" | "rights" | "intake" | "compare" | "export";
type Selection = { kind: "source" | "claim" | "contradiction" | "anchor" | "audit" | "scene"; id: string };
type CaseKey = "vessels" | "good" | "kirk" | "apollo";

interface ProceduralStage {
  label: string;
  state?: "complete" | "current";
}

interface CaseDefinition {
  key: CaseKey;
  shortTitle: string;
  data: ForensicPackage;
  packageUrl: string;
  filename: string;
  reportUrl: string;
  pdfUrl: string;
  scene: ReconstructionSceneData | null;
  cutoff: string;
  timeZone: string;
  boundaryNote: string;
  procedural: {
    title: string;
    claimIndex: number;
    stages: ProceduralStage[];
  };
  banner?: {
    title: string;
    detail: string;
    claimIndex: number;
  };
  readinessLabel: string;
}

const publicAssetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const CASES: CaseDefinition[] = [
  {
    key: "vessels",
    shortTitle: "Southern Spear · vessel strikes",
    data: vesselsFixture as ForensicPackage,
    packageUrl: vesselsPackageUrl,
    filename: "southern-spear-vessel-strikes.forensic-package.working.json",
    reportUrl: publicAssetPath("reports/SOUTHERN_SPEAR_VESSEL_STRIKES_FIRST_PASS.md"),
    pdfUrl: publicAssetPath("pdf/SOUTHERN_SPEAR_VESSEL_STRIKES_FIRST_PASS.pdf"),
    scene: vesselsSceneFixture as unknown as ReconstructionSceneData,
    cutoff: "17 Jul 2026",
    timeZone: "UTC",
    boundaryNote: "This establishes a source-linked public campaign record and representative incidents. It does not establish any vessel's cargo, occupants, organization membership, precise maritime zone, threat status, legal justification, or the campaign's lawfulness.",
    procedural: {
      title: "No campaign-legality merits ruling",
      claimIndex: 19,
      stages: [{ label: "Campaign record", state: "complete" }, { label: "OIG oversight", state: "current" }, { label: "Civil litigation", state: "current" }, { label: "Final legality finding" }],
    },
    banner: {
      title: "Campaign-wide record · not all strikes in Venezuela",
      detail: "The documented vessel campaign spans the Caribbean and eastern Pacific. SOUTHCOM says no complete public accounting is available; target, cargo, casualty, survivor, maritime-zone, and legal claims remain source-specific.",
      claimIndex: 11,
    },
    readinessLabel: "Source states and maritime-zone hypotheses",
  },
  {
    key: "good",
    shortTitle: "Renee Good · Minneapolis",
    data: goodFixture as ForensicPackage,
    packageUrl: goodPackageUrl,
    filename: "renee-good-killing.forensic-package.working.json",
    reportUrl: publicAssetPath("reports/RENEE_GOOD_KILLING_FIRST_PASS.md"),
    pdfUrl: publicAssetPath("pdf/RENEE_GOOD_KILLING_FIRST_PASS.pdf"),
    scene: goodSceneFixture as unknown as ReconstructionSceneData,
    cutoff: "17 Jul 2026",
    timeZone: "America/Chicago",
    boundaryNote: "This establishes the fatal shooting and the identified shooting agent. It does not establish intent, physical contact, legal justification, criminal liability, or whether an earlier medical response would have changed the outcome.",
    procedural: {
      title: "No charging decision",
      claimIndex: 19,
      stages: [{ label: "Incident", state: "complete" }, { label: "Federal decision", state: "complete" }, { label: "State review", state: "current" }, { label: "Charging decision" }],
    },
    banner: {
      title: "Open state investigation · no charging decision",
      detail: "HCAO announced receipt of federal hard drives and Good's vehicle on 13 Jul; analysis remains ongoing and no state charge, declination, or final independent use-of-force finding was identified through 17 Jul.",
      claimIndex: 19,
    },
    readinessLabel: "Competing spatial accounts",
  },
  {
    key: "kirk",
    shortTitle: "Charlie Kirk · UVU",
    data: kirkFixture as ForensicPackage,
    packageUrl: kirkPackageUrl,
    filename: "charlie-kirk-assassination.forensic-package.working.json",
    reportUrl: publicAssetPath("reports/CHARLIE_KIRK_ASSASSINATION_FIRST_PASS.md"),
    pdfUrl: publicAssetPath("pdf/CHARLIE_KIRK_ASSASSINATION_FIRST_PASS.pdf"),
    scene: kirkSceneFixture as unknown as ReconstructionSceneData,
    cutoff: "17 Jul 2026",
    timeZone: "America/Denver",
    boundaryNote: "This does not establish who committed the offense. Actor-specific conduct remains attributed to the State, witnesses, or forensic testimony.",
    procedural: {
      title: "No verdict · no plea",
      claimIndex: 9,
      stages: [{ label: "Incident", state: "complete" }, { label: "Charges", state: "complete" }, { label: "Preliminary hearing", state: "current" }, { label: "Trial decision" }],
    },
    banner: {
      title: "Active criminal case · no guilt finding",
      detail: "Seven charges are allegations. Official public pages reviewed through 17 Jul 2026 do not show a probable-cause disposition; open-court reporting says arguments continue 1 Sep.",
      claimIndex: 9,
    },
    readinessLabel: "Conflicting distance rings",
  },
  {
    key: "apollo",
    shortTitle: "Apollo 11 · timing pilot",
    data: apolloFixture as ForensicPackage,
    packageUrl: apolloPackageUrl,
    filename: "apollo-11-landing.forensic-package.working.json",
    reportUrl: publicAssetPath("reports/APOLLO_11_LANDING_AUDIT.md"),
    pdfUrl: publicAssetPath("pdf/APOLLO_11_LANDING_AUDIT.pdf"),
    scene: null,
    cutoff: "16 Jul 2026",
    timeZone: "UTC",
    boundaryNote: "This historical validation pilot tests provenance and time normalization; it is not a disputed-conduct or active-procedure case.",
    procedural: {
      title: "Historical verification",
      claimIndex: 0,
      stages: [{ label: "Mission", state: "complete" }, { label: "Records", state: "complete" }, { label: "Normalization", state: "current" }, { label: "Archive" }],
    },
    readinessLabel: "Reconstruction constraints",
  },
];

const NAV_ITEMS: Array<{ id: View; label: string; icon: typeof Eye }> = [
  { id: "briefing", label: "Case briefing", icon: Eye },
  { id: "timeline", label: "Event timeline", icon: Clock3 },
  { id: "evidence", label: "Evidence ledger", icon: FileCheck2 },
  { id: "reconstruction", label: "3D reconstruction", icon: Boxes },
  { id: "contradictions", label: "Contradictions", icon: GitCompareArrows },
  { id: "provenance", label: "Provenance", icon: Fingerprint },
  { id: "rights", label: "Rights & privacy", icon: Scale },
  { id: "intake", label: "Research intake", icon: Radar },
  { id: "compare", label: "Case comparison", icon: GitCompareArrows },
  { id: "export", label: "Package export", icon: Archive },
];

const EVIDENCE_COPY: Record<string, string> = {
  directly_observed_primary_evidence: "Directly observed",
  authenticated_official_record: "Official record",
  independently_corroborated: "Corroborated",
  attributed_unverified: "Attributed · unverified",
  disputed: "Disputed",
  contradicted: "Contradicted",
  inferred: "Analysis",
  interpolated: "Interpolated",
  unresolved: "Unresolved",
  superseded: "Superseded",
  retracted: "Retracted",
};

function EvidenceBadge({ state }: { state: string }) {
  return <span className={`evidence-badge evidence-badge--${state}`}>{EVIDENCE_COPY[state] ?? labelize(state)}</span>;
}

function App() {
  const [caseKey, setCaseKey] = useState<CaseKey>("vessels");
  const currentCase = CASES.find((candidate) => candidate.key === caseKey) ?? CASES[0]!;
  const data = currentCase.data;
  const investigation = data.investigations[0]!;
  const [view, setView] = useState<View>("briefing");
  const [query, setQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(() => localStorage.getItem("fc-inspector-open") === "true");
  const [presentationMode, setPresentationMode] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: "claim", id: data.claims[0]!.id });
  const [intakes, setIntakes] = useState<ResearchIntake[]>(() => loadResearchIntakes("fc-research-intakes-v1"));
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);

  useEffect(() => localStorage.setItem("fc-inspector-open", String(inspectorOpen)), [inspectorOpen]);
  useEffect(() => localStorage.setItem("fc-research-intakes-v1", JSON.stringify(intakes)), [intakes]);
  useEffect(() => {
    if (!intakes.some((intake) => intake.status === "preparing_local_workspace")) return;
    const timer = window.setTimeout(() => setIntakes((previous) => previous.map((intake) => {
      if (intake.status !== "preparing_local_workspace") return intake;
      const nextStage = Math.min(intake.preparationStage + 1, PREPARATION_STAGES.length - 1);
      const complete = nextStage === PREPARATION_STAGES.length - 1;
      return {
        ...intake,
        preparationStage: nextStage,
        progress: complete ? 100 : Math.min(92, Math.round(((nextStage + 1) / PREPARATION_STAGES.length) * 100)),
        status: complete ? "ready_for_human_review" : "preparing_local_workspace",
        workspaceSlug: complete ? `fc-intake-${intake.normalizedSubject.replaceAll(" ", "-").slice(0, 48)}` : intake.workspaceSlug,
      };
    })), 650);
    return () => window.clearTimeout(timer);
  }, [intakes]);

  const subjectCandidates = useMemo<SubjectCandidate[]>(() => [
    ...CASES.map((candidate) => ({
      id: candidate.key,
      title: candidate.shortTitle,
      aliases: [candidate.data.investigations[0]!.title, candidate.key === "vessels" ? "Venezuela boat bombings" : ""].filter(Boolean),
      kind: "existing_case" as const,
    })),
    ...intakes.map((intake) => ({ id: intake.id, title: intake.subject, aliases: [], kind: "intake" as const })),
  ], [intakes]);

  function navigate(nextView: View) {
    setView(nextView);
    setMobileNavOpen(false);
    if (nextView === "reconstruction") setInspectorOpen(false);
    requestAnimationFrame(() => document.getElementById("workspace-heading")?.focus());
  }

  function changeCase(next: CaseKey) {
    const nextCase = CASES.find((candidate) => candidate.key === next) ?? CASES[0]!;
    setCaseKey(next);
    setView("briefing");
    setQuery("");
    setSelection({ kind: "claim", id: nextCase.data.claims[0]!.id });
  }

  function selectRecord(next: Selection) {
    setSelection(next);
    setInspectorOpen(true);
  }

  function registerIntake(subject: string, researchQuestion: string) {
    const match = findDuplicateSubject(subject, subjectCandidates);
    if (match) { setDuplicate(match); return; }
    setIntakes((previous) => [createResearchIntake(subject, researchQuestion), ...previous]);
    setIntakeOpen(false);
    navigate("intake");
  }

  function openDuplicate(match: DuplicateMatch) {
    setDuplicate(null);
    if (match.kind === "existing_case") {
      changeCase(match.id as CaseKey);
      return;
    }
    navigate("intake");
  }

  return (
    <div className={`app-shell ${presentationMode ? "presentation-mode" : ""}`}>
      <a className="skip-link" href="#workspace">Skip to investigation workspace</a>
      <Sidebar data={data} view={view} open={mobileNavOpen} intakeCount={intakes.length} onNavigate={navigate} onClose={() => setMobileNavOpen(false)} />

      <div className="app-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
          <div className="case-selector-wrap">
            <span>ACTIVE CASE</span>
            <label className="case-selector">
              <span className="sr-only">Select investigation</span>
              <select value={caseKey} onChange={(event) => changeCase(event.target.value as CaseKey)}>
                {CASES.map((candidate) => <option key={candidate.key} value={candidate.key}>{candidate.shortTitle}</option>)}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          </div>
          <div className="topbar-actions">
            <span className="network-status"><LockKeyhole size={13} /> Public prototype · no live crawler</span>
            <button className="secondary-button intake-trigger" onClick={() => setIntakeOpen(true)}><Plus size={15} /> Add subject</button>
            <button className="icon-button" aria-label={presentationMode ? "Exit presentation mode" : "Enter presentation mode"} onClick={() => { setPresentationMode(!presentationMode); setInspectorOpen(false); }}>{presentationMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
            <button className="icon-button inspector-toggle" aria-label={inspectorOpen ? "Close record inspector" : "Open record inspector"} onClick={() => setInspectorOpen(!inspectorOpen)}><PanelRightClose size={18} /></button>
            <button className="secondary-button" onClick={() => navigate("export")}><Download size={15} /> Export</button>
          </div>
        </header>

        <main id="workspace" className="workspace">
          <section className="workspace-header" aria-labelledby="workspace-heading">
            <div>
              <div className="eyebrow-row">
                <span className="working-badge"><CircleDot size={12} /> Working reconstruction</span>
                <span className="muted-label">Evidence cutoff {currentCase.cutoff}</span>
              </div>
              <h1 id="workspace-heading" tabIndex={-1}>{investigation.title}</h1>
              <p>{investigation.purpose}</p>
            </div>
            <label className="search-field">
              <span className="sr-only">Search case records</span>
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this case" />
              {query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}
            </label>
          </section>

          {currentCase.banner && <ProceduralBanner title={currentCase.banner.title} detail={currentCase.banner.detail} onOpen={() => { setSelection({ kind: "claim", id: data.claims[currentCase.banner!.claimIndex]!.id }); setInspectorOpen(true); }} />}

          <div className={`content-grid ${inspectorOpen ? "" : "inspector-closed"}`}>
            <div className="primary-column">
              {query.trim() && view !== "evidence" ? <GlobalSearchResults data={data} query={query} onSelect={(next) => { setSelection(next); setInspectorOpen(true); }} onNavigate={navigate} /> : <>
                {view === "briefing" && <Briefing data={data} currentCase={currentCase} onSelect={selectRecord} onNavigate={navigate} />}
                {view === "timeline" && <TimelineView data={data} onSelect={selectRecord} />}
                {view === "evidence" && <EvidenceView data={data} query={query} onSelect={selectRecord} />}
                {view === "reconstruction" && <ReconstructionView key={currentCase.key} data={data} scene={currentCase.scene} onSelect={selectRecord} />}
                {view === "contradictions" && <ContradictionsView data={data} onSelect={selectRecord} />}
                {view === "provenance" && <ProvenanceView data={data} onSelect={selectRecord} />}
                {view === "rights" && <RightsView data={data} onSelect={selectRecord} />}
                {view === "intake" && <ResearchIntakeView intakes={intakes} onAdd={() => setIntakeOpen(true)} />}
                {view === "compare" && <ComparisonView cases={CASES} onChangeCase={changeCase} />}
                {view === "export" && <ExportView data={data} currentCase={currentCase} />}
              </>}
            </div>
            {inspectorOpen && <Inspector data={data} scene={currentCase.scene} selection={selection} onClose={() => setInspectorOpen(false)} />}
          </div>
        </main>
      </div>
      {intakeOpen && <ResearchIntakeModal onClose={() => setIntakeOpen(false)} onSubmit={registerIntake} />}
      {duplicate && <DuplicateNotice match={duplicate} onClose={() => setDuplicate(null)} onOpen={() => openDuplicate(duplicate)} />}
    </div>
  );
}

function GlobalSearchResults({ data, query, onSelect, onNavigate }: { data: ForensicPackage; query: string; onSelect: (selection: Selection) => void; onNavigate: (view: View) => void }) {
  const normalized = query.trim().toLowerCase();
  const results = useMemo(() => {
    const claims = data.claims.filter((claim) => `${findClaimText(data, claim.id)} ${claim.proceduralStatus ?? ""}`.toLowerCase().includes(normalized)).map((claim) => ({ kind: "claim" as const, id: claim.id, title: findClaimText(data, claim.id), detail: claim.evidenceState }));
    const sources = data.sources.filter((source) => `${source.title} ${source.publisher} ${source.sourceType}`.toLowerCase().includes(normalized)).map((source) => ({ kind: "source" as const, id: source.id, title: source.title, detail: source.publisher }));
    const contradictions = data.contradictions.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(normalized)).map((item) => ({ kind: "contradiction" as const, id: item.id, title: item.title, detail: item.status }));
    const anchors = [...data.temporalAnchors, ...data.spatialAnchors].filter((item) => `${item.label} ${"method" in item ? item.method : item.originalExpression}`.toLowerCase().includes(normalized)).map((item) => ({ kind: "anchor" as const, id: item.id, title: item.label, detail: "method" in item ? item.method : item.originalExpression }));
    return [...claims, ...sources, ...contradictions, ...anchors];
  }, [data, normalized]);
  return <div className="view-stack"><section className="panel global-results"><SectionHeading eyebrow="Global case search" title={`${results.length} result${results.length === 1 ? "" : "s"} for “${query}”`} action={<button className="text-button" onClick={() => onNavigate("evidence")}>Filter evidence <ArrowUpRight size={14} /></button>} /><div>{results.map((result) => <button key={`${result.kind}-${result.id}`} onClick={() => onSelect({ kind: result.kind, id: result.id })}><span>{labelize(result.kind)}</span><strong>{result.title}</strong><small>{labelize(result.detail)}</small><ChevronRight size={15} /></button>)}{results.length === 0 && <p className="empty-state">No claim, source, contradiction, or spatial/temporal anchor matches this query.</p>}</div></section></div>;
}

function ComparisonView({ cases, onChangeCase }: { cases: CaseDefinition[]; onChangeCase: (key: CaseKey) => void }) {
  return <div className="view-stack"><section className="panel comparison-dashboard"><SectionHeading eyebrow="Cross-case quality control" title="Package completeness and evidentiary posture" /><div className="comparison-table"><div className="comparison-row comparison-row--heading"><span>Case</span><span>Claims</span><span>Sources</span><span>Preserved</span><span>Open conflicts</span><span>Confidence</span></div>{cases.map((candidate) => { const preserved = candidate.data.sourceSnapshots.filter((item) => item.contentHash).length; const complete = candidate.data.claims.filter((claim) => claim.confidenceAssessmentIds.length).length; return <button className="comparison-row" key={candidate.key} onClick={() => onChangeCase(candidate.key)}><strong>{candidate.shortTitle}</strong><span>{candidate.data.claims.length}</span><span>{candidate.data.sources.length}</span><span>{preserved}/{candidate.data.sources.length}</span><span>{candidate.data.contradictions.filter((item) => item.status === "open").length}</span><span>{complete}/{candidate.data.claims.length}</span></button>; })}</div><p className="method-note"><Info size={17} /> Preservation counts record retained source bodies, not URL registrations or metadata fingerprints. Zero is an intentional Phase 1 rights boundary, not evidence that the source was unavailable.</p></section></div>;
}

function ProceduralBanner({ title, detail, onOpen }: { title: string; detail: string; onOpen: () => void }) {
  return (
    <section className="procedural-banner" aria-label="Current procedural boundary">
      <ShieldAlert size={19} aria-hidden="true" />
      <div><strong>{title}</strong><span>{detail}</span></div>
      <button onClick={onOpen}>Inspect status <ChevronRight size={14} /></button>
    </section>
  );
}

function Sidebar({ data, view, open, intakeCount, onNavigate, onClose }: { data: ForensicPackage; view: View; open: boolean; intakeCount: number; onNavigate: (view: View) => void; onClose: () => void }) {
  const counts: Partial<Record<View, number>> = { evidence: data.claims.length, contradictions: data.contradictions.length, provenance: data.auditEvents.length, intake: intakeCount };
  return (
    <>
      {open && <button className="nav-scrim" aria-label="Dismiss navigation overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Investigation navigation">
        <div className="brand-lockup">
          <div className="brand-mark"><Network size={20} /></div>
          <div><strong>FORENSIC</strong><span>CRAWLER</span></div>
          <button className="icon-button close-nav" aria-label="Close navigation" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="classification"><span>PUBLIC PROTOTYPE</span><small>Working analysis · no live collection</small></div>
        <nav>
          <p className="nav-label">Analysis surfaces</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={view === item.id ? "active" : ""} aria-current={view === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}><Icon size={16} />{item.label}{counts[item.id] !== undefined && <span className="nav-count">{counts[item.id]}</span>}</button>;
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="integrity-seal"><ShieldCheck size={18} /><div><strong>Integrity chain</strong><span>{data.auditEvents.length} of {data.auditEvents.length} linked</span></div></div>
          <p>Schema v{data.schemaVersion}<br />{data.sourceSnapshots.every((item) => item.contentHash === null) ? "No remote bodies retained" : "Restricted source captures"}</p>
        </div>
      </aside>
    </>
  );
}

function ResearchIntakeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (subject: string, researchQuestion: string) => void }) {
  const [subject, setSubject] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  return <div className="intake-dialog-backdrop" role="presentation"><section className="intake-dialog" role="dialog" aria-modal="true" aria-labelledby="intake-title">
    <div className="intake-dialog-heading"><div><span>Governed research intake</span><h2 id="intake-title">Add a research subject</h2></div><button className="icon-button" aria-label="Close research intake" onClick={onClose}><X size={18} /></button></div>
    <p>Register a subject for a first-pass forensic workspace. This local prototype records intake only: it does not browse, crawl, retain sources, make findings, or publish anything.</p>
    <form onSubmit={(event) => { event.preventDefault(); if (subject.trim()) onSubmit(subject, researchQuestion); }}>
      <label>Subject<input autoFocus value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. October 7th" maxLength={180} required /></label>
      <label>Research question <small>Optional · helps scope later human review</small><textarea value={researchQuestion} onChange={(event) => setResearchQuestion(event.target.value)} placeholder="What should the package examine?" maxLength={700} rows={4} /></label>
      <div className="intake-policy"><ShieldCheck size={17} /><span>Duplicate matching runs against registered local cases and prior local intakes. Public deployment must repeat this check server-side before a job can be admitted.</span></div>
      <div className="intake-dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><Plus size={15} /> Register intake</button></div>
    </form>
  </section></div>;
}

function DuplicateNotice({ match, onClose, onOpen }: { match: DuplicateMatch; onClose: () => void; onOpen: () => void }) {
  return <div className="intake-dialog-backdrop" role="presentation"><section className="intake-dialog duplicate-dialog" role="alertdialog" aria-modal="true" aria-labelledby="duplicate-title">
    <div className="intake-dialog-heading"><div><span>Duplicate subject detected</span><h2 id="duplicate-title">Already in the workspace</h2></div><button className="icon-button" aria-label="Close duplicate notice" onClick={onClose}><X size={18} /></button></div>
    <div className="duplicate-target"><CheckCircle2 size={22} /><div><small>{match.kind === "existing_case" ? "Existing investigation" : "Previously registered intake"}</small><strong>{match.title}</strong><span>Matched by {match.matchType === "canonical" ? "canonical title" : "known case title"}.</span></div></div>
    <p>Creating another record would split provenance and review history. Open the existing record instead.</p>
    <div className="intake-dialog-actions"><button className="secondary-button" onClick={onClose}>Keep current view</button><button className="primary-button" onClick={onOpen}>Open existing record <ChevronRight size={15} /></button></div>
  </section></div>;
}

function ResearchIntakeView({ intakes, onAdd }: { intakes: ResearchIntake[]; onAdd: () => void }) {
  return <div className="view-stack">
    <section className="panel intake-hero"><div><span className="working-badge"><Radar size={12} /> Governed intake queue</span><h2>Start a new forensic workspace safely</h2><p>Each request becomes a durable local intake record. It cannot independently fetch the web, infer facts, or create a public case. A future service must perform authentication, duplicate matching, policy admission, scope approval, and human review before any isolated worker receives a job.</p></div><button className="primary-button" onClick={onAdd}><Plus size={16} /> Add research subject</button></section>
    <section className="panel"><SectionHeading eyebrow="Local preparation queue" title={`${intakes.length} subject${intakes.length === 1 ? "" : "s"} in the governed engine`} />
      <div className="intake-list">{intakes.map((intake) => {
        const active = intake.status === "preparing_local_workspace";
        const stage = PREPARATION_STAGES[Math.min(intake.preparationStage, PREPARATION_STAGES.length - 1)]!;
        return <article key={intake.id}><div><span className={`status-chip ${active ? "open" : "linked"}`}>{active ? "Preparing local workspace" : "Ready for human review"}</span><h3>{intake.subject}</h3><p>{intake.researchQuestion || "No question supplied. Scope definition is required before admission."}</p><div className="intake-progress"><div className="intake-progress-label"><span>{stage}</span><strong>{intake.progress}%</strong></div><div role="progressbar" aria-label={`Preparation progress for ${intake.subject}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={intake.progress}><i style={{ width: `${intake.progress}%` }} /></div><small>{active ? "Building a local scope, rights, and source-plan record. No web research is running." : "Local first-pass workspace record created. Human scope and source review is now required."}</small></div><small>Local-only request · {new Date(intake.createdAt).toLocaleString()}</small></div><div className="intake-state"><strong>{active ? "Engine state" : "Workspace record"}</strong><span>{active ? "Local preparation only; no crawler, model finding, or source retrieval." : intake.workspaceSlug ?? "Generated local workspace"}</span></div></article>;
      })}{intakes.length === 0 && <div className="empty-state"><Radar size={22} /><p>No submitted subjects yet. Add a topic to create a local, duplicate-checked research intake.</p></div>}</div>
    </section>
    <section className="panel deployment-contract"><SectionHeading eyebrow="Public deployment contract" title="Browser intake ≠ engine execution" /><div className="deployment-flow"><span>Authenticated request</span><ChevronRight size={16} /><span>Server-side duplicate resolver</span><ChevronRight size={16} /><span>Policy & scope review</span><ChevronRight size={16} /><span>Isolated job queue</span><ChevronRight size={16} /><span>Human-approved package</span></div><p><ShieldAlert size={16} /> The browser must never hold crawler credentials or decide source scope. A deployed backend should enforce rate limits, abuse controls, moderation, authorization, immutable audit events, per-origin allowlists, emergency stop, and publish review independently of this interface.</p></section>
  </div>;
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="section-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

function Metric({ label, value, note, icon: Icon, tone = "default" }: { label: string; value: string; note: string; icon: typeof Eye; tone?: string }) {
  return <article className={`metric-card metric-card--${tone}`}><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><Icon size={19} /></article>;
}

function Briefing({ data, currentCase, onSelect, onNavigate }: { data: ForensicPackage; currentCase: CaseDefinition; onSelect: (selection: Selection) => void; onNavigate: (view: View) => void }) {
  const scene = currentCase.scene;
  const primaryClaim = data.claims.find((claim) => claim.evidenceState === "independently_corroborated") ?? data.claims[0]!;
  const proceduralClaim = data.claims[currentCase.procedural.claimIndex];
  const openQuestions = data.claims.flatMap((claim) => claim.unresolvedQuestions ?? []).slice(0, 5);
  const officialSources = data.sources.filter((source) => source.sourceType.startsWith("official")).length;
  const openConflicts = data.contradictions.filter((item) => item.status === "open").length;
  return (
    <div className="view-stack">
      <section className="metric-grid">
        <Metric label="Reviewed sources" value={String(data.sources.length)} note={`${officialSources} official records`} icon={Landmark} />
        <Metric label="Claim records" value={String(data.claims.length)} note="Every claim source-linked" icon={FileCheck2} />
        <Metric label="Open conflicts" value={String(openConflicts)} note={`${data.contradictions.length} total ledgers`} icon={GitCompareArrows} tone={openConflicts ? "warning" : "default"} />
        <Metric label="Spatial anchors" value={String(data.spatialAnchors.length)} note={scene ? "Schematic · nonmetric" : "Pilot reconstruction"} icon={Layers3} />
      </section>

      {data.integritySummary && <section className="panel integrity-summary" aria-label="Package integrity summary">
        <div><ShieldCheck size={20} /><span><strong>Structural package</strong><small>{labelize(data.integritySummary.structuralValidation)}</small></span></div>
        <div><Fingerprint size={20} /><span><strong>Evidence authentication</strong><small>{labelize(data.integritySummary.evidentiaryAuthentication)}</small></span></div>
        <div><FileCheck2 size={20} /><span><strong>Locator coverage</strong><small>{data.integritySummary.locatorCoverage ? "Complete" : "Incomplete"}</small></span></div>
        <div><Archive size={20} /><span><strong>Preserved bodies</strong><small>{data.integritySummary.sourceBodiesPreserved} of {data.sources.length}</small></span></div>
      </section>}

      <section className="briefing-grid">
        <article className="panel established-card">
          <SectionHeading eyebrow="What the record establishes" title="Bounded synthesis" />
          <EvidenceBadge state={primaryClaim.evidenceState} />
          <blockquote>{findClaimText(data, primaryClaim.id)}</blockquote>
          <p className="boundary-note"><Info size={15} /> {currentCase.boundaryNote}</p>
          <button className="text-button" onClick={() => onSelect({ kind: "claim", id: primaryClaim.id })}>Inspect evidence path <ArrowUpRight size={14} /></button>
        </article>
        <article className="panel posture-card">
          <SectionHeading eyebrow="Procedural posture" title={currentCase.procedural.title} />
          <div className="posture-flow">{currentCase.procedural.stages.map((stage, index) => <Fragment key={stage.label}><span className={stage.state}>{stage.label}</span>{index < currentCase.procedural.stages.length - 1 && <i />}</Fragment>)}</div>
          <p>{proceduralClaim?.proceduralStatus ?? "Working source review; inspect the claim ledger for exact status."}</p>
          {proceduralClaim && <button className="text-button" onClick={() => onSelect({ kind: "claim", id: proceduralClaim.id })}>Open procedural claim <ChevronRight size={14} /></button>}
        </article>
      </section>

      <section className="panel incident-sequence">
        <SectionHeading eyebrow="Public-record chronology" title="Incident and response sequence" action={<button className="text-button" onClick={() => onNavigate("timeline")}>Full timeline <ArrowUpRight size={14} /></button>} />
        <TimelineRibbon data={data} timeZone={currentCase.timeZone} onSelect={onSelect} />
      </section>

      <section className="briefing-grid briefing-grid--lower">
        <article className="panel reconstruction-readiness">
          <SectionHeading eyebrow="Spatial reconstruction" title={scene ? "Schematic ready · photogrammetry blocked" : "No metric scene in this pilot"} action={<button className="text-button" onClick={() => onNavigate("reconstruction")}>Open 3D <ArrowUpRight size={14} /></button>} />
          <div className="readiness-row"><span><CheckCircle2 size={16} /> Event topology</span><strong>Source-linked</strong></div>
          <div className="readiness-row"><span><CheckCircle2 size={16} /> {currentCase.readinessLabel}</span><strong>Preserved</strong></div>
          <div className="readiness-row blocked"><span><X size={16} /> Calibrated originals + survey</span><strong>Unavailable</strong></div>
          <div className="readiness-row blocked"><span><X size={16} /> Validated trajectory</span><strong>Not attempted</strong></div>
        </article>
        <article className="panel open-questions">
          <SectionHeading eyebrow="Red-team queue" title="Highest-value evidence gaps" />
          <ol>{openQuestions.map((question, index) => <li key={question}><span>{String(index + 1).padStart(2, "0")}</span>{question}</li>)}</ol>
        </article>
      </section>

      <section className="panel source-preview">
        <SectionHeading eyebrow="Source custody" title="Primary records and current reporting" action={<button className="text-button" onClick={() => onNavigate("evidence")}>All evidence <ArrowUpRight size={14} /></button>} />
        <SourceTable data={data} sources={data.sources.slice(0, 5)} onSelect={onSelect} />
      </section>
    </div>
  );
}

function TimelineRibbon({ data, timeZone, onSelect }: { data: ForensicPackage; timeZone: string; onSelect: (selection: Selection) => void }) {
  const items = data.temporalAnchors.slice(0, Math.min(8, data.temporalAnchors.length));
  return <div className="timeline-ribbon">{items.map((anchor, index) => <button key={anchor.id} onClick={() => onSelect({ kind: "anchor", id: anchor.id })}><span className="ribbon-time">{compactTime(anchor, timeZone)}</span><i className={index === 2 || index === 3 ? "conflict" : ""} /><strong>{anchor.label}</strong><small>{anchor.originalExpression}</small></button>)}</div>;
}

function compactTime(anchor: TemporalAnchor, timeZone: string) {
  if (!anchor.normalizedUtc) return anchor.originalExpression.split(",")[0] ?? "Date only";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone }).format(new Date(anchor.normalizedUtc));
}

function TimelineView({ data, onSelect }: { data: ForensicPackage; onSelect: (selection: Selection) => void }) {
  return (
    <div className="view-stack">
      <section className="panel clock-compare">
        <SectionHeading eyebrow="Time normalization" title="Source clocks remain separate" />
        <div className="clock-pairs">{data.temporalAnchors.slice(0, 4).map((anchor) => <button key={anchor.id} onClick={() => onSelect({ kind: "anchor", id: anchor.id })}><span>{anchor.label}</span><strong>{anchor.originalExpression}</strong><small>{anchor.normalizedUtc ? `${anchor.normalizedUtc.replace("T", " ").replace("Z", " UTC")} · ±${anchor.precisionSeconds}s` : `No exact instant · ±${anchor.precisionSeconds}s`}</small></button>)}</div>
        <div className="method-note"><Info size={17} /><p><strong>Method boundary</strong> Normalization fixes representation, not clock accuracy. The source's literal time and timezone label remain preserved.</p></div>
      </section>
      <section className="panel">
        <SectionHeading eyebrow="Event ledger" title={`${data.events.length} source-bounded events`} />
        <div className="event-ledger">{data.events.map((event, index) => {
          const anchors = event.temporalAnchorIds.map((anchorId) => data.temporalAnchors.find((candidate) => candidate.id === anchorId)).filter(Boolean) as TemporalAnchor[];
          return <article key={event.id}><div className="event-rail"><span>{String(index + 1).padStart(2, "0")}</span></div><div className="event-copy"><span>{anchors.map((anchor) => anchor.originalExpression).join(" / ") || "Time unresolved"}</span><h3>{event.title}</h3><p>{event.description}</p><div>{anchors.map((anchor) => <button key={anchor.id} onClick={() => onSelect({ kind: "anchor", id: anchor.id })}>{anchor.label} <ChevronRight size={12} /></button>)}</div></div></article>;
        })}</div>
      </section>
      <section className="panel">
        <SectionHeading eyebrow="Anchor ledger" title="Precision and conversion rationale" />
        <div className="anchor-table">{data.temporalAnchors.map((anchor) => <button key={anchor.id} onClick={() => onSelect({ kind: "anchor", id: anchor.id })}><Clock3 size={16} /><span><strong>{anchor.label}</strong><small>{anchor.originalExpression}</small></span><span>{anchor.normalizedUtc?.replace("T", " ").replace("Z", " UTC") ?? "No normalized instant"}</span><span>±{anchor.precisionSeconds}s</span><ChevronRight size={14} /></button>)}</div>
      </section>
    </div>
  );
}

function EvidenceView({ data, query, onSelect }: { data: ForensicPackage; query: string; onSelect: (selection: Selection) => void }) {
  const [filter, setFilter] = useState("all");
  const normalized = query.trim().toLowerCase();
  const claims = data.claims.filter((claim) => {
    const text = `${findClaimText(data, claim.id)} ${claim.proceduralStatus ?? ""}`.toLowerCase();
    const filterMatch = filter === "all" || claim.evidenceState === filter;
    return filterMatch && (!normalized || text.includes(normalized));
  });
  const sources = data.sources.filter((source) => !normalized || `${source.title} ${source.publisher} ${source.sourceType}`.toLowerCase().includes(normalized));
  const filters = ["all", ...new Set(data.claims.map((claim) => claim.evidenceState))];
  return (
    <div className="view-stack">
      <section className="panel">
        <SectionHeading eyebrow="Evidence ledger" title={`${claims.length} claim${claims.length === 1 ? "" : "s"} in view`} />
        <div className="filter-chips" aria-label="Evidence state filter">{filters.map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === "all" ? "All states" : EVIDENCE_COPY[item] ?? labelize(item)}</button>)}</div>
        <div className="claim-ledger">{claims.map((claim) => <ClaimRow key={claim.id} data={data} claim={claim} index={data.claims.indexOf(claim)} onSelect={onSelect} />)}{claims.length === 0 && <p className="empty-state">No claims match the current search and filter.</p>}</div>
      </section>
      <section className="panel">
        <SectionHeading eyebrow="Source registry" title={`${sources.length} reviewed locator${sources.length === 1 ? "" : "s"}`} />
        <SourceTable data={data} sources={sources} onSelect={onSelect} />
      </section>
    </div>
  );
}

function ClaimRow({ data, claim, index, onSelect }: { data: ForensicPackage; claim: Claim; index: number; onSelect: (selection: Selection) => void }) {
  const confidence = data.confidenceAssessments.find((item) => claim.confidenceAssessmentIds.includes(item.id));
  const relationships = data.claimSourceRelationships.filter((item) => item.claimId === claim.id);
  return <button onClick={() => onSelect({ kind: "claim", id: claim.id })}><span className="record-number">CLM-{String(index + 1).padStart(3, "0")}</span><div><div className="claim-meta"><EvidenceBadge state={claim.evidenceState} />{confidence && <span className={`confidence confidence--${confidence.descriptor}`}>{confidence.descriptor} confidence</span>}</div><strong>{findClaimText(data, claim.id)}</strong><small>{relationships.length} source relationship{relationships.length === 1 ? "" : "s"} · {claim.unresolvedQuestions?.length ?? 0} open question{claim.unresolvedQuestions?.length === 1 ? "" : "s"}</small></div><ChevronRight size={16} /></button>;
}

function SourceTable({ data, sources, onSelect }: { data: ForensicPackage; sources: Source[]; onSelect: (selection: Selection) => void }) {
  return <div className="source-table"><div className="source-row source-row--head"><span>Source</span><span>Role</span><span>Custody</span><span>Rights</span><span /></div>{sources.map((source) => {
    const snapshot = data.sourceSnapshots.find((item) => item.sourceId === source.id)!;
    const rights = data.rightsDecisions.find((item) => item.id === source.rightsDecisionId)!;
    return <button className="source-row" key={source.id} onClick={() => onSelect({ kind: "source", id: source.id })}><span><i><BookOpen size={15} /></i><span><strong>{source.title}</strong><small>{source.publisher}</small></span></span><span>{labelize(source.sourceType)}</span><span><b className="state-dot" />{labelize(snapshot.storageState)}</span><span>{labelize(rights.exportPermission)}</span><ChevronRight size={15} /></button>;
  })}</div>;
}

function ReconstructionView({ data, scene, onSelect }: { data: ForensicPackage; scene: ReconstructionSceneData | null; onSelect: (selection: Selection) => void }) {
  const [presetId, setPresetId] = useState(scene?.cameraPresets[0]?.id ?? "overview");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(scene?.objects.find((item) => item.type === "marker")?.id ?? null);
  const [layers, setLayers] = useState<Record<string, boolean>>(() => Object.fromEntries((scene?.layers ?? []).map((layer) => [layer.id, true])));
  const [temporalStage, setTemporalStage] = useState(0);
  if (!scene) return <div className="view-stack"><section className="panel empty-reconstruction"><Boxes size={34} /><h2>No interactive 3D scene for this pilot</h2><p>The Apollo fixture retains its deterministic reconstruction metadata without a scene renderer.</p></section></div>;

  const selected = scene.objects.find((object) => object.id === selectedObjectId);
  function selectObject(objectId: string) {
    setSelectedObjectId(objectId);
    onSelect({ kind: "scene", id: objectId });
  }

  return (
    <div className="view-stack">
      <section className="scene-workbench">
        <div className="scene-toolbar">
          <div><span className="scene-status"><CircleDot size={11} /> WORKING SCHEMATIC</span><strong>{scene.title}</strong></div>
          <div className="preset-controls" aria-label="Camera presets">{scene.cameraPresets.map((preset) => <button key={preset.id} aria-pressed={presetId === preset.id} onClick={() => setPresetId(preset.id)}>{preset.label}</button>)}</div>
        </div>
        {!!scene.temporalStates?.length && <div className="scene-timebar" aria-label="Reconstruction presentation state"><span>DISPLAY STATE</span>{scene.temporalStates.map((state) => <button key={state.id} aria-pressed={temporalStage === state.order} onClick={() => setTemporalStage(state.order)}>{state.label}</button>)}</div>}
        <div className="scene-canvas-wrap">
          <Suspense fallback={<div className="scene-loading"><Layers3 size={22} />Loading local 3D renderer…</div>}>
            <ReconstructionScene data={scene} visibleLayers={layers} presetId={presetId} selectedObjectId={selectedObjectId} temporalFilter={{ cursor: temporalStage }} onSelect={selectObject} />
          </Suspense>
          <div className="scene-watermark"><ShieldAlert size={14} /> Not photogrammetric · not georeferenced · not a trajectory</div>
          <div className="scene-help"><MousePointer2 size={14} /> Drag to orbit · scroll to zoom · select geometry</div>
        </div>
        <div className="scene-bottom-bar">
          <div className="scene-layers">{scene.layers.map((layer) => <button key={layer.id} aria-pressed={layers[layer.id]} onClick={() => setLayers((current) => ({ ...current, [layer.id]: !current[layer.id] }))}><i style={{ background: layer.color }} />{layer.label}</button>)}</div>
          <span>{scene.coordinateSystem.id} · {scene.coordinateSystem.units}</span>
        </div>
      </section>

      <section className="scene-detail-grid">
        <article className="panel selected-scene-object">
          <SectionHeading eyebrow="Selected scene object" title={selected?.label ?? "Select geometry"} />
          {selected && <><span className={`layer-class layer-class--${selected.layer}`}>{scene.layers.find((layer) => layer.id === selected.layer)?.class}</span><dl><div><dt>Object type</dt><dd>{labelize(selected.type)}</dd></div><div><dt>Evidence layer</dt><dd>{scene.layers.find((layer) => layer.id === selected.layer)?.label}</dd></div><div><dt>Metric status</dt><dd>{selected.layer === "context" ? "Parametric placeholder" : "Source-linked display constraint"}</dd></div></dl></>}
        </article>
        <article className="panel calibration-card">
          <SectionHeading eyebrow="Reconstruction readiness" title="Calibration gate" />
          <div className="calibration-grid">{Object.entries(scene.calibration).map(([key, value]) => <span key={key} className={value ? "ready" : "blocked"}>{value ? <Check size={14} /> : <X size={14} />}<small>{labelize(key)}</small></span>)}</div>
          <p>Until original overlapping images, camera metadata, scale control, and survey validation exist, this remains a relational scene.</p>
        </article>
      </section>

      <section className="panel">
        <SectionHeading eyebrow="Spatial anchor ledger" title="Every displayed constraint has uncertainty" />
        <div className="spatial-table">{data.spatialAnchors.map((anchor) => <button key={anchor.id} onClick={() => onSelect({ kind: "anchor", id: anchor.id })}><Layers3 size={17} /><span><strong>{anchor.label}</strong><small>{anchor.method}</small></span><span>{anchor.uncertaintyMeters} m display uncertainty</span><ChevronRight size={14} /></button>)}</div>
      </section>

      <section className="panel limitation-panel">
        <SectionHeading eyebrow="Non-negotiable limitations" title="What this scene cannot prove" />
        <ul>{scene.limitations.map((limitation) => <li key={limitation}><AlertTriangle size={15} />{limitation}</li>)}</ul>
      </section>
    </div>
  );
}

function ContradictionsView({ data, onSelect }: { data: ForensicPackage; onSelect: (selection: Selection) => void }) {
  const [active, setActive] = useState(data.contradictions[0]?.id ?? "");
  return <div className="view-stack"><section className="panel"><SectionHeading eyebrow="Contradiction register" title="Conflicts remain visible, never averaged away" /><div className="contradiction-list">{data.contradictions.map((item, index) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => { setActive(item.id); onSelect({ kind: "contradiction", id: item.id }); }}><span>{String(index + 1).padStart(2, "0")}</span><div><div><b className={`status-dot status-dot--${item.status}`} />{labelize(item.status)} · {labelize(item.reviewStatus)}</div><h3>{item.title}</h3><p>{item.description}</p></div><ChevronRight size={17} /></button>)}</div></section>{data.contradictions.map((item) => active === item.id && <ContradictionDetail key={item.id} data={data} item={item} />)}</div>;
}

function ContradictionDetail({ data, item }: { data: ForensicPackage; item: Contradiction }) {
  return <section className="panel contradiction-detail"><SectionHeading eyebrow="Source comparison" title={item.title} /><div className="comparison-grid">{item.claimIds.map((claimId, index) => <article key={claimId}><span>Record {String(index + 1).padStart(2, "0")}</span><EvidenceBadge state={data.claims.find((claim) => claim.id === claimId)?.evidenceState ?? "unresolved"} /><p>{findClaimText(data, claimId)}</p></article>)}</div><div className="hypothesis-box"><strong>Explanations retained for testing</strong><ol>{item.alternateExplanations.map((explanation) => <li key={explanation}>{explanation}<span>Unverified</span></li>)}</ol></div><p className="editorial-boundary"><ShieldCheck size={18} /><span><strong>Editorial rule:</strong> no preferred value is invented until endpoints, methods, clocks, or source history justify one.</span></p></section>;
}

function ProvenanceView({ data, onSelect }: { data: ForensicPackage; onSelect: (selection: Selection) => void }) {
  const linked = auditChainIsLinked(data);
  return <div className="view-stack"><section className="panel"><SectionHeading eyebrow="Append-only audit history" title={`${data.auditEvents.length}-event integrity chain`} action={<span className={`chain-status ${linked ? "valid" : "invalid"}`}><CheckCircle2 size={14} />{linked ? "Linked" : "Broken"}</span>} /><div className="audit-chain">{data.auditEvents.map((event) => <button key={event.id} onClick={() => onSelect({ kind: "audit", id: event.id })}><span className="chain-node">{event.sequence}</span><div><strong>{labelize(event.eventType)}</strong><span>{event.actorId} · {event.occurredAt.replace("T", " ").replace("Z", " UTC")}</span><code>{shortHash(event.eventHash)}</code></div><ChevronRight size={15} /></button>)}</div></section><section className="panel"><SectionHeading eyebrow="Local derivative custody" title={`${data.assetCaptures.length} hash-verified project capture${data.assetCaptures.length === 1 ? "" : "s"}`} /><div className="capture-grid">{data.assetCaptures.map((capture) => <article key={capture.id}><FileJson2 size={19} /><strong>{capture.localPath.split("/").at(-1)}</strong><span>{capture.byteSize.toLocaleString()} bytes · {capture.mimeType}</span><code>{shortHash(capture.sha256)}</code></article>)}</div>{data.assetCaptures.length === 0 && <p className="empty-state">No local asset captures in this fixture.</p>}</section><section className="panel provenance-boundary"><Fingerprint size={23} /><div><h2>Source pixels and article bodies are not in this package</h2><p>Only URLs, timestamps, exact locators, restrained paraphrases, rights decisions, and project-authored derivatives are retained.</p></div></section></div>;
}

function RightsView({ data, onSelect }: { data: ForensicPackage; onSelect: (selection: Selection) => void }) {
  const excluded = ["Graphic impact imagery and thumbnails", "Faces, minors, identity or gait analysis", "Court-restricted or accidentally exposed exhibits", "Addresses, birth dates, private messages, and uninvolved people", "Copyrighted map, press-photo, and surveillance pixels"];
  return <div className="view-stack"><section className="rights-summary"><article className="panel"><Scale size={23} /><span>METADATA-FIRST</span><strong>{data.rightsDecisions.filter((item) => item.storagePermission === "metadata_only").length}</strong><small>subjects restricted to metadata</small></article><article className="panel"><LockKeyhole size={23} /><span>REMOTE BYTES</span><strong>0</strong><small>retained third-party bodies</small></article><article className="panel"><ShieldAlert size={23} /><span>PUBLIC RELEASE</span><strong>BLOCKED</strong><small>pending qualified review</small></article></section><section className="panel"><SectionHeading eyebrow="Rights decision ledger" title="Decision per retained subject" /><div className="rights-list">{data.rightsDecisions.map((decision) => { const source = data.sources.find((candidate) => candidate.id === decision.subjectId); const asset = data.assets.find((candidate) => candidate.id === decision.subjectId); return <button key={decision.id} onClick={() => source && onSelect({ kind: "source", id: source.id })}><Scale size={17} /><div><strong>{source?.title ?? asset?.title ?? decision.subjectId}</strong><span>{labelize(decision.rightsStatus)}</span><small>{decision.rationale}</small></div><span className="permission-chip">{labelize(decision.storagePermission)}</span></button>; })}</div></section><section className="panel exclusion-panel"><SectionHeading eyebrow="Intentionally excluded" title="Privacy, dignity, and trial-integrity controls" /><ul>{excluded.map((item) => <li key={item}><X size={15} />{item}</li>)}</ul></section></div>;
}

function ExportView({ data, currentCase }: { data: ForensicPackage; currentCase: CaseDefinition }) {
  return <div className="view-stack"><section className="panel export-panel"><div className="export-icon"><Box size={27} /></div><span className="working-badge"><CircleDot size={12} /> Public prototype package</span><h2>Portable forensic workspace</h2><p>Export the current working fixture with claims, locators, procedural labels, source-lineage notes, rights decisions, reconstruction inputs, contradictions, and its linked audit chain.</p><dl><div><dt>Profile</dt><dd>{labelize(data.exportProfile)}</dd></div><div><dt>Schema</dt><dd>v{data.schemaVersion}</dd></div><div><dt>Records</dt><dd>{data.claims.length + data.sources.length + data.auditEvents.length + data.temporalAnchors.length}</dd></div><div><dt>Remote bodies</dt><dd>{data.integritySummary?.sourceBodiesPreserved ?? 0}</dd></div></dl><div className="export-actions"><a className="primary-button" href={currentCase.packageUrl} download={currentCase.filename}><Download size={16} />Download working JSON</a><a className="secondary-button" href={currentCase.reportUrl} target="_blank" rel="noreferrer"><BookOpen size={15} />Markdown report</a><a className="secondary-button" href={currentCase.pdfUrl} target="_blank" rel="noreferrer"><FileCheck2 size={15} />PDF briefing</a></div><small>These files are working analysis. They do not publish a finding, endorsement, or certification.</small></section><section className="panel"><SectionHeading eyebrow="Release gate" title="Conditions still required for external reliance" /><ul className="release-list"><li className="pass"><CheckCircle2 size={18} /><span><strong>Schema, references, captures, and audit chain</strong>Locally verified</span></li><li><Clock3 size={18} /><span><strong>Qualified legal, defamation, privacy, and rights review</strong>Required</span></li><li><Clock3 size={18} /><span><strong>Defense/prosecution parity and final editorial review</strong>Required</span></li><li><Clock3 size={18} /><span><strong>Corrections owner and contact channel</strong>Not assigned</span></li><li><Clock3 size={18} /><span><strong>Independent deployment authorization</strong>Temporary demonstration only</span></li></ul></section></div>;
}

function Inspector({ data, scene, selection, onClose }: { data: ForensicPackage; scene: ReconstructionSceneData | null; selection: Selection; onClose: () => void }) {
  const source = selection.kind === "source" ? data.sources.find((item) => item.id === selection.id) : undefined;
  const claim = selection.kind === "claim" ? data.claims.find((item) => item.id === selection.id) : undefined;
  const contradiction = selection.kind === "contradiction" ? data.contradictions.find((item) => item.id === selection.id) : undefined;
  const temporal = selection.kind === "anchor" ? data.temporalAnchors.find((item) => item.id === selection.id) : undefined;
  const spatial = selection.kind === "anchor" ? data.spatialAnchors.find((item) => item.id === selection.id) : undefined;
  const audit = selection.kind === "audit" ? data.auditEvents.find((item) => item.id === selection.id) : undefined;
  const sceneObject = selection.kind === "scene" ? scene?.objects.find((item) => item.id === selection.id) : undefined;
  return <aside className="inspector" aria-label="Record inspector"><div className="inspector-heading"><span>Record inspector</span><button aria-label="Close record inspector" onClick={onClose}><X size={16} /></button></div>
    {source && <SourceInspector data={data} source={source} />}
    {claim && <ClaimInspector data={data} claim={claim} />}
    {contradiction && <><span className="record-kicker">Contradiction record</span><h2>{contradiction.title}</h2><span className={`status-chip status-chip--${contradiction.status}`}>{labelize(contradiction.status)} · {labelize(contradiction.reviewStatus)}</span><InspectorBlock label="Editorial reading"><p>{contradiction.description}</p></InspectorBlock><InspectorBlock label="Alternate explanations"><ul>{contradiction.alternateExplanations.map((item) => <li key={item}>{item}</li>)}</ul></InspectorBlock></>}
    {temporal && <><span className="record-kicker">Temporal anchor</span><h2>{temporal.label}</h2><span className="status-chip linked"><Clock3 size={12} /> Source time preserved</span><InspectorBlock label="Original expression"><strong>{temporal.originalExpression}</strong></InspectorBlock><InspectorBlock label="Normalized"><p>{temporal.normalizedUtc ?? "No exact normalized instant"}<br /><small>Displayed precision ±{temporal.precisionSeconds}s</small></p></InspectorBlock><InspectorBlock label="Conversion rationale"><p>{temporal.conversionRationale}</p></InspectorBlock></>}
    {spatial && <><span className="record-kicker">Spatial anchor</span><h2>{spatial.label}</h2><span className="status-chip open"><Layers3 size={12} /> ±{spatial.uncertaintyMeters} m display uncertainty</span><InspectorBlock label="Coordinate boundary"><p>{spatial.crs}</p></InspectorBlock><InspectorBlock label="Method"><p>{spatial.method}</p></InspectorBlock><InspectorBlock label="Geometry"><code className="wrap-code">{JSON.stringify(spatial.geometry)}</code></InspectorBlock></>}
    {audit && <><span className="record-kicker">Audit event #{audit.sequence}</span><h2>{labelize(audit.eventType)}</h2><span className="status-chip linked"><Check size={12} /> Linked</span><InspectorBlock label="Actor"><p>{audit.actorId}<br /><small>{labelize(audit.actorType)}</small></p></InspectorBlock><InspectorBlock label="Event hash"><code className="wrap-code">{audit.eventHash}</code></InspectorBlock><InspectorBlock label="Previous hash"><code className="wrap-code">{audit.previousHash ?? "Genesis event"}</code></InspectorBlock></>}
    {sceneObject && <><span className="record-kicker">Scene object</span><h2>{sceneObject.label}</h2><span className={`status-chip status-chip--${sceneObject.layer}`}>{labelize(sceneObject.layer)} layer</span><InspectorBlock label="Object type"><p>{labelize(sceneObject.type)}</p></InspectorBlock><InspectorBlock label="Scene boundary"><p>{scene?.status}</p></InspectorBlock></>}
  </aside>;
}

function ClaimInspector({ data, claim }: { data: ForensicPackage; claim: Claim }) {
  const confidence = data.confidenceAssessments.find((item) => claim.confidenceAssessmentIds.includes(item.id));
  const relationships = data.claimSourceRelationships.filter((item) => item.claimId === claim.id);
  return <><span className="record-kicker">Claim record</span><h2>{findClaimText(data, claim.id)}</h2><div className="inspector-badges"><EvidenceBadge state={claim.evidenceState} />{confidence && <span className={`confidence confidence--${confidence.descriptor}`}>{confidence.descriptor} confidence</span>}</div><InspectorBlock label="Procedural status"><p>{claim.proceduralStatus ?? "No procedural status recorded."}</p></InspectorBlock><InspectorBlock label="Exact evidence paths"><ul className="evidence-links">{relationships.map((relationship) => { const source = data.sources.find((item) => item.id === relationship.sourceId)!; return <li key={relationship.id}><a href={source.canonicalUrl} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{labelize(relationship.function)} · {relationship.locator.value}</span></a><small>{relationship.independenceNote}</small></li>; })}</ul></InspectorBlock><InspectorBlock label="Unresolved questions">{claim.unresolvedQuestions?.length ? <ul>{claim.unresolvedQuestions.map((question) => <li key={question}>{question}</li>)}</ul> : <p>None recorded.</p>}</InspectorBlock>{confidence && <InspectorBlock label="Confidence method"><p>{confidence.method}</p></InspectorBlock>}</>;
}

function SourceInspector({ data, source }: { data: ForensicPackage; source: Source }) {
  const snapshot = data.sourceSnapshots.find((item) => item.sourceId === source.id)!;
  const registry = data.sourceRegistryEntries.find((item) => item.id === source.registryEntryId)!;
  const rights = data.rightsDecisions.find((item) => item.id === source.rightsDecisionId)!;
  return <><span className="record-kicker">{labelize(source.sourceType)}</span><h2>{source.title}</h2><span className="status-chip linked"><Check size={12} /> Reviewed locator</span><InspectorBlock label="Publisher"><p>{source.publisher}</p></InspectorBlock><InspectorBlock label="Exact locators"><ul>{source.locators.map((locator) => <li key={`${locator.kind}-${locator.value}`}><strong>{locator.label ?? labelize(locator.kind)}</strong><br />{locator.value}</li>)}</ul></InspectorBlock><InspectorBlock label="Custody"><p>{labelize(snapshot.storageState)} · no remote body hash claimed</p><small>{snapshot.limitations}</small></InspectorBlock><InspectorBlock label="Registry"><p>{labelize(registry.status)}<br />Crawler network approved: <strong>{registry.networkUseApproved ? "yes" : "no"}</strong></p></InspectorBlock><InspectorBlock label="Rights"><p>{labelize(rights.exportPermission)}</p></InspectorBlock><a className="source-link" href={source.canonicalUrl} target="_blank" rel="noreferrer">Open source locator <ArrowUpRight size={13} /></a></>;
}

function InspectorBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="inspector-block"><span>{label}</span>{children}</div>;
}

export default App;
