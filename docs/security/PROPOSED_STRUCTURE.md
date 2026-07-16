# Proposed Directory Structure

Status: WORKING - PROPOSAL ONLY

Only the security documents and `.gitignore` exist now. Do not scaffold product code until Gate 0 in [`LAUNCH_BLOCKERS.md`](LAUNCH_BLOCKERS.md) is approved.

```text
ForensicCrawler/
├── AGENTS.md
├── SECURITY.md
├── README.md
├── .gitignore
├── .env.example                  # names and descriptions only; never values
├── pyproject.toml                # pinned or locked backend toolchain
├── uv.lock                       # exact dependency lock, if Python/uv is selected
├── package.json                  # private review UI only, if selected
├── pnpm-lock.yaml
├── config/
│   ├── README.md
│   ├── source-registry.schema.json
│   ├── source-registry.example.yaml
│   ├── retention.schema.json
│   └── retention.example.yaml
├── docs/
│   ├── decisions/                # versioned architecture/security decisions
│   ├── runbooks/
│   │   ├── emergency-stop.md
│   │   ├── incident-response.md
│   │   ├── credential-rotation.md
│   │   ├── correction-takedown.md
│   │   └── deletion.md
│   └── security/                 # this review packet
├── src/forensic_crawler/
│   ├── control_plane/
│   │   ├── authn/
│   │   ├── authz/
│   │   ├── manifests/
│   │   ├── source_registry/
│   │   ├── url_policy/
│   │   ├── robots_policy/
│   │   ├── scheduler/
│   │   └── emergency_stop/
│   ├── fetch_plane/
│   │   ├── worker/
│   │   ├── egress_policy/
│   │   └── response_gate/
│   ├── processing/
│   │   ├── quarantine/
│   │   ├── extractors/
│   │   ├── minimization/
│   │   └── redaction/
│   ├── provenance/
│   ├── retention/
│   ├── deletion/
│   ├── review_api/
│   └── observability/
├── web/                           # private authenticated review client
├── migrations/
│   ├── normalized/
│   ├── derived/
│   ├── annotations/
│   └── audit/
├── infra/
│   ├── environments/
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   ├── network/
│   ├── identities/
│   ├── storage/
│   └── policies/
├── scripts/
│   └── security/                  # local checks; never target utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── security/
│   │   ├── ssrf/
│   │   ├── access_control/
│   │   ├── rate_limits/
│   │   ├── robots/
│   │   ├── redaction/
│   │   ├── provenance/
│   │   ├── deletion/
│   │   └── emergency_stop/
│   └── fixtures/
│       └── synthetic/             # generated, non-personal, local-only origins
└── .github/
    ├── CODEOWNERS
    ├── dependabot.yml
    └── workflows/
        ├── quality.yml
        ├── security.yml
        └── artifact-provenance.yml
```

## Storage is not repository content

The following are deployed protected data services, not Git directories:

- raw capture object storage;
- normalized record database;
- derived analysis database;
- user annotation database;
- append-only provenance/audit store;
- encrypted backups; and
- short-lived export staging.

Real crawled data, captured media, private research, credentials, logs, databases, backups, and exports must never enter Git. Synthetic fixtures must be visibly synthetic and contain no copied personal or copyrighted source material.
