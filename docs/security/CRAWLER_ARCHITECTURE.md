# Secure Crawler Architecture

Status: WORKING - DESIGN ONLY

## Architectural scope

Phase 1 accepts a human-approved research manifest and retrieves only authorized public HTTP(S) resources from a curated registry. It produces private, source-linked records for human review. It does not search the open web, authenticate to sources, defeat controls, contact people, publish, train models, or perform 3D reconstruction.

## Component model

### Private control plane

1. **Identity and authorization gateway** - authenticates users and service identities; enforces role, object, environment, and purpose restrictions.
2. **Source registry** - versions approved origins, paths, source owner, authorization basis, rights posture, robots policy, terms review, allowed media types, rate budget, retention, contact route, approval, and expiry.
3. **Research manifest service** - binds a stated task to approved sources, query terms, time window, data fields, maximum pages/bytes/time, retention, and named requester/approver.
4. **URL policy engine** - canonicalizes URLs, validates origin/path/port, resolves addresses, rejects prohibited destinations, and emits a signed allow or deny decision.
5. **Robots and site-policy service** - obtains and parses `robots.txt`, caches it conservatively, applies site-specific restrictions, and fails closed when policy cannot be established.
6. **Scheduler and budget service** - owns per-origin/global rate limits, crawl budgets, exponential backoff, `Retry-After`, timeouts, and job leases.
7. **Emergency-stop service** - provides a durable global stop plus environment, source, and job kill switches. Scheduler and workers check it independently.

### Isolated fetch plane

1. **Ephemeral crawler worker** - handles one bounded lease with no user credentials, shell, persistent disk, or direct access to protected databases.
2. **Controlled DNS resolver** - returns all A and AAAA answers through approved resolvers and makes resolution observable.
3. **Egress proxy** - permits only validated HTTP(S) connections to approved origins and ports; blocks special-purpose networks and direct internet bypass.
4. **Response gate** - streams into quarantine while enforcing time, byte, decompression, redirect, status, and content-type limits and computing a cryptographic hash.

### Isolated processing and data plane

1. **Extractor sandbox** - networkless, ephemeral parser for one quarantined object; read-only input; strict CPU, memory, process, and output limits.
2. **Raw object store** - optional, restricted, encrypted, immutable-by-version capture store with short retention only when policy and rights permit.
3. **Normalized database** - minimized source metadata and extracted fields.
4. **Derived and annotation stores** - separate machine analysis from human notes and keep both distinct from source facts.
5. **Provenance ledger** - append-only events for approvals, fetches, hashes, transformations, corrections, denials, exports, retention, and deletion.
6. **Redaction and deletion services** - apply field policy and trace changes across stores, indexes, caches, exports, and backups.
7. **Private review and export gate** - source-linked review with no public output; any external export requires separate human rights, privacy, editorial, and authorization approval.

## URL admission algorithm

Run the complete policy before scheduling, again immediately before connection, and for every redirect.

1. Parse with a standards-compliant URL library; reject malformed or ambiguous input.
2. Permit only `https` by default and `http` only by explicit source policy. Reject `file`, `ftp`, `gopher`, `data`, `javascript`, `blob`, `dict`, local paths, UNC paths, and every unrecognized scheme.
3. Reject embedded credentials, empty hosts, fragments in fetch keys, non-canonical ports, excessive URL length, and control characters.
4. Normalize case, dot segments, percent encoding, trailing dots, Internationalized Domain Names, and the effective port. Preserve the original submitted value for audit.
5. Compare the canonical origin and path to a versioned allowlist. Subdomain wildcards are forbidden by default.
6. Resolve all IPv4 and IPv6 answers with the controlled resolver. Reject the request if any answer is loopback, private, link-local, multicast, carrier-grade NAT, documentation, benchmarking, unspecified, reserved, or otherwise special-purpose. Explicitly block cloud metadata names and addresses.
7. Bind the connection to a validated address through the egress proxy while retaining correct TLS Server Name Indication and `Host`. Recheck policy on re-resolution and reject mixed safe/unsafe answer sets.
8. Disable automatic redirects. For each allowed redirect, repeat steps 1-7, require source-registry permission for an authority change, detect loops, and enforce a small hop cap.
9. Send a project-owned user agent when approved. Send no cookies, authorization headers, client certificates, referer from a private context, or unrelated tracking identifiers.
10. Stream the response through time, byte, status, MIME, and decompression limits. Do not render active content in the fetch worker.

