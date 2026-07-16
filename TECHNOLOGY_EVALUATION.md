# Technology Evaluation

Status: WORKING
Reviewed: 2026-07-16

## Selected for the local vertical slice

| Layer | Selection | Reason |
|---|---|---|
| Analyst interface | React 19.2 + TypeScript | Component model and accessible interactive views without a server dependency |
| Local build | Vite 8 | Fast local development and deterministic static production build; current documentation requires Node 20.19+ or 22.12+ |
| Package contracts | JSON Schema 2020-12 + Ajv 8 | Portable, language-neutral, versioned validation before database lock-in |
| Deterministic tools | Node standard library | Shared runtime with the UI, built-in SHA-256, no cloud service |
| Tests | Vitest 4 + Testing Library | Unit, schema, deterministic export, audit, and component behavior in one local workflow |
| Package management | pnpm with exact lockfile | Reproducible clean-clone installation and controlled dependency graph |

## Selected direction for deployable phases

| Layer | Direction | Boundary |
|---|---|---|
| Static/source crawling | Python with Scrapy | Only behind source registry, URL/robots/rights policy, scheduler budgets, isolated workers, and egress enforcement |
| Browser automation | Playwright | Disabled by default; only for a specifically approved public source where rendering is lawful and necessary |
| Primary database | PostgreSQL 18 | Normalized records, constraints, transactions, range/time types, JSONB for bounded extension fields, row/object policy at service layer |
| Geospatial | PostGIS 3.6 | Spatial anchors, geometry, coordinate reference systems, and later 2D/3D evidence derivation |
| Object storage | S3-compatible interface | Provider-neutral content-addressed keys; immutable versions where rights permit bytes |
| Jobs | Queue abstraction | Durable bounded job envelopes and short-lived worker identities; no worker-created unreviewed scope |
| Search | Rebuildable index | Never authoritative; generated from normalized records and provenance IDs |

## Alternatives considered

- **Next.js or provider-specific full stack:** deferred to avoid coupling the evidence model and local prototype to a hosting vendor.
- **PostgreSQL-first local runtime:** deferred because it would raise first-run setup cost; the SQL model remains specified and JSON round trips are executable now.
- **SQLite as authority:** useful for later offline mode but not selected as the canonical long-range relational model because concurrency, geospatial, and access boundaries point to PostgreSQL.
- **Playwright for all sources:** rejected. Static HTTP should remain the default; browser execution expands rights, security, resource, and reproducibility risks.
- **Blockchain:** rejected absent a multi-party trust requirement that a signed/hash-chained append-only log cannot meet.
- **LLM or embedding as evidence authority:** rejected. Models and indexes are derived tools and cannot corroborate their own inputs.

## Primary technical references

- [React documentation](https://react.dev/learn)
- [Vite guide](https://vite.dev/guide/)
- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12)
- [Scrapy documentation](https://docs.scrapy.org/en/latest/)
- [Playwright Python documentation](https://playwright.dev/python/docs/intro)
- [PostgreSQL current documentation](https://www.postgresql.org/docs/current/)
- [PostGIS manual](https://postgis.net/documentation/manual/)

Versions are implementation snapshots, not permanent doctrine. Re-evaluate support, security, compatibility, and migration cost before each major upgrade.
