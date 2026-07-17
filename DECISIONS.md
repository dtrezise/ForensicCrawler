# Decision Log

All decisions are WORKING unless explicitly marked otherwise. Revisions append new entries; do not silently rewrite prior rationale.

## D-0001 - Canonical workspace

- Date: 2026-07-16
- Status: accepted for local work
- Decision: `/Users/dan/Documents/GitHub/ForensicCrawler` is the canonical repository.
- Rationale: it is the user-designated location. The app-created `/Users/dan/Documents/Forensic Crawler` repository is separate and remains untouched.
- Consequence: no remote, visibility, commit, deployment, or publication is implied.

## D-0002 - Local implementation authorization

- Date: 2026-07-16
- Status: accepted with boundary
- Decision: treat the user's launch request as explicit approval for reversible local Phase 0/1 implementation.
- Boundary: no live crawling, external accounts, outreach, paid infrastructure, deployment, publication, or push.

## D-0003 - First vertical-slice pilot

- Date: 2026-07-16
- Status: accepted for WORKING fixture
- Decision: use a metadata-only Apollo 11 lunar-landing timing pilot.
- Rationale: it is bounded, historic, non-accusatory, and supported by official NASA records. The Apollo 11 Mission Report records surface landing at mission elapsed time 102:45:39.9; NASA's Record of Lunar Events lists 102:45:43. The 3.1-second difference demonstrates time-source reconciliation without implying misconduct.
- Rights boundary: store links, locators, metadata, a restrained excerpt, and locally authored fixture data; do not commit the NASA PDF or media.

## D-0004 - Portable package before database dependency

- Date: 2026-07-16
- Status: accepted
- Decision: make JSON Schema 2020-12 packages and deterministic import/export the authoritative runnable MVP format.
- Alternatives: SQLite-only or PostgreSQL-first.
- Rationale: portable fixtures and deterministic tests can run in a clean clone without infrastructure while the normalized PostgreSQL/PostGIS model remains specified for the next phase.

## D-0005 - Application stack

- Date: 2026-07-16
- Status: accepted for prototype
- Decision: React 19.2 with TypeScript and Vite 8 for the private local analyst interface; Node-based deterministic tools and Vitest for the first runnable slice.
- Future direction: isolated Python/Scrapy workers for allowed static sources; Playwright only by explicit source policy; PostgreSQL 18 with PostGIS 3.6; provider-neutral S3-compatible object boundaries and queue interfaces.
- Rationale: current, well-documented components; a small local dependency surface; no cloud lock-in or paid infrastructure.

## D-0006 - Confidence is not status

- Date: 2026-07-16
- Status: accepted
- Decision: evidence state, procedural status, and confidence are separate fields. Confidence requires a written rationale and optional bounds. Color is supplemental only.

## D-0007 - Provenance mechanism

- Date: 2026-07-16
- Status: accepted
- Decision: use append-only events with SHA-256 hash chaining and deterministic manifests. Do not add blockchain absent a distributed-trust requirement.

## D-0008 - Private expert research separation

- Date: 2026-07-16
- Status: accepted
- Decision: store expert research companions only below ignored `private/` paths; keep expert, interview, contact, and consent records out of the application fixture and build.
- Rationale: a research candidate is not a contributor, adviser, source, supporter, or endorser. The pilot has two institutionally verified historical/archival research leads but no outreach authorization, contact, or consent.
- Boundary: no automated outreach. Public-profile routes are research metadata only.

## D-0009 - Charlie Kirk assassination first-pass case

- Date: 2026-07-17
- Status: accepted for private WORKING fixture and local presentation
- Decision: use the September 10, 2025 fatal shooting of Charlie Kirk at Utah Valley University as the second test case, with lawful manual public-source research and a project-authored schematic 3D scene.
- Evidentiary boundary: the fatal incident is established; every defendant-specific action, motive, forensic association, and charge remains attributed to the State, a witness, an analyst, or open-court reporting unless and until adjudicated. The defendant is presumed innocent.
- Spatial boundary: the public record supports relational topology and conflicting approximate distances, not metric photogrammetry, a georeferenced site survey, a ballistic trajectory, identity analysis, or a court-validated reconstruction.
- Rights/privacy boundary: retain links, timestamps, locators, restrained paraphrases, and project-authored geometry only. Exclude source pixels, graphic imagery, minors, private addresses, unrelated people, court-restricted exhibits, biometric inference, and tactical detail.
- Authorization boundary: manual public research and reversible local implementation are approved for this case. Crawler execution, authenticated or paid access, raw third-party retention, outreach, deployment, publication, public release, and push remain unapproved.