An allowlist is the primary control; network blocks are defense in depth. A denylist alone is not sufficient.

## Robots, terms, and rights decision

- Use RFC 9309 parsing and user-agent matching. Apply the most specific matching rule.
- If robots retrieval succeeds, follow the parseable rules.
- If robots is unreachable due to network or server failure, treat the origin as disallowed for this system. Do not use the RFC's long-duration fallback without a fresh human review.
- Refresh cached robots data at least every 24 hours and sooner when cache headers or source policy require it.
- Treat crawl-delay and other recognized site-specific directives as enforceable restrictions even when not standardized by RFC 9309.
- Published terms, an explicit source restriction, the rights policy, or a legal review can deny a URL that robots would allow.
- Robots permission is not authorization, a license, or a privacy determination.
- Default rights outcomes:

| Rights state | Fetch body | Retain body | Normalize metadata | Export content |
|---|---:|---:|---:|---:|
| Documented public domain or compatible license | policy-approved | permitted by retention rule | yes | only within license and approval |
| Documented operator license | policy-approved | within license | yes | within license and approval |
| Fair-use candidate | minimal review fetch only if approved | no by default | link, hash, metadata, short quotation | no without documented review |
| Licensed third-party source without project license | metadata endpoint only if authorized | no | link and metadata | no |
| Unknown or disputed | no body by default | no | public link and review status only | no |
| Prohibited, private, or access-controlled | no | no | denial event only | no |

## Scheduling and source protection

- One central scheduler owns all per-origin and global budgets; workers cannot create more work directly.
- Start with one request at a time per origin and a conservative delay. Any increase requires documented source-specific review and measured evidence.
- Honor `Retry-After`; use exponential backoff with jitter for transient failures; do not retry permanent denials or access-control responses.
- Bound depth, discovered URLs, requests, bytes, wall time, redirects, errors, and retries per job.
- Do not rotate identities, proxies, headers, or addresses to evade blocking or rate limits.
- Discovery never equals approval. Every discovered URL re-enters the policy engine.

## Provenance event minimum

Each attempted retrieval records:

- research manifest and immutable policy version;
- requested, canonical, and final URL;
- source-registry entry and approval expiry;
- robots snapshot hash and decision;
- DNS answers considered and an appropriately minimized network-policy result;
- request start/end, status, redirect chain, byte count, and response MIME;
- content hash when a body is accepted;
- retention and rights state;
- worker and extractor build identifiers;
- extraction method/version and input/output hashes;
- error, truncation, limitation, correction, denial, and deletion events.

Do not record credentials, cookies, full private headers, raw bodies, unnecessary query secrets, or personal data in the audit log.

## Emergency stop

The stop must be independent of the normal UI and available to an authorized security administrator. Activating it must:

1. prevent new job creation and queue leasing;
2. cause active workers to stop before the next connection and abort active downloads safely;
3. block egress at the proxy or network-policy layer;
4. preserve minimal state needed to explain what stopped;
5. invalidate unapproved export staging; and
6. alert the authorized incident channel.

Network enforcement is the final backstop if application checks fail.

## Deployment and supply-chain baseline

- Separate development, staging, and production accounts and networks. Development uses synthetic data and local mock origins.
- Build minimal non-root images with read-only roots, dropped capabilities, resource limits, and verified provenance.
- Pin dependencies and CI actions; generate an SBOM; scan source, dependencies, secrets, licenses, infrastructure, and images.
- Sign release artifacts where supported and deploy from CI, not a developer workstation.
- Keep protected data and credentials out of builds, frontend bundles, telemetry, crash reports, and model prompts.
- Require threat-model review for any new protocol, parser, source class, model, integration, export, or contact channel.

## Deferred components

Timeline visualization can be designed after the ingestion boundary is approved. 3D reconstruction, mobile sensor capture, VR/AR, ballistic or identity analysis, automated contradiction claims, and public or legal exports require separate threat models and approval.
