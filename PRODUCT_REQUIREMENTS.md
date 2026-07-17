# Product Requirements

Status: WORKING
Target: local Phase 1 vertical slice

## Functional requirements

### Investigations and records

- PR-001: assign an immutable permanent ID to every authoritative record; slugs and titles may change.
- PR-002: keep investigations, events, claims, claim revisions, sources, snapshots, assets, captures, transformations, entities, observations, temporal anchors, spatial anchors, relationships, contradictions, rights decisions, confidence assessments, reconstruction records, experts, reviews, corrections, exports, imports, and audit events separate.
- PR-003: preserve original values and append revisions; never silently overwrite history.
- PR-004: require explicit relationship function for every claim-source and asset-source link.
- PR-005: reject packages with duplicate IDs, broken references, orphaned material records, or claims lacking inspectable evidence relationships.

### Evidence and status

- PR-010: support evidence states: directly observed primary evidence, authenticated official record, independently corroborated, attributed but unverified, disputed, contradicted, inferred, interpolated, unresolved, superseded, and retracted.
- PR-011: record claimant, exact claim type/status, retrieval and last-check dates, source locator, contrary evidence, uncertainty, and unresolved questions.
- PR-012: keep evidence state, procedural status, and confidence separate.
- PR-013: require confidence rationale and optional numeric bounds; never infer status from confidence.
- PR-014: distinguish source quotation, observation, human annotation, analysis, alternate hypothesis, and model output.

### Time and reconstruction

- PR-020: store original time expression, normalized instant or interval, time system, time zone, precision, clock source, conversion method, and uncertainty bounds.
- PR-021: show conflicting temporal anchors together and never hide rounding or reference-clock differences.
- PR-022: require each reconstruction element and revision to identify observations, assets, transformations, parameters, software version, uncertainty, and reviewer status.
- PR-023: provide filters for observed, corroborated inference, disputed, interpolated, uncertainty, alternate hypotheses, source/camera visibility, and transformation history.

### Rights and privacy

- PR-030: require a source-specific authorization and rights decision before retention or export.
- PR-031: default ordinary copyrighted and unknown-rights sources to metadata, link, hash, and restrained excerpt.
- PR-032: prevent restricted, private-expert, confidential-source, and unnecessary personal data from public export packages.
- PR-033: support correction, takedown, retention, deletion, legal hold, and access-review states.

### Provenance and export

- PR-040: record acquisition method/version, timestamps/time zone, URL, headers needed for provenance, MIME, filename, byte size, SHA-256, storage state, rights basis, transformations, derivative hashes, responsible process, verification, and withdrawal history when applicable.
- PR-041: use append-only or hash-chained audit events for material changes.
- PR-042: provide deterministic, versioned JSON import/export and a human-readable report.
- PR-043: treat search indexes, embeddings, thumbnails, proxies, and reconstruction caches as rebuildable.

### Interface

- PR-050: provide investigation overview, evidence inspector, timeline, contradiction view, provenance inspector, rights panel, correction history, and export review.
- PR-051: make every displayed claim and time anchor navigable to exact evidence relationships and locators.
- PR-052: communicate uncertainty with text, icon, pattern/line style, accessible color, and rationale rather than color alone.
- PR-053: support keyboard operation, visible focus, reduced motion, responsive layouts, semantic landmarks, and legible type/contrast.

## Non-functional requirements

- NFR-001: local verification runs without accounts, cloud services, paid infrastructure, or live targets.
- NFR-002: imports, exports, reports, and hash manifests are byte-for-byte deterministic for identical inputs and tool versions.
- NFR-003: a clean clone can install, test, audit, build, and run from documented commands.
- NFR-004: security controls fail closed; network-connected components remain disabled until separately approved.
- NFR-005: no secret, personal account, private data, raw crawl capture, or private research note is committed.
- NFR-006: UI status and roadmap labels accurately distinguish WORKING, prototype, planned, validated, and production-ready.

## Acceptance criteria for this run

- all required repository artifacts exist and cross-link;
- the Apollo 11 fixture validates and passes package audits;
- the Charlie Kirk fixture validates, retains exact procedural status, passes package audits, and preserves material source conflicts without averaging;
- the Renee Good fixture validates, preserves the uncharged/open-investigation posture, passes package audits, and keeps observed motion, attributed agency claims, unresolved contact, and medical/legal classifications separate;
- the Southern Spear vessel-strike fixture validates, preserves the incomplete-public-accounting boundary, passes package audits, and keeps official target/cargo claims, source-specific casualty aggregates, survivor/SAR states, maritime-zone hypotheses, litigation allegations, and institutional legal positions separate;
- a deterministic export and report reproduce under test;
- the local interface builds and renders all four fixtures and each case scene loads only on demand;
- timeline discrepancy, evidence relationships, rights status, provenance, and export gate are inspectable;
- keyboard and responsive checks pass locally; and
- no live crawl, authenticated or paid access, source-body retention, external account, outreach, deployment, publication, or push occurs.
