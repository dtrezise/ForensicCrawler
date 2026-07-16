# Forensic Crawler

Status: WORKING local Phase 0/1 prototype

Forensic Crawler is a provenance-first forensic research workspace for bounded, lawful investigations. It organizes source records, claims, evidence relationships, time anchors, contradictions, rights decisions, transformations, corrections, and deterministic exports without presenting repetition or model output as truth.

> Every conclusion can be traced to evidence, every transformation is recorded, and every reconstruction visibly distinguishes observation from inference and interpolation.

## What works in this first vertical slice

- a metadata-only Apollo 11 landing-time pilot built from official NASA locators;
- permanent IDs and separate normalized record types;
- explicit evidence states and claim-to-source relationship functions;
- timeline anchors with time-system, precision, and uncertainty fields;
- a benign 3.1-second source discrepancy with an alternate-explanation review surface;
- rights and storage decisions with link-only defaults;
- source, claim, asset, transformation, correction, import/export, and hash-chained audit records;
- deterministic JSON validation, import, export, report generation, and package audits; and
- a responsive, keyboard-accessible local analyst interface.

No live crawler, authentication, outreach, public viewer, 3D reconstruction, mobile capture, deployment, or publication exists in this phase.

## Start locally

Requirements: Node.js 20.19 or newer and pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm dev
```

Open the local URL printed by Vite. The application reads the reviewed fixture committed under `fixtures/pilots/apollo-11-landing/`; it does not make crawler requests.

## Verification commands

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm audit:package
pnpm source:check
pnpm export:pilot
pnpm import:pilot
pnpm report:pilot
```

Generated test exports go to ignored `tmp/` paths. The audit-ready WORKING report is written to `output/reports/APOLLO_11_LANDING_AUDIT.md`. The source PDFs are not part of this repository.

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

## Safety boundary

Read `AGENTS.md` and `SECURITY.md` before changing the repository. Live sources require an approved source registry entry, research manifest, rights and privacy review, network safety controls, rate policy, emergency stop, and explicit user approval. No automated workflow may publish, contact a person, convert an allegation into fact, or change evidence history silently.

## Technology direction

The local slice uses React, TypeScript, Vite, JSON Schema, Ajv, and Vitest. The deployable architecture remains provider-neutral and plans for PostgreSQL/PostGIS, S3-compatible object storage, a queue abstraction, and isolated Python workers. See [`TECHNOLOGY_EVALUATION.md`](TECHNOLOGY_EVALUATION.md).
