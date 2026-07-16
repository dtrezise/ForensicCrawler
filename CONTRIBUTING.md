# Contributing

Status: WORKING

## Before changing anything

1. Read `AGENTS.md`, `SECURITY.md`, and the relevant security/design documents.
2. Confirm the canonical Git root, branch, status, and remotes.
3. Preserve user work and unrelated changes.
4. Keep new work `WORKING` unless explicitly approved.
5. Record consequential design or policy choices in `DECISIONS.md`.

## Local setup

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm dev
```

Do not add credentials to `.env.example`; document variable names and purpose only. Use synthetic fixtures or explicitly reviewed metadata-only public-record fixtures. Never commit raw crawls, private research, expert contact details, source PDFs, databases, logs, exports, or secrets.

## Change requirements

- Add or update schema definitions before new authoritative fields or record types.
- Keep IDs permanent and revisions append-only.
- Add exact evidence relationships and locators for displayed claims.
- Add tests for validation, broken references, determinism, rights/export boundaries, and UI behavior.
- Keep derived indexes/caches out of authority decisions.
- Update documentation and status labels; do not imply a planned service is implemented.
- Run `pnpm verify` and inspect the responsive interface before handoff.

## Crawler and source changes

No live crawler target is currently authorized. A future source change needs an approved registry entry, research manifest, legal/rights/privacy review, robots and rate policy, SSRF/redirect/DNS controls, isolated worker, emergency stop, and explicit user approval.

## Reviews

Security, forensic/editorial, rights/privacy, data-model, and accessibility findings are distinct review responsibilities. Material claims require contrary-evidence review. Public or external actions require separate explicit approval even when code is complete.

## Git and external actions

Do not reset, discard, rewrite history, publish, deploy, create accounts, contact people, push, change repository visibility, or create public links without explicit authorization.
