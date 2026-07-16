# Security Test Plan

Status: WORKING - PRE-IMPLEMENTATION ACCEPTANCE PLAN

## Test rules

- Run against local synthetic HTTP, DNS, object-store, database, queue, and identity fixtures. Do not test live third-party targets.
- Keep the mock internet on an isolated network with explicit safe fixtures for public, private, redirect, timeout, oversized, malformed, and malicious responses.
- Every security fix gets a regression test. A bypass in one URL representation must be expanded into an equivalence class.
- CI must fail closed when a required security test or scanner is unavailable.
- Record test build, configuration, policy version, fixture version, expected result, actual result, and evidence without secrets or personal data.

## Acceptance levels

- **Unit:** deterministic policy and transformation behavior.
- **Component:** one service plus local dependencies.
- **Integration:** control plane, queue, worker, proxy, stores, and audit flow.
- **Abuse:** hostile inputs and misuse cases.
- **Resilience:** dependency outage, race, retry, crash, and emergency-stop behavior.

All critical cases below must pass before Gate 5 allows a live-source canary.

## 1. SSRF, DNS, protocol, and redirect prevention

### URL parsing and normalization

- Accept only policy-approved canonical `https` and explicitly approved `http` URLs.
- Reject `file`, `ftp`, `gopher`, `data`, `javascript`, `blob`, `dict`, unknown schemes, local paths, UNC paths, embedded credentials, empty host, control characters, ambiguous separators, excessive length, and disallowed ports.
- Exercise decimal, octal-like, hexadecimal-like, dword-like, mixed, shortened, percent-encoded, IPv4-mapped IPv6, bracketed IPv6, zone identifiers, trailing-dot hosts, mixed case, Unicode and punycode, user-info confusion, dot segments, and duplicate-slash representations.
- Prove canonical comparison does not permit a prefix/suffix trick such as `allowed.example.attacker.test`.

### Address policy

- Reject loopback, unspecified, private, link-local, carrier-grade NAT, multicast, documentation, benchmarking, reserved, and cloud-metadata ranges for IPv4 and IPv6.
- Reject a hostname if any A or AAAA answer is prohibited.
- Verify the connection uses the validated address and correct TLS hostname, not a later unvalidated resolution.
- Simulate DNS rebinding from safe to private, private to safe, mixed answers, short TTL, resolver disagreement, and re-resolution between queue and connect; every unsafe state must block.
- Prove a worker cannot bypass the egress proxy or reach the control plane, databases, queue administration, host network, container runtime, or metadata service.

### Redirects and response-discovered URLs

- Disable automatic redirects and validate each hop from scratch.
- Test safe-to-private, safe-to-metadata, safe-to-disallowed-domain, HTTP-to-file-like, cross-port, cross-authority, relative, encoded, loop, and over-limit redirect chains.
- Validate URLs found in HTML, feeds, sitemaps, canonical tags, media manifests, documents, and API payloads before scheduling; discovery alone never grants scope.
- Confirm rejected attempts create a minimal audit event without fetching the target.

### Pass criteria

No prohibited destination receives a connection in packet/proxy evidence, even during races, redirects, retries, or safety-service failure.

## 2. Access control

- Verify unauthenticated users cannot reach any private feature, object, API, WebSocket, export, or administrative route.
- Test every role and object operation in the permission map, including direct API calls that bypass the UI.
- Test horizontal access across research manifests, sources, records, annotations, jobs, exports, and deletion requests.
- Test vertical escalation through modified role claims, object IDs, hidden fields, mass assignment, stale tokens, session fixation, CSRF, alternate HTTP methods, and race conditions.
- Require step-up approval for source approval, break-glass raw access, export, credential or identity changes, and deletion execution.
- Verify service identities can perform only their one bounded workflow and cannot assume human roles.
- Test revocation, expiry, concurrent session limits, environment isolation, and fail-closed behavior when the authorization service is unavailable.
- Verify all allowed and denied sensitive actions create appropriately minimized audit events.

### Pass criteria

Every operation not explicitly granted is denied server-side; no client-only control is security-relevant.

## 3. Rate limiting, budgets, and emergency stop

- Verify independent per-origin, per-source, per-job, per-operator, and global limits.
- Start with one request at a time per origin and prove configuration cannot exceed a reviewed maximum silently.
- Test token refill, burst cap, clock skew, multiple workers, multiple job aliases for one origin, queue replay, and restarts.
- Verify `Retry-After` for supported date and seconds forms, exponential backoff with jitter, retry caps, and no retries for permanent denials.
- Enforce maximum URLs, depth, bytes, response size, redirects, wall time, errors, and retries.
- Activate job, source, environment, and global stops before dequeue, during DNS, during connect, during streaming, during backoff, and after worker partition.
- Disable the scheduler, audit service, rate service, or stop service and confirm no unsafe work continues.
- Prove the network policy stops egress even if a worker ignores the application stop.

### Pass criteria

Observed request counts never exceed configured budgets; emergency stop prevents new connections within the documented objective and produces an auditable result.

