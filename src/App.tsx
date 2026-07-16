import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
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
  LockKeyhole,
  Menu,
  Network,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import fixture from "../fixtures/pilots/apollo-11-landing/forensic-package.json";
import packageDownloadUrl from "../fixtures/pilots/apollo-11-landing/forensic-package.json?url";
import { auditChainIsLinked, findClaimText, labelize, missionTime, shortHash, sourceForAnchor } from "./lib/model";
import type { ForensicPackage, Source } from "./types";

const data = fixture as ForensicPackage;
type View = "overview" | "evidence" | "timeline" | "contradictions" | "provenance" | "rights" | "export";
type Selection = { kind: "source" | "claim" | "contradiction" | "audit"; id: string };
type TimelineLayers = {
  direct: boolean;
  disputed: boolean;
  uncertainty: boolean;
  alternates: boolean;
  sources: boolean;
  transformations: boolean;
};

const NAV_ITEMS: Array<{ id: View; label: string; icon: typeof Eye }> = [
  { id: "overview", label: "Investigation", icon: Eye },
  { id: "evidence", label: "Evidence", icon: FileCheck2 },
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "contradictions", label: "Contradictions", icon: GitCompareArrows },
  { id: "provenance", label: "Provenance", icon: Fingerprint },
  { id: "rights", label: "Rights review", icon: Scale },
  { id: "export", label: "Package export", icon: Archive },
];

const EVIDENCE_COPY: Record<string, string> = {
  authenticated_official_record: "Authenticated official record",
  inferred: "Inference",
  disputed: "Disputed",
  unresolved: "Unresolved",
};

function EvidenceBadge({ state }: { state: string }) {
  return <span className={`evidence-badge evidence-badge--${state}`}>{EVIDENCE_COPY[state] ?? labelize(state)}</span>;
}

