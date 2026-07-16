# Concise Threat Model

Status: WORKING
System boundary: Phase 1 rights-aware public-source ingestion and provenance platform

## Security objectives

1. The crawler reaches only explicitly authorized public HTTP(S) resources.
2. Fetched content cannot reach internal services, credentials, the host filesystem, or the control plane.
3. Private or unnecessary personal data is not collected, retained, inferred, or published.
4. Every retained or derived record remains attributable to its source and processing history.
5. Only authorized people and service identities can approve scope, run jobs, view protected data, correct records, delete data, or export results.
6. Operators can stop all outbound work immediately and verify that it stopped.

## Protected assets

- project credentials, accounts, domains, repository, CI, and deployment metadata;
- source registry, crawl policy, rights decisions, retention rules, and approval records;
- raw captures, normalized records, derived analysis, annotations, exports, logs, and backups;
- provenance events, content hashes, correction and takedown records, and audit history;
- the privacy, safety, and reputation of people described in sources;
- the integrity and availability of the operator's device, cloud environment, and internal networks.

## Threat actors and failure sources

- malicious or compromised websites returning redirects, hostile documents, parser exploits, or oversized content;
- unauthorized users, compromised accounts, over-privileged insiders, and stolen service credentials;
- operators who accidentally exceed scope or mistake allegation for fact;
- malicious user input, crafted URLs, DNS rebinding, and poisoned source metadata;
- compromised dependencies, containers, CI actions, models, or build artifacts;
- configuration drift, retention failures, stale allowlists, and unavailable safety controls;
- legal demands, takedown requests, corrections, or rights conflicts mishandled by process gaps.

## Primary risks and required controls

| Risk | Example | Impact | Required preventive and detective controls |
|---|---|---|---|
| SSRF and network pivot | URL, DNS answer, or redirect reaches localhost, RFC 1918, link-local, IPv6 local, or cloud metadata | Credential theft and internal compromise | HTTP(S)-only parser; domain/path allowlist; A/AAAA validation at scheduling and connect time; egress proxy; blocked special-purpose ranges; IP pinning; redirect revalidation; no direct control-plane fetches |
| DNS rebinding and unsafe redirect | Approved hostname changes to an internal address or redirects to another authority | Allowlist bypass | Resolve through controlled resolver; reject if any answer is prohibited; connect to the validated address; re-resolve under bounded policy; disable automatic redirects; validate every hop; cap hops and authority changes |
| Command, parser, and file exploitation | Hostile HTML, media, archive, filename, or document triggers shell execution or path traversal | Worker or host compromise | No shell interpolation; safe APIs; random internal object keys; archive and decompression limits; separate ephemeral extractor sandbox; read-only root; patched parsers; content-type allowlist |
| Unauthorized crawling | Operator enters a private page, paywalled URL, login, or prohibited path | Legal, contractual, and privacy harm | Manually approved source registry; public-only scope; terms and rights review; robots policy; no cookies or auth; immutable approval record; preflight and per-request policy checks |
| Excessive load or block evasion | High concurrency, retries, or ignored `Retry-After` harms a source | Availability harm and IP blocking | Conservative per-origin/global token buckets; one scheduler; bounded retries; exponential backoff with jitter; crawl budget; site override only to become stricter; emergency stop |
| Sensitive-data overcollection | Page contains health, finance, precise location, credentials, or private messages | Harm to individuals and regulatory exposure | Data-minimization schema; source and field restrictions; quarantine; detection and redaction; metadata-only default; short retention; access review; deletion propagation |
| Broken access control | Analyst accesses raw evidence, changes source scope, or exports without authority | Data disclosure or unauthorized action | Strong authentication; server-side RBAC plus object-level policy; separate approval roles; short sessions; step-up auth for critical operations; audit every decision; deny by default |
| Provenance tampering | Record is edited without source history or a hash no longer matches | False conclusions and unverifiable evidence | Content hashing; append-only event ledger; immutable object versions where permitted; signed manifests; correction and deletion events; periodic integrity verification |
| Defamation or inference amplification | Reposts or co-occurrence become “proof” of identity, guilt, motive, or affiliation | Severe reputational and legal harm | Typed claim status; source-level attribution; duplicate/repost detection; uncertainty; corrections and denials; prohibited sensitive inference; mandatory human publication review |
| Copyright or rights misuse | Full article or licensed image retained based on an automated “fair use” label | Rights violation | Metadata/link/short-quote default; documented rights basis; manual review; per-object rights state; export enforcement; takedown process |
| Secret or identity exposure | Personal email, access token, cookie, or `.env` reaches Git or logs | Account compromise and unwanted attribution | Project-owned identities; secret manager/env injection; `.gitignore`; staged secret scanning; log filtering; private repository; rotation and incident runbook |
| Supply-chain compromise | Malicious dependency, CI action, container, or model artifact | Code execution or data theft | Lockfiles and hashes; minimal dependencies; trusted registries; signed artifacts where available; SBOM; SAST/SCA/secret/container scans; reviewed upgrades; pinned CI actions |
| Deletion failure | Data remains in indexes, caches, exports, or backups after approved deletion | Privacy and legal noncompliance | Data lineage; deletion orchestrator; tombstone event; downstream acknowledgements; backup expiry; deletion verification report; retry and escalation |
| Safety-control outage | Robots service, audit log, rate limiter, authz service, or emergency stop is unavailable | Unsafe or unaudited activity | Health gates; fail closed; durable stop flag checked before dequeue and fetch; circuit breakers; alerting; chaos tests; no offline bypass |
| Cross-project contamination | CivicLedger text, credentials, datasets, or accounts enter this project | Privacy, identity, integrity, and operational confusion | Separate repo/accounts/storage; source manifest; import review; project identifiers; no shared secrets; contamination stop condition |

## Misuse cases explicitly prohibited

- dossier building about private individuals;
- de-anonymization, face recognition, sensitive-trait inference, or location tracking;
- scraping private messages, accounts, leaked datasets, credentials, or data behind safeguards;
- automatically identifying a suspect or assigning guilt, intent, motive, or affiliation;
- vulnerability scanning, exploitation, CAPTCHA solving, block evasion, or proxy rotation to defeat controls;
- automated outreach, publication, distribution, or model training from crawled data.

## Trust assumptions to validate

- The approved source registry has a named human owner and expiry date.
- No crawler credential is needed because Phase 1 sources are public and unauthenticated.
- The network platform can enforce egress through a controlled proxy and block special-purpose ranges.
- Storage supports separate access policies and retention for raw, normalized, derived, annotation, audit, and export data.
- A project-owned security contact and incident decision-maker exist before network use.

If any assumption is false, update this model and repeat review before implementation or network access.
