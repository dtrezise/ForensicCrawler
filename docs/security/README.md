# Security Foundation Review Packet

Status: WORKING - LOCAL IMPLEMENTATION AND CASE-BOUNDED MANUAL PUBLIC RESEARCH APPROVED
Prepared: 2026-07-17

## Decision requested

The user's 2026-07-16 launch request approved reversible local implementation against synthetic or specifically reviewed metadata-only fixtures. The 2026-07-17 case requests additionally approved lawful manual research of public sources and private schematic 3D presentations for the Charlie Kirk assassination and Renee Good killing. Neither approval permits crawler execution, authenticated or paid access, raw third-party body retention, publication, deployment, account creation, outreach, or push.

## Canonical workspace state

- Canonical local path: `/Users/dan/Documents/GitHub/ForensicCrawler`
- Git state at setup: newly initialized local repository, branch `main`, no commits
- Git remote: none
- GitHub visibility: not applicable because no GitHub repository is connected; a private remote must be verified before any push
- Repository routing at setup: global `~/.codex/AGENTS.md` only; no `MODEL_ROUTING.md` or `.ai-routing.local.yaml`

The separate app-created repository at `/Users/dan/Documents/Forensic Crawler` was not used for project artifacts and was not modified during this setup.

## Source basis and scope decision

The two starting PDFs describe a broad working concept: a rights-aware crawler and provenance store, later timeline analysis, 3D reconstruction, and mobile field capture. Both exports also contain unrelated CivicLedger text; that material is treated as cross-project source contamination and is not a Forensic Crawler requirement.

The approved-for-review security baseline narrows the first implementation phase to:

1. a manually curated source registry;
2. a deny-by-default URL and rights policy engine;
3. an isolated, rate-limited fetch pipeline for public authorized sources;
4. provenance, retention, correction, and deletion controls; and
5. private human review with no public output by default.

Social-media ingestion, authenticated sources, outreach, automated publication, mobile capture, biometric or precise-location processing, model training, public datasets, and court-admissibility claims remain out of scope. A code-native relational 3D scene is approved only as a private schematic with no source pixels, identity analysis, georeference, trajectory, tactical optimization, or admissibility claim.

## Review artifacts

1. [`SECURITY.md`](../../SECURITY.md) - mandatory repository, crawler, data, application, editorial, rotation, and incident policy
2. [`AGENTS.md`](../../AGENTS.md) - mandatory operating rules and stop conditions for agents
3. [`THREAT_MODEL.md`](THREAT_MODEL.md) - assets, adversaries, attack surfaces, misuse cases, and controls
4. [`DATA_FLOW_AND_TRUST_BOUNDARIES.md`](DATA_FLOW_AND_TRUST_BOUNDARIES.md) - data-flow diagram, trust zones, and permission map
5. [`CRAWLER_ARCHITECTURE.md`](CRAWLER_ARCHITECTURE.md) - secure control plane, fetch plane, URL admission, storage, and emergency-stop design
6. [`LAUNCH_BLOCKERS.md`](LAUNCH_BLOCKERS.md) - implementation, network-use, and launch gates
7. [`PROPOSED_STRUCTURE.md`](PROPOSED_STRUCTURE.md) - proposed code and documentation layout; no product skeleton has been created
8. [`TEST_PLAN.md`](TEST_PLAN.md) - local-first security verification plan
9. [`.gitignore`](../../.gitignore) - first-pass exclusion of credentials, data, captures, private research, logs, backups, and build artifacts

## Foundational decisions

- **Fail closed:** no job runs without explicit scope, rights, robots, identity, rate, retention, and operator decisions.
- **Separate control and fetch planes:** user-facing services never fetch arbitrary URLs directly.
- **Allowlist plus network enforcement:** hostname checks alone are insufficient; every resolved address and redirect is checked and egress is restricted.
- **Metadata-first retention:** unknown or fair-use-candidate content defaults to link and metadata only pending rights review.
- **Append-only provenance:** changes, corrections, denials, and deletions become events; source history is not silently rewritten.
- **Human publication gate:** the system may organize source claims but does not determine truth, guilt, identity, or motive.
- **Project isolation:** Forensic Crawler has its own repository, accounts, domains, credentials, storage, and public identity.

## Approval record

Local implementation approval was recorded from the user's 2026-07-16 launch request. Scope: Phase 0 source reconciliation and Phase 1 local vertical-slice implementation only, with no live crawling or external side effects. The repository has no commit yet, so the approval currently identifies this worktree and request rather than a commit. Record the first reviewed commit, accepted exceptions, and next review date before any network-connected test.