function App() {
  const investigation = data.investigations[0]!;
  const contradiction = data.contradictions[0]!;
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: "contradiction", id: contradiction.id });

  const filteredSources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.sources;
    return data.sources.filter((source) => `${source.title} ${source.publisher} ${source.sourceType}`.toLowerCase().includes(normalized));
  }, [query]);

  function navigate(nextView: View) {
    setView(nextView);
    setMobileNavOpen(false);
    document.getElementById("workspace-heading")?.focus();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">Skip to investigation workspace</a>
      <Sidebar view={view} open={mobileNavOpen} onNavigate={navigate} onClose={() => setMobileNavOpen(false)} />

      <div className="app-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="project-crumbs" aria-label="Current workspace">
            <span>Forensic Crawler</span><ChevronRight size={14} aria-hidden="true" /><strong>Apollo 11</strong>
          </div>
          <div className="topbar-actions">
            <span className="network-status"><LockKeyhole size={14} aria-hidden="true" /> Network off</span>
            <button className="secondary-button" onClick={() => navigate("export")}><Download size={16} aria-hidden="true" /> Export</button>
          </div>
        </header>

        <main id="workspace" className="workspace">
          <section className="workspace-header" aria-labelledby="workspace-heading">
            <div>
              <div className="eyebrow-row">
                <span className="working-badge"><CircleDot size={13} aria-hidden="true" /> Working investigation</span>
                <span className="muted-label">Updated 16 Jul 2026 · local fixture</span>
              </div>
              <h1 id="workspace-heading" tabIndex={-1}>{investigation.title}</h1>
              <p>{investigation.purpose}</p>
            </div>
            <div className="header-controls">
              <label className="search-field">
                <span className="sr-only">Search official sources</span>
                <Search size={17} aria-hidden="true" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources" />
              </label>
              <button className={`icon-button ${filtersOpen ? "is-active" : ""}`} aria-label="Toggle review filters" aria-pressed={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>
                <SlidersHorizontal size={18} aria-hidden="true" />
              </button>
            </div>
          </section>

          {filtersOpen && (
            <section className="filter-strip" aria-label="Active review filters">
              <strong>Review scope</strong>
              <span><Check size={14} aria-hidden="true" /> Official NASA records</span>
              <span><Check size={14} aria-hidden="true" /> Metadata only</span>
              <span><Check size={14} aria-hidden="true" /> Open contradictions</span>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={16} aria-hidden="true" /></button>
            </section>
          )}

          <div className="content-grid">
            <div className="primary-column">
              {view === "overview" && <Overview onSelect={setSelection} onNavigate={navigate} />}
              {view === "evidence" && <EvidenceView sources={filteredSources} query={query} onSelect={setSelection} />}
              {view === "timeline" && <TimelineView onSelect={setSelection} />}
              {view === "contradictions" && <ContradictionsView onSelect={setSelection} />}
              {view === "provenance" && <ProvenanceView onSelect={setSelection} />}
              {view === "rights" && <RightsView onSelect={setSelection} />}
              {view === "export" && <ExportView />}
            </div>
            <Inspector selection={selection} />
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ view, open, onNavigate, onClose }: { view: View; open: boolean; onNavigate: (view: View) => void; onClose: () => void }) {
  return (
    <>
      {open && <button className="nav-scrim" aria-label="Dismiss navigation overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Investigation navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Network size={21} /></div>
          <div><strong>FORENSIC</strong><span>CRAWLER</span></div>
          <button className="icon-button close-nav" aria-label="Close navigation" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </div>
        <nav>
          <p className="nav-label">Workspace</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "active" : ""} aria-current={view === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
                <Icon size={17} aria-hidden="true" />{item.label}
                {item.id === "contradictions" && <span className="nav-count">1</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="integrity-seal"><ShieldCheck size={18} aria-hidden="true" /><div><strong>Integrity chain</strong><span>5 of 5 linked</span></div></div>
          <p>Schema v{data.schemaVersion}<br />Private workspace</p>
        </div>
      </aside>
    </>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="section-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

function Overview({ onSelect, onNavigate }: { onSelect: (selection: Selection) => void; onNavigate: (view: View) => void }) {
  const contradiction = data.contradictions[0]!;
  return (
    <div className="view-stack">
      <section className="metric-grid" aria-label="Investigation summary">
        <Metric label="Official sources" value={String(data.sources.length)} note="All metadata-only" icon={Landmark} />
        <Metric label="Evidence claims" value={String(data.claims.length)} note="Every claim linked" icon={FileCheck2} />
        <Metric label="Open conflicts" value={String(data.contradictions.length)} note="No preferred second" icon={GitCompareArrows} accent />
        <Metric label="Audit events" value={String(data.auditEvents.length)} note="Hash chain linked" icon={Fingerprint} />
      </section>

      <section className="panel timeline-panel">
        <SectionHeading eyebrow="Temporal reconstruction" title="Touchdown records, kept separate" action={<button className="text-button" onClick={() => onNavigate("timeline")}>Open timeline <ArrowUpRight size={14} aria-hidden="true" /></button>} />
        <TimelineGraphic onSelect={onSelect} />
        <div className="timeline-legend">
          <span><i className="legend-dot solid" /> Recorded mission time</span>
          <span><i className="legend-dot hollow" /> Uncertainty boundary</span>
          <span><i className="legend-line" /> Unresolved interval</span>
        </div>
      </section>

      <section className="split-panels">
        <div className="panel">
          <SectionHeading eyebrow="Claim register" title="Current synthesis" action={<button className="text-button" onClick={() => onNavigate("evidence")}>All evidence <ChevronRight size={14} aria-hidden="true" /></button>} />
          <button className="claim-card" onClick={() => onSelect({ kind: "claim", id: data.claims[0]!.id })}>
            <div className="claim-card-top"><EvidenceBadge state={data.claims[0]!.evidenceState} /><span>CLM-001</span></div>
            <strong>{findClaimText(data, data.claims[0]!.id)}</strong>
            <p><Info size={14} aria-hidden="true" /> Shared NASA lineage is disclosed; this is not counted as independent corroboration.</p>
          </button>
        </div>
        <div className="panel conflict-panel">
          <SectionHeading eyebrow="Red-team queue" title="Open contradiction" />
          <button className="conflict-card" onClick={() => onSelect({ kind: "contradiction", id: contradiction.id })}>
            <div className="conflict-icon"><GitCompareArrows size={19} aria-hidden="true" /></div>
            <div><span className="severity-label">Temporal · open</span><strong>{contradiction.title}</strong><p>{contradiction.description}</p></div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel source-preview">
        <SectionHeading eyebrow="Source custody" title="Reviewed official records" action={<button className="text-button" onClick={() => onNavigate("provenance")}>View chain <ArrowUpRight size={14} aria-hidden="true" /></button>} />
        <SourceTable sources={data.sources.slice(0, 2)} onSelect={onSelect} />
      </section>
    </div>
  );
}

function Metric({ label, value, note, icon: Icon, accent = false }: { label: string; value: string; note: string; icon: typeof Eye; accent?: boolean }) {
  return <article className={`metric-card ${accent ? "metric-card--accent" : ""}`}><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><Icon size={19} aria-hidden="true" /></article>;
}

function TimelineGraphic({ onSelect, layers = { direct: true, disputed: true, uncertainty: true, alternates: false, sources: true, transformations: false } }: { onSelect: (selection: Selection) => void; layers?: TimelineLayers }) {
  const [reportTime, eventTime, firstStep] = data.temporalAnchors;
  return (
    <div className="timeline-graphic" aria-label={`Timeline showing ${reportTime!.originalExpression}, ${eventTime!.originalExpression}, and ${firstStep!.originalExpression}`}>
      <div className="time-axis"><span>MET 102:45</span><span>MET 109:24</span></div>
      <div className="axis-track"><span className="axis-fill" /><span className="axis-break">//</span></div>
      {layers.direct ? <>
        <button className="time-marker marker-one" aria-label={`Inspect Mission Report touchdown ${reportTime!.originalExpression}`} onClick={() => onSelect({ kind: "source", id: reportTime!.sourceId })}>
          <span className="marker-pin" /><span className="marker-label"><b>{missionTime(reportTime!.missionElapsedSeconds)}</b>{layers.sources && <small>Mission Report</small>}</span>
        </button>
        {layers.disputed && layers.uncertainty && <div className="difference-bracket"><span>3.1 sec unresolved</span></div>}
        <button className={`time-marker marker-two ${layers.uncertainty ? "shows-uncertainty" : ""}`} aria-label={`Inspect Event Record touchdown ${eventTime!.originalExpression}`} onClick={() => onSelect({ kind: "source", id: eventTime!.sourceId })}>
          <span className="marker-pin" /><span className="marker-label"><b>{missionTime(eventTime!.missionElapsedSeconds)}</b>{layers.sources && <small>Record of Events</small>}</span>
        </button>
        <button className="time-marker marker-three" aria-label={`Inspect Armstrong surface record ${firstStep!.originalExpression}`} onClick={() => onSelect({ kind: "source", id: firstStep!.sourceId })}>
          <span className="marker-pin" /><span className="marker-label"><b>{missionTime(firstStep!.missionElapsedSeconds)}</b>{layers.sources && <small>Armstrong on surface</small>}</span>
        </button>
      </> : <span className="layer-empty">Direct evidence layer hidden</span>}
    </div>
  );
}

function EvidenceView({ sources, query, onSelect }: { sources: Source[]; query: string; onSelect: (selection: Selection) => void }) {
  return <div className="view-stack"><section className="panel"><SectionHeading eyebrow="Evidence register" title="Claims and exact source relationships" />
    <div className="claim-list">{data.claims.map((claim, index) => <button key={claim.id} onClick={() => onSelect({ kind: "claim", id: claim.id })}><span className="record-number">CLM-{String(index + 1).padStart(3, "0")}</span><div><EvidenceBadge state={claim.evidenceState} /><strong>{findClaimText(data, claim.id)}</strong><small>{claim.unresolvedQuestions?.length ?? 0} unresolved question{claim.unresolvedQuestions?.length === 1 ? "" : "s"}</small></div><ChevronRight size={17} aria-hidden="true" /></button>)}</div>
  </section><section className="panel"><SectionHeading eyebrow="Official source registry" title={query ? `${sources.length} matching source${sources.length === 1 ? "" : "s"}` : "Three reviewed locators"} /><SourceTable sources={sources} onSelect={onSelect} /></section></div>;
}

function SourceTable({ sources, onSelect }: { sources: Source[]; onSelect: (selection: Selection) => void }) {
  return <div className="source-table"><div className="source-row source-row--head"><span>Source</span><span>Custody</span><span>Rights</span><span /></div>{sources.map((source) => {
    const snapshot = data.sourceSnapshots.find((item) => item.sourceId === source.id)!;
    const rights = data.rightsDecisions.find((item) => item.id === source.rightsDecisionId)!;
    return <button className="source-row" key={source.id} onClick={() => onSelect({ kind: "source", id: source.id })}><span><i><BookOpen size={16} aria-hidden="true" /></i><span><strong>{source.title}</strong><small>{source.publisher}</small></span></span><span><b className="state-dot" />{labelize(snapshot.storageState)}</span><span>{labelize(rights.exportPermission)}</span><ChevronRight size={16} aria-hidden="true" /></button>;
  })}{sources.length === 0 && <p className="empty-state">No official sources match that search.</p>}</div>;
}

function TimelineView({ onSelect }: { onSelect: (selection: Selection) => void }) {
  const [layers, setLayers] = useState<TimelineLayers>({ direct: true, disputed: true, uncertainty: true, alternates: false, sources: true, transformations: false });
  const toggle = (key: keyof TimelineLayers) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  return <div className="view-stack"><section className="panel"><SectionHeading eyebrow="Temporal analysis" title="Mission elapsed-time comparison" />
    <div className="layer-controls" aria-label="Reconstruction layers">
      <button aria-pressed={layers.direct} onClick={() => toggle("direct")}>Direct evidence</button>
      <button disabled title="No corroborated inference layer exists in this pilot">Corroborated inference · 0</button>
      <button aria-pressed={layers.disputed} onClick={() => toggle("disputed")}>Disputed evidence</button>
      <button disabled title="No interpolated layer exists in this pilot">Interpolated elements · 0</button>
      <button aria-pressed={layers.uncertainty} onClick={() => toggle("uncertainty")}>Uncertainty overlay</button>
      <button aria-pressed={layers.alternates} onClick={() => toggle("alternates")}>Alternate hypotheses</button>
      <button aria-pressed={layers.sources} onClick={() => toggle("sources")}>Source / camera visibility</button>
      <button aria-pressed={layers.transformations} onClick={() => toggle("transformations")}>Transformation history</button>
    </div>
    <TimelineGraphic onSelect={onSelect} layers={layers} />
    <div className="method-note"><Info size={17} aria-hidden="true" /><p><strong>Method boundary</strong> Precision is retained exactly as displayed by each record. It is not treated as independently validated clock accuracy.</p></div>
    {layers.alternates && <div className="layer-disclosure"><strong>Alternate hypotheses</strong><ul>{data.contradictions[0]!.alternateExplanations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    {layers.transformations && <div className="layer-disclosure"><strong>Transformation history</strong><p>{data.reconstructionRevisions[0]!.method}. Output digest: <code>{shortHash(data.reconstructionRevisions[0]!.outputHash)}</code></p></div>}
  </section><section className="panel"><SectionHeading eyebrow="Anchor ledger" title="Three source-attributed time anchors" /><div className="anchor-ledger">{data.temporalAnchors.map((anchor) => <button key={anchor.id} onClick={() => onSelect({ kind: "source", id: anchor.sourceId })}><Clock3 size={18} aria-hidden="true" /><div><strong>{anchor.label}</strong><span>{anchor.originalExpression}</span><small>{sourceForAnchor(data, anchor.sourceId)?.title}</small></div><span className="precision">± displayed {anchor.precisionSeconds}s</span></button>)}</div></section></div>;
}

function ContradictionsView({ onSelect }: { onSelect: (selection: Selection) => void }) {
  const item = data.contradictions[0]!;
  return <div className="view-stack"><section className="panel"><SectionHeading eyebrow="Contradiction ledger" title="Unresolved records, never flattened" /><button className="large-conflict" onClick={() => onSelect({ kind: "contradiction", id: item.id })}><div className="large-conflict-header"><span><AlertTriangle size={18} aria-hidden="true" /> Open temporal conflict</span><b>{item.magnitudeSeconds} seconds</b></div><h3>{item.title}</h3><p>{item.description}</p><div className="comparison"><span><small>Mission Report</small><strong>102:45:39.9</strong></span><GitCompareArrows size={20} aria-hidden="true" /><span><small>Record of Events</small><strong>102:45:43</strong></span></div></button></section><section className="panel"><SectionHeading eyebrow="Alternate hypotheses" title="Explanations retained for testing" /><ol className="hypothesis-list">{item.alternateExplanations.map((explanation) => <li key={explanation}>{explanation}<span>Unverified</span></li>)}</ol><div className="editorial-boundary"><ShieldCheck size={20} aria-hidden="true" /><p><strong>Editorial boundary:</strong> this discrepancy is not evidence of misconduct, deception, or falsification.</p></div></section></div>;
}

function ProvenanceView({ onSelect }: { onSelect: (selection: Selection) => void }) {
  const linked = auditChainIsLinked(data);
  return <div className="view-stack"><section className="panel"><SectionHeading eyebrow="Append-only audit history" title="Five-event integrity chain" action={<span className={`chain-status ${linked ? "valid" : "invalid"}`}><CheckCircle2 size={15} aria-hidden="true" /> {linked ? "Linked" : "Broken"}</span>} /><div className="audit-chain">{data.auditEvents.map((event) => <button key={event.id} onClick={() => onSelect({ kind: "audit", id: event.id })}><span className="chain-node">{event.sequence}</span><div><strong>{labelize(event.eventType)}</strong><span>{event.actorId} · {event.occurredAt.replace("T", " ").replace("Z", " UTC")}</span><code>{shortHash(event.eventHash)}</code></div><ChevronRight size={16} aria-hidden="true" /></button>)}</div></section><section className="panel"><SectionHeading eyebrow="Local custody" title="Two verified fixture captures" /><div className="capture-grid">{data.assetCaptures.map((capture) => <article key={capture.id}><FileJson2 size={20} aria-hidden="true" /><strong>{capture.localPath.split("/").at(-1)}</strong><span>{capture.byteSize} bytes</span><code>{shortHash(capture.sha256)}</code></article>)}</div></section></div>;
}

function RightsView({ onSelect }: { onSelect: (selection: Selection) => void }) {
  return <div className="view-stack"><section className="panel"><SectionHeading eyebrow="Rights and privacy" title="Decision per retained subject" /><div className="rights-list">{data.rightsDecisions.map((decision) => {
    const source = data.sources.find((candidate) => candidate.id === decision.subjectId);
    const asset = data.assets.find((candidate) => candidate.id === decision.subjectId);
    return <button key={decision.id} onClick={() => source && onSelect({ kind: "source", id: source.id })}><Scale size={18} aria-hidden="true" /><div><strong>{source?.title ?? asset?.title ?? decision.subjectId}</strong><span>{labelize(decision.rightsStatus)}</span><small>{decision.rationale}</small></div><span className="permission-chip">{labelize(decision.storagePermission)}</span></button>;
  })}</div></section><section className="panel compliance-callout"><ShieldCheck size={24} aria-hidden="true" /><div><h2>No remote source bodies retained</h2><p>The pilot stores URLs, exact locators, factual metadata, restrained claim text, and locally authored comparison data. Item-specific third-party, logo, and identifiable-person restrictions remain unresolved until review.</p></div></section></div>;
}

function ExportView() {
  return <div className="view-stack"><section className="panel export-panel"><div className="export-icon"><Box size={28} aria-hidden="true" /></div><span className="working-badge"><CircleDot size={13} aria-hidden="true" /> Private working package</span><h2>Portable evidence package</h2><p>Export the current local fixture with its schema version, source locators, claims, rights decisions, reconstruction inputs, and linked audit events.</p><dl><div><dt>Profile</dt><dd>{labelize(data.exportProfile)}</dd></div><div><dt>Schema</dt><dd>v{data.schemaVersion}</dd></div><div><dt>Package ID</dt><dd><code>{data.packageId}</code></dd></div><div><dt>Remote bytes</dt><dd>None</dd></div></dl><a className="primary-button" href={packageDownloadUrl} download="apollo-11-landing.forensic-package.working.json"><Download size={17} aria-hidden="true" /> Download working JSON</a><small>Local browser download only. This does not publish, transmit, or certify the package.</small></section><section className="panel"><SectionHeading eyebrow="Release blockers" title="Before any public candidate export" /><ul className="release-list"><li><CheckCircle2 size={18} aria-hidden="true" /><span><strong>Local schema and integrity audit</strong>Passing for this fixture</span></li><li><Clock3 size={18} aria-hidden="true" /><span><strong>Item-specific legal and rights review</strong>Not yet approved</span></li><li><Clock3 size={18} aria-hidden="true" /><span><strong>Network acquisition canary</strong>Not authorized or executed</span></li><li><Clock3 size={18} aria-hidden="true" /><span><strong>Corrections contact and governance owner</strong>Not yet assigned</span></li></ul></section></div>;
}

function Inspector({ selection }: { selection: Selection }) {
  const source = selection.kind === "source" ? data.sources.find((item) => item.id === selection.id) : undefined;
  const claim = selection.kind === "claim" ? data.claims.find((item) => item.id === selection.id) : undefined;
  const contradiction = selection.kind === "contradiction" ? data.contradictions.find((item) => item.id === selection.id) : undefined;
  const audit = selection.kind === "audit" ? data.auditEvents.find((item) => item.id === selection.id) : undefined;
  return <aside className="inspector" aria-label="Record inspector"><div className="inspector-heading"><span>Record inspector</span><Fingerprint size={17} aria-hidden="true" /></div>
    {source && <SourceInspector source={source} />}
    {claim && <><span className="record-kicker">Claim record</span><h2>{findClaimText(data, claim.id)}</h2><EvidenceBadge state={claim.evidenceState} /><InspectorBlock label="Record ID"><code>{claim.id}</code></InspectorBlock><InspectorBlock label="Exact evidence locators"><ul className="evidence-links">{data.claimSourceRelationships.filter((relationship) => relationship.claimId === claim.id).map((relationship) => { const source = data.sources.find((item) => item.id === relationship.sourceId)!; return <li key={relationship.id}><a href={source.canonicalUrl} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{labelize(relationship.function)} · {relationship.locator.kind}: {relationship.locator.value}</span></a></li>; })}</ul></InspectorBlock><InspectorBlock label="Unresolved questions">{claim.unresolvedQuestions?.length ? <ul>{claim.unresolvedQuestions.map((question) => <li key={question}>{question}</li>)}</ul> : <p>None recorded.</p>}</InspectorBlock><InspectorBlock label="Revision history"><p>{data.claimRevisions.filter((revision) => revision.claimId === claim.id).length} append-only revision</p></InspectorBlock></>}
    {contradiction && <><span className="record-kicker">Contradiction record</span><h2>{contradiction.title}</h2><span className="status-chip open">Open · working review</span><InspectorBlock label="Magnitude"><strong className="large-value">{contradiction.magnitudeSeconds} s</strong></InspectorBlock><InspectorBlock label="Editorial reading"><p>{contradiction.description}</p></InspectorBlock><InspectorBlock label="Decision"><p>No exact time preferred. Preserve both inputs and investigate clock/reporting conventions.</p></InspectorBlock></>}
    {audit && <><span className="record-kicker">Audit event #{audit.sequence}</span><h2>{labelize(audit.eventType)}</h2><span className="status-chip linked"><Check size={13} aria-hidden="true" /> Linked</span><InspectorBlock label="Actor"><p>{audit.actorId}<br /><small>{labelize(audit.actorType)}</small></p></InspectorBlock><InspectorBlock label="Event hash"><code className="wrap-code">{audit.eventHash}</code></InspectorBlock><InspectorBlock label="Previous hash"><code className="wrap-code">{audit.previousHash ?? "Genesis event"}</code></InspectorBlock></>}
  </aside>;
}

function SourceInspector({ source }: { source: Source }) {
  const snapshot = data.sourceSnapshots.find((item) => item.sourceId === source.id)!;
  const registry = data.sourceRegistryEntries.find((item) => item.id === source.registryEntryId)!;
  const rights = data.rightsDecisions.find((item) => item.id === source.rightsDecisionId)!;
  return <><span className="record-kicker">Official source</span><h2>{source.title}</h2><span className="status-chip linked"><Check size={13} aria-hidden="true" /> Reviewed locator</span><InspectorBlock label="Publisher"><p>{source.publisher}</p></InspectorBlock><InspectorBlock label="Exact locators"><ul>{source.locators.map((locator) => <li key={`${locator.kind}-${locator.value}`}><strong>{locator.label ?? labelize(locator.kind)}</strong><br />{locator.value}</li>)}</ul></InspectorBlock><InspectorBlock label="Custody"><p>{labelize(snapshot.storageState)} · no remote content hash claimed</p><small>{snapshot.limitations}</small></InspectorBlock><InspectorBlock label="Registry"><p>{labelize(registry.status)}<br />Network approved: <strong>{registry.networkUseApproved ? "yes" : "no"}</strong></p></InspectorBlock><InspectorBlock label="Rights"><p>{labelize(rights.exportPermission)}</p></InspectorBlock><a className="source-link" href={source.canonicalUrl} target="_blank" rel="noreferrer">Open official locator <ArrowUpRight size={14} aria-hidden="true" /></a></>;
}

function InspectorBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="inspector-block"><span>{label}</span>{children}</div>;
}

export default App;