## D-0010 - Interactive 3D implementation

- Date: 2026-07-17
- Status: accepted for schematic prototype
- Decision: use a pinned Three.js renderer for an interactive, code-native relational scene with source-stated, State-alleged, contradicted, and parametric-placeholder layers.
- Rationale: a scene graph can expose uncertainty and source conflicts without fabricating evidentiary pixels. The renderer is loaded on demand so the evidence and timeline surfaces remain lightweight.
- Boundary: no source texture, map tile, surveillance frame, face, photorealistic actor, wound simulation, firing solution, or hidden tactical route is included.

## D-0011 - Renee Good killing second forensic-event test

- Date: 2026-07-17
- Status: accepted for private WORKING fixture and local presentation
- Decision: use the January 7, 2026 fatal federal-agent shooting of Renee Good in Minneapolis as the next test of the engine's public-record chronology, competing-account, open-investigation, medical-response, rights, and qualitative-spatial workflows.
- Procedural boundary: Jonathan Ross is identified as the shooting agent and an uncharged subject of an open state investigation. No state charge, state declination, final independent use-of-force finding, or final public DHS report was identified through the July 17 cutoff. Future official decisions supersede this search-bounded posture.
- Evidentiary boundary: the death and shooting agent are established. Driver intent, exact physical contact, legal justification, criminal liability, bullet paths, and counterfactual survivability remain unresolved. DHS's initial account remains attributed, and the Medical Examiner's homicide classification is not presented as murder or unlawful-force adjudication.
- Spatial boundary: public video supports qualitative topology only. `STREET_FRAME_V1` is non-georeferenced, non-metric, and excludes speed, collision, trajectory, body-pose, and clinical-causation solves.
- Rights/privacy boundary: retain metadata, timestamps, locators, restrained paraphrases, and project-authored geometry only. Exclude graphic media, autopsy imagery, children, family information, plates, addresses, exact witness positions, private medical information, unrelated people, and tactical optimization.
- Authorization boundary: lawful manual public research and reversible local implementation are approved. Crawler execution, authenticated or paid access, source-media retention, outreach, deployment, publication, public release, and push remain unapproved.

## D-0012 - Operation Southern Spear vessel-strike campaign test

- Date: 2026-07-17
- Status: accepted for private WORKING fixture and local presentation
- Decision: treat the user's Venezuela boat-bombing prompt as the U.S. lethal vessel-strike campaign beginning September 2, 2025 and later operating under Operation Southern Spear, while excluding interdictions, tanker seizures, land strikes, and the separate Venezuela operation.
- Completeness boundary: SOUTHCOM told the Lead Inspector General that it could not provide a complete public accounting. The package therefore presents a representative incident register and source-specific aggregates. At least 66 vessels through June 21 is a derived public lower bound, not an official total; no single unqualified death number is adopted.
- Evidentiary boundary: U.S. target, cargo, DTO, route, international-waters, casualty, and SAR statements remain attributed. The Burnley complaint contains plaintiffs' allegations, and IACHR/OHCHR records contain institutional legal assessments; none is presented as a merits judgment.
- Spatial boundary: `EVENT_LOCAL_V1` is a unitless, non-georeferenced maritime source-state cell. It excludes impact replay, exact coordinates, platform, munition, sensor, route, targeting geometry, survivor tracking, and any photogrammetric or legal-zone solve.
- Rights/privacy/security boundary: retain metadata, exact locators, restrained paraphrases, and project-authored abstract geometry only. Exclude fatal-strike media, bodies, faces, remains, family details, speculative identification, and operationally useful detail.
- Authorization boundary: lawful manual public research and reversible local implementation are approved. Crawler execution, source-media retention, authenticated or paid access, outreach, deployment, publication, public release, push, and tactical analysis remain unapproved.
