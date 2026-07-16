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
