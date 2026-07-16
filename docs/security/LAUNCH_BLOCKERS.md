# Launch-Blocker Checklist

Status: LOCAL IMPLEMENTATION GATE OPEN; ALL NETWORK AND EXTERNAL GATES CLOSED

No product implementation, live-source crawling, account creation, external contact, deployment, publication, or push is authorized by this checklist. The gates are cumulative.

## Gate 0 - Foundation review before product code

- [x] The user's 2026-07-16 launch request explicitly approved reversible local Phase 0/1 implementation.
- [x] Local scope defers social media, authenticated sources, outreach, mobile capture, 3D reconstruction, model training, public datasets, and legal-grade claims.
- [x] `/Users/dan/Documents/GitHub/ForensicCrawler` is confirmed as the canonical working repository; the separate app-created repository remains untouched.
- [ ] Record the first reviewed Git commit, accepted exceptions, owners, deadlines, and review expiry before any network-connected test.

## Gate 1 - Repository and project identity before remote creation or push

- [ ] **DAN NEEDED:** Explicitly approve creating or connecting a private GitHub repository; verify its private visibility before any push.
- [ ] **DAN NEEDED:** Select project-owned domain, email/contact route, credential owner, and platform accounts with no personal metadata.
- [ ] Enable MFA, least privilege, protected default branch, private vulnerability reporting, and access review.
- [ ] Enable pre-commit/staged and CI secret scanning; verify ignored data cannot be staged accidentally.
- [ ] Confirm no public Pages, preview, artifact, source, or deployment link exists.
- [ ] Confirm no account, secret, storage, analytics, domain, or metadata is shared with TDS, Handprint, Civic Ledger, Gas Prices, or Jesus Sheeple.

## Gate 2 - Architecture before any network-connected test

- [ ] Implement and review the domain/path source registry with named approval, authorization basis, rights state, expiry, rate, retention, and contact route.
- [ ] Complete qualified review of crawling terms, robots handling, copyright, privacy, defamation, and intended jurisdictions.
- [ ] Enforce the URL-admission algorithm at scheduling, connection, re-resolution, and every redirect.
- [ ] Route all worker egress through a controlled proxy and DNS resolver; prove that direct egress and special-purpose networks are blocked.
- [ ] Isolate crawler and extractor workloads with separate identities, no shell, read-only roots, resource caps, and no reusable credentials.
- [ ] Implement centralized per-origin/global limits, bounded jobs, `Retry-After`, backoff with jitter, and conservative defaults.
- [ ] Implement the global, environment, source, and job emergency stops with an independent network backstop.
- [ ] Fail closed when authorization, robots, rights, audit, rate limiting, or emergency-stop services are unavailable.

## Gate 3 - Data governance before retaining any source body

- [ ] Approve a data inventory, classification, purpose, lawful/rights basis, field minimization, access owner, and retention period.
- [ ] Separate raw, normalized, derived, annotation, audit, and export stores with distinct service permissions.
- [ ] Default to metadata/link/hash/short quotation; document every source class permitted to retain a body.
- [ ] Implement provenance events and verify input/output hashes across fetch and extraction.
- [ ] Implement personal-data detection, redaction or salted hashing, review queues, and protected defaults.
- [ ] Implement correction, denial, access review, export, takedown, and deletion workflows.
- [ ] Prove deletion propagation through object versions, databases, indexes, caches, exports, and backup expiry.
- [ ] Encrypt protected data in transit and at rest; separate and rotate keys.

## Gate 4 - Application and operational security before private pilot

- [ ] Strong authentication, short sessions, CSRF protection, server-side RBAC/object authorization, and step-up approval exist.
- [ ] The permission matrix is implemented and tested; no production user has unreviewed all-powerful access.
- [ ] Logs omit secrets, raw bodies, auth material, and unnecessary personal data; alerts use a project-owned channel.
- [ ] Dependency, secret, SAST, SCA, license, infrastructure, container, and SBOM checks block unsafe changes in CI.
- [ ] Builds are reproducible enough to identify deployed source and dependencies; artifacts are signed where supported.
- [ ] Backups, restoration, key rotation, incident response, and emergency shutdown have passed exercises.
- [ ] The security test plan passes in a local or isolated mock environment with retained evidence.
- [ ] Independent security review or penetration test findings are resolved or explicitly risk-accepted.

## Gate 5 - Before any live source

- [ ] **DAN NEEDED:** Explicitly approve the exact research manifest, named sources, time window, fields, limits, retention, and operator.
- [ ] Revalidate source authorization, terms, robots, rights, contact route, and allowlist expiry immediately before use.
- [ ] Confirm the user agent and contact route are project-owned and appropriate.
- [ ] Run a single-source, minimal-budget canary with no body retention and observe stop, rate, provenance, and deletion controls.
- [ ] Review canary evidence before increasing scope. No approval automatically carries to another origin, path, purpose, or time period.

## Gate 6 - Before any export, publication, or contact

- [ ] **DAN NEEDED:** Explicitly approve the specific external action and destination.
- [ ] Human rights, privacy, editorial, and legal review has distinguished fact, allegation, finding, analysis, and inference.
- [ ] Output is minimized, redacted, source-linked, time-bounded, and accompanied by limitations, corrections, and denials.
- [ ] No raw capture, personal data, private analysis, or copyrighted content is included by default.
- [ ] Correction and takedown intake is operational through a project-owned contact route.
- [ ] Export expires, is integrity-protected, and is logged; public or automated distribution is separately approved.
