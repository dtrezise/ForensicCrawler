# Research Intake Deployment Contract

Status: WORKING — interface and contract only; deployment and network execution are not approved.

## Purpose

The local research-intake UI creates a minimal `ResearchIntake` record and visibly runs a deterministic local preparation sequence: canonicalization, scope-record creation, rights/privacy-template creation, source-plan placeholder creation, and a human-review gate. It is not an investigation, source request, engine finding, publication, or permission to crawl. Its purpose is to prevent duplicate case creation and preserve enough intent for a human to decide whether a governed investigation should exist.

## Browser contract

The browser may submit only:

- a bounded subject string;
- an optional research question; and
- authenticated request metadata supplied by the platform, never by the form.

The browser must not receive crawler credentials, source-policy privileges, moderation decisions, internal evidence identifiers, raw captures, model prompts, or queue access. The current local UI stores requests in browser storage only as a prototype; production state must be server-owned.

## Server-side admission path

1. Authenticate the user and apply tenant, role, abuse, and rate-limit controls.
2. Validate and normalize the subject on the server. Preserve the submitted string and normalization version separately.
3. Resolve duplicates against canonical investigation titles, aliases, aliases under review, and active intakes. Return the canonical title and a permission-filtered link when a match exists.
4. Create an append-only intake event with status `intake_registered`; do not create an investigation package yet.
5. Run policy review: research purpose, jurisdiction, sensitive-person risk, safety, privacy, rights, source categories, retention, and conflict-of-interest constraints.
6. Require an authorized reviewer to approve a bounded source plan and investigation scope.
7. Only then create a queue job with a server-assigned budget, approved origin/path allowlists, retention rules, emergency-stop state, and least-privilege worker identity.
8. Let isolated workers produce proposed records only. A human reviewer must approve source admission, transformations, claims, corrections, exports, and any publication separately.

## API shape

`POST /v1/research-intakes`

```json
{
  "subject": "October 7th",
  "researchQuestion": "Build a source plan for a bounded chronology review."
}
```

Possible responses:

- `201`: intake created with a server-generated ID and `intake_registered` status;
- `200`: duplicate match, returning the canonical investigation or existing intake visible to the requester;
- `400`: validation failure;
- `401` / `403`: authentication or authorization failure;
- `429`: rate limit;
- `409`: concurrent canonicalization conflict; and
- `451`: policy or jurisdiction restriction.

No response should imply research has occurred merely because an intake exists.

## Security and abuse controls

- Enforce server-side maximum lengths, Unicode normalization, structured logging, CSRF protections where applicable, bot resistance, per-account and per-IP quotas, and notification suppression.
- Use authorization-aware duplicate results; do not reveal the title, existence, or status of private investigations to an unauthorized user.
- Keep intake text out of client analytics and avoid full-text logs where it can contain allegations or personal data.
- Treat all free text as untrusted. Escape it in every destination and prohibit it from becoming a URL, query, prompt, file path, shell argument, or crawler scope without separate review.
- Keep source admission and worker networking in a separate control plane. Re-check allowlists, DNS/IP policy, redirect targets, robots, terms, rate limits, response size, and emergency-stop state immediately before every connection.

## Data lifecycle

The production intake record needs an immutable ID, requester/tenant ID, original and normalized subject, normalization version, status history, duplicate-resolution decision, reviewer decision, retention class, deletion/takedown linkage, and audit events. Browser-local records are explicitly non-authoritative and must not be treated as custody evidence.

## Rollout gates

Before public deployment, add authenticated persistence, authorization-aware duplicate search, moderation/abuse operations, reviewer workflows, queue isolation, structured audit logs, deletion propagation, observability, incident response, accessibility review, load testing, security testing, and a legal/privacy/defamation review. Do not enable any live crawling merely because the intake interface is live.
