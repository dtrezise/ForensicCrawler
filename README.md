# Forensic Crawler

Status: WORKING local provenance and schematic-reconstruction prototype

Forensic Crawler is a provenance-first forensic research workspace for bounded, lawful investigations. It organizes source records, claims, evidence relationships, time anchors, contradictions, rights decisions, transformations, corrections, and deterministic exports without presenting repetition or model output as truth.

> Every conclusion can be traced to evidence, every transformation is recorded, and every reconstruction visibly distinguishes observation from inference and interpolation.

## What works in the current local prototype

- a metadata-only Apollo 11 landing-time pilot built from official NASA locators;
- a second, private Charlie Kirk assassination case fixture with 13 reviewed public-source locators, 18 status-typed claims, 11 timeline events, five contradiction ledgers, and a current procedural-status boundary;
- a third, private Renee Good killing fixture with 24 public-source locators, 24 status-typed claims, 13 timeline events, eight contradiction ledgers, and an explicit uncharged/open-investigation boundary;
- a fourth, private Operation Southern Spear vessel-strike fixture with 20 public-source locators, 24 status-typed claims, 10 representative timeline events, seven contradiction ledgers, and an explicit incomplete-accounting boundary;
- an interactive, code-native 3D scene with separate source-stated, State-alleged, contradicted, and parametric-placeholder layers;
- a second qualitative street scene that separates publisher-verified observations, attributed federal claims, independent analysis, and unresolved questions without claiming intent, contact, collision dynamics, or trajectory;
- a unitless maritime event cell that separates published-source observations, attributed target/cargo/casualty claims, survivor/SAR states, maritime-zone hypotheses, and withheld operational detail without replaying an attack;
- explicit disclosure that the case scene is schematic, non-georeferenced, non-photogrammetric, and not a trajectory or court-validated reconstruction;
- permanent IDs and separate normalized record types;
- explicit evidence states and claim-to-source relationship functions;
- timeline anchors with time-system, precision, and uncertainty fields;
- a benign 3.1-second source discrepancy with an alternate-explanation review surface;
- rights and storage decisions with link-only defaults;
- source, claim, asset, transformation, correction, import/export, and hash-chained audit records;
- deterministic JSON validation, import, export, report generation, signed local manifests, and package audits;
- a controlled, project-owned multi-view benchmark that emits a validated point cloud, mesh, and Gaussian-splat interchange fixture without treating them as case evidence; and
- a responsive, keyboard-accessible local analyst interface with global search, comparison, presentation mode, resizable inspection, direct artifact links, and temporal reconstruction controls.

No live crawler, authentication, outreach, public viewer, third-party source-pixel ingestion, mobile capture, deployment, or publication exists in this phase. Case 3D surfaces are project-authored schematics only. The controlled spatial benchmark is synthetic and validates the pipeline contract; it is not a photogrammetric reconstruction of any investigated event.

## Start locally

Requirements: Node.js 20.19 or newer and pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm cases:rebuild
pnpm spatial:benchmark
pnpm dev
```

Open the local URL printed by Vite. The application opens on the Southern Spear vessel-strike case and retains the Renee Good, Charlie Kirk, and Apollo 11 pilots in the case selector. It reads local fixtures and makes no crawler or runtime source requests.

## Verification commands

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm audit:package
pnpm audit:kirk
pnpm audit:good
pnpm audit:vessels
pnpm source:check
pnpm source:kirk
pnpm source:good
pnpm source:vessels
pnpm manifest:verify:all
pnpm spatial:benchmark
pnpm cases:rebuild
pnpm export:pilot
pnpm import:pilot
pnpm report:pilot
pnpm report:kirk
pnpm report:good
pnpm report:vessels
pnpm brief:setup
pnpm brief:kirk
pnpm brief:good
pnpm brief:vessels
```

`brief:setup` creates an ignored local Python environment for the pinned PDF renderer; it only needs to be run once. `cases:rebuild` deterministically rebuilds all four packages and scenes, signs their local manifests, regenerates Markdown/PDF outputs, and synchronizes browser-download copies. `spatial:benchmark` regenerates the controlled geometry and records whether COLMAP is locally available; it never installs software or fetches data. Generated test exports go to ignored `tmp/` paths. Audit-ready WORKING reports are written under `output/reports/`; private rendered briefs are under `output/pdf/`. Third-party source PDFs, articles, photographs, and videos are not part of this repository.

## Core documents

- [System summary](SYSTEM_SUMMARY.md)
- [Vision and scope](VISION_AND_SCOPE.md)
- [Product requirements](PRODUCT_REQUIREMENTS.md)
- [Forensic and editorial standards](FORENSIC_AND_EDITORIAL_STANDARDS.md)
- [Rights, privacy, and compliance](RIGHTS_PRIVACY_AND_COMPLIANCE.md)
- [Threat model](THREAT_MODEL.md)
- [Data architecture](DATA_ARCHITECTURE.md)
- [Source registry policy](SOURCE_REGISTRY_POLICY.md)
- [Reconstruction confidence model](RECONSTRUCTION_CONFIDENCE_MODEL.md)
- [Expert interview pipeline](EXPERT_INTERVIEW_PIPELINE.md)
- [Roadmap](ROADMAP.md)
- [Decision log](DECISIONS.md)
- [Starting-source provenance](docs/source/STARTING_SOURCE_PROVENANCE.md)
- [Security foundation](SECURITY.md)
- [Research-intake deployment contract](docs/RESEARCH_INTAKE_DEPLOYMENT.md)

## Safety boundary

Read `AGENTS.md` and `SECURITY.md` before changing the repository. Live sources require an approved source registry entry, research manifest, rights and privacy review, network safety controls, rate policy, emergency stop, and explicit user approval. No automated workflow may publish, contact a person, convert an allegation into fact, or change evidence history silently.

## Technology direction

The local slice uses React, TypeScript, Vite, JSON Schema, Ajv, and Vitest. The deployable architecture remains provider-neutral and plans for PostgreSQL/PostGIS, S3-compatible object storage, a queue abstraction, and isolated Python workers. See [`TECHNOLOGY_EVALUATION.md`](TECHNOLOGY_EVALUATION.md).