## 4. Robots and site-policy compliance

- Test user-agent group matching, case handling, comments, blank lines, Unicode, percent encoding, longest matching rule, `Allow`, `Disallow`, empty rules, wildcard and end-anchor semantics defined by the chosen parser.
- Test robots redirects within and across authorities, redirect loops, hop caps, malformed lines, oversized files, and parser errors.
- On successful retrieval, enforce parseable rules.
- For this system, treat DNS/network errors, timeout, TLS failure, and 5xx robots responses as complete disallow until reviewed.
- Test 4xx behavior against documented project policy; never let a permissive RFC default override stricter terms, source registry, or rights policy.
- Refresh cached policy within 24 hours or sooner; test stale, changed, and revoked rules and concurrent jobs using different policy versions.
- Enforce recognized crawl-delay and site-specific restrictions conservatively, documenting that crawl-delay is outside RFC 9309's standardized fields.
- Verify a robots allow never bypasses source authorization, terms, rights, or privacy denial.

### Pass criteria

Every fetch references the exact robots and site-policy decision used; ambiguous or unavailable policy fails closed.

## 5. Redaction and data minimization

- Use synthetic names, emails, phones, addresses, government-like identifiers, credentials, financial numbers, health details, precise coordinates, faces or OCR text, and combinations across HTML, JSON, documents, metadata, filenames, URLs, logs, and model output.
- Verify unnecessary fields are rejected before storage, not merely hidden in the UI.
- Test structured and free-text redaction, nested objects, arrays, mixed encodings, Unicode confusables, partial values, screenshots, OCR, and archive members.
- Verify raw values do not enter logs, traces, metrics labels, error messages, queues, dead-letter queues, caches, notifications, analytics, test snapshots, or exports.
- Verify salted hashes where enumeration is plausible and prove the salt is not stored with protected data.
- Test reviewer overrides, reason and expiry, downstream propagation, and reprocessing after policy changes.

### Pass criteria

Protected values appear only in explicitly approved restricted storage and never in default review, telemetry, or export surfaces.

## 6. Provenance and editorial integrity

- Verify source URL, canonical and final URL, timestamps, status, content hash, policy/robots/rights decisions, extraction method/version, limitations, and build identity are recorded.
- Re-fetch identical and changed synthetic content; confirm duplicate detection, new versions, and no silent overwrite.
- Tamper with raw objects, normalized records, event order, hashes, and manifests; integrity verification must detect each change.
- Test truncated, timed-out, partial, malformed, redirected, and unsupported responses; limitations must remain visible.
- Represent source claim, allegation, official finding, fact, analysis, hypothesis, inference, correction, and denial as distinct states.
- Test reposts, mirrored text, shared links, name collision, co-occurrence, and many repeated sources; the system must not convert frequency or association into proof.
- Verify derived records identify all inputs, method and version, confidence/uncertainty, and human review status.
- Test correction and takedown events without deleting audit accountability or presenting superseded content as current.

### Pass criteria

An authorized reviewer can reproduce each normalized or derived record's lineage and detect tampering or uncertainty.

## 7. Deletion, retention, export, and backup expiry

- Configure short synthetic retention windows and test expiry for raw, normalized, derived, annotation, audit, and export classes independently.
- Execute an approved deletion manifest and verify object versions, databases, search indexes, caches, queues, dead letters, derived records, annotations where applicable, exports, and local temp files.
- Verify backup copies become inaccessible through normal paths immediately and expire under the documented backup schedule; test restoration does not resurrect deleted data without replaying tombstones.
- Test partial failures, retries, idempotency, concurrent access, legal-hold conflict, revoked approval, and re-ingestion of a deleted source.
- Produce a deletion verification report listing system acknowledgements and unresolved items without deleted personal values.
- Verify export packages are minimized, approved, hashed, access-logged, expire automatically, and cannot use a stale approval after source correction or takedown.

### Pass criteria

Deletion completes or escalates visibly; no system silently reports success while a reachable copy remains.

## 8. CI and supply chain

- Secret scanning detects representative fake tokens, private keys, `.env`, cookies, and high-entropy fixtures before merge.
- SAST detects unsafe URL fetch, command interpolation, path traversal, weak randomness, insecure deserialization, and missing authorization patterns.
- SCA and container scans fail according to an approved severity and exploitability policy with time-bounded exceptions.
- Lockfile and artifact checks detect undeclared or changed dependencies; CI actions and base images are pinned.
- Generate and retain an SBOM and build provenance without credentials or private paths.
- Test that a missing scanner, failed update, or unsigned release artifact blocks the protected workflow.

## 9. Security review evidence

Before a gate is approved, store a non-sensitive review record containing:

- commit and artifact identifiers;
- test environment and synthetic fixture versions;
- passed, failed, skipped, and quarantined cases;
- open findings with severity, owner, deadline, and compensating control;
- reviewer and approval scope; and
- next review date.

Never use production or third-party source data as test evidence.
