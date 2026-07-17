# Forensic Crawler Security and Privacy Policy

Status: WORKING - LOCAL IMPLEMENTATION AND CASE-BOUNDED MANUAL PUBLIC RESEARCH APPROVED; CRAWLER NETWORK USE AND DEPLOYMENT NOT APPROVED
Last reviewed: 2026-07-17

This policy is mandatory for Forensic Crawler. It applies to source code, infrastructure, crawler jobs, data, analysis, exports, accounts, vendors, and human workflows. The user's 2026-07-16 launch request authorizes reversible local implementation with synthetic or reviewed metadata-only fixtures. The 2026-07-17 case requests additionally authorize lawful manual research of public sources and private, project-authored schematic reconstructions of the Charlie Kirk assassination and Renee Good killing. Live crawler execution, authenticated or paid access, raw third-party body retention, deployment, publication, external accounts, and outreach remain blocked until separately reviewed and explicitly approved.

## Reporting a security or privacy issue

Do not disclose vulnerabilities, credentials, personal data, or private evidence in a public issue or public repository. Use a project-owned private reporting channel designated before launch. Until that channel exists, stop the affected activity, preserve minimal non-sensitive evidence, and notify the authorized project owner privately without copying secrets into chat, tickets, logs, or commits.

## Repository and identity security

- Keep the GitHub repository private during development.
- Never add public GitHub, Pages, source-code, deployment, preview, or artifact links to the product.
- Keep Forensic Crawler operationally separate from TDS, Handprint, Civic Ledger, Gas Prices, and Jesus Sheeple. Do not share repositories, deployments, credentials, domains, analytics, storage, databases, accounts, or public metadata.
- Never expose personal identity, private contact information, a home address, private email, or personal accounts in public metadata.
- Use project-owned domains, emails, credentials, and platform accounts.
- Never commit secrets, tokens, passwords, private keys, cookies, session data, `.env` files, database credentials, scraped datasets, raw captures, or private research notes.
- Keep secret and data patterns in `.gitignore`; treat ignore rules as defense in depth, not permission to store sensitive material in the worktree.
- Require environment variables or a managed secret store for every credential. Do not place secrets in client code, images, tests, examples, logs, build arguments, or CI output.
- Enable least-privilege access, strong authentication, and multi-factor authentication on project accounts where available.

## Crawler safety and authorization

- Crawl only public resources that the operator is authorized to access and that are in an explicitly approved domain and path scope.
- Respect `robots.txt`, published terms, applicable law, rate limits, `Retry-After`, crawl-delay directives, and site-specific restrictions where technically possible. A rights or terms review can be stricter than robots rules.
- Never bypass authentication, paywalls, CAPTCHAs, access controls, robots restrictions, IP blocks, bot protections, or technical safeguards.
- Never exploit vulnerabilities or attempt unauthorized access.
- Do not collect private pages, account data, leaked credentials, private messages, health data, financial account data, precise location data, or unnecessary personal information.
- Do not infer identity, motive, criminality, affiliation, or sensitive traits from scraped material.
- Treat allegations as allegations and preserve source attribution, retrieval date, publication date when known, context, corrections, denials, and uncertainty.
- Provide a clear project-owned user-agent identity and contact route when appropriate. Do not use a personal identity or personal contact route.
- Enforce conservative per-origin and global concurrency, token-bucket rate limits, exponential backoff with jitter, request timeouts, maximum response sizes, content-type limits, domain and path allowlists, bounded job budgets, and a global emergency stop.
- Prevent SSRF, DNS rebinding, localhost access, private-network access, cloud metadata access, file URL access, arbitrary protocol access, command injection, path traversal, unsafe redirects, decompression bombs, and parser escape.
- Validate and normalize every URL before scheduling and immediately before every network connection, including every redirect target and resolved IPv4 or IPv6 address.
- Restrict crawler and extractor workers to separate, ephemeral sandboxes with least privilege, read-only base filesystems, no shell, no unnecessary filesystem access, no reusable credentials, and only narrowly controlled network egress.

## Data governance

- Collect the minimum data necessary for the explicitly stated and approved research task.
- Separate raw captures, normalized records, derived analysis, and user annotations by storage location, access policy, retention rule, and identifier.
- Record source URL, canonical URL, retrieval timestamp, publication timestamp when known, HTTP status, response headers needed for provenance, content hash, extraction method and version, rights status, scope decision, robots decision, and applicable limitations.
- Preserve provenance. Never silently overwrite source material, normalized records, corrections, denials, annotations, or analytical conclusions. Record supersession and deletion events.
- Make retention periods configurable. Default to not retaining response bodies unless the source and rights policy explicitly permits capture, and delete unnecessary raw content promptly.
- Provide documented deletion, export, correction, takedown, and access-review procedures. Propagate approved deletion across replicas, indexes, caches, exports, and backups subject to a documented backup expiry.
- Redact or irreversibly hash personal data when full values are unnecessary. Salt hashes when values could otherwise be enumerated.
- Never publish scraped content, personal data, raw captures, or private analysis by default.
- Respect copyright. Store links, metadata, content hashes, and short quotations unless a documented rights basis permits more. A possible fair-use rationale is a review flag, not automatic authorization to archive or publish.
- Do not train models or create public datasets from crawled material without explicit authorization and a documented rights and privacy review.
- Encrypt protected data in transit and at rest. Keep encryption keys separate from encrypted data and rotate them under the credential policy.

## Application security

- Use secure defaults, deny-by-default permissions, and server-side policy enforcement.
- Separate development, staging, and production accounts, networks, secrets, data, storage, and logs. Do not copy production or sensitive research data into development.
- Keep credentials and private data server-side.
- Validate all user and source input; encode or escape output for its destination context. Treat HTML, media, documents, metadata, archives, and model output as untrusted.
- Require authenticated access for every private feature.
- Apply authorization checks to every sensitive operation and object, including job creation, scope approval, raw-data access, correction, deletion, export, and administration.
- Log security-relevant events without logging secrets, raw response bodies, authentication material, or unnecessary personal data.
- Protect logs and backups with encryption, least-privilege access, integrity controls, retention limits, and tested restoration and deletion procedures.
- Add dependency, lockfile, secret, static-analysis, infrastructure, container, license, and vulnerability checks to CI before product code is merged.
- Pin or lock dependencies, verify artifact sources and integrity where supported, and review upgrades.
- Write automated tests for SSRF prevention, DNS rebinding, redirects, rate limits, robots handling, authorization, data deletion, redaction, provenance, and emergency shutdown.
- Perform security review before enabling a new source type, protocol, parser, export path, model integration, account integration, or outbound communication channel.

## Editorial and legal safeguards

- The crawler reports what sources contain; it does not establish truth by repetition.
- Never convert a search result, shared link, repost, co-occurrence, or association into proof of authorship, identity, affiliation, motive, criminality, or misconduct.
- Preserve exact procedural status and distinguish fact, allegation, official finding, source claim, analysis, hypothesis, and inference in both data and presentation.
- Require human review before any public publication, automated distribution, external export, or high-impact decision support.
- Require explicit approval before contacting people, scraping private data, sending messages, initiating outreach, or adding authenticated sources.
- Maintain a visible correction and takedown process with intake, identity and authority checks, review, disposition, propagation, and an auditable response record.
- Do not describe the system or its output as court-admissible, certified, verified, or legal-grade without independent, documented validation and approval.
- Obtain qualified legal review for copyright, privacy, defamation, records retention, biometric or location data, and jurisdiction-specific crawling obligations before relevant features or sources are enabled.

## Credential rotation and breach response

### Rotation baseline

- Inventory each credential by owner, purpose, environment, privilege, creation date, last rotation, expiry, and dependent service without recording the secret value.
- Prefer short-lived, scoped workload identities over long-lived keys.
- Rotate immediately after suspected exposure, staff or vendor access changes, privilege changes, environment cloning, or a security incident. Otherwise follow the service's risk-based expiry policy.
- Revoke the old credential before or immediately after validating the replacement. Test dependent services and record the rotation event without the value.

### Incident sequence

1. Stop affected crawler jobs and activate the global emergency stop when network or data risk exists.
2. Contain affected identities, hosts, queues, storage, sessions, and exports; revoke and rotate credentials.
3. Preserve minimal, access-controlled forensic evidence and an incident timeline without copying sensitive content into public systems.
4. Determine affected sources, people, records, customers, environments, backups, and downstream exports.
5. Eradicate the cause, patch, validate controls, and restore from known-good artifacts.
6. Complete required legal, contractual, user, and regulator notifications through approved project-owned channels.
7. Document lessons, corrective actions, owners, deadlines, and verification tests before resuming activity.

## Required review artifacts

- [Security foundation index](docs/security/README.md)
- [Threat model](docs/security/THREAT_MODEL.md)
- [Data flow, permissions, and trust boundaries](docs/security/DATA_FLOW_AND_TRUST_BOUNDARIES.md)
- [Secure crawler architecture](docs/security/CRAWLER_ARCHITECTURE.md)
- [Launch-blocker checklist](docs/security/LAUNCH_BLOCKERS.md)
- [Proposed directory structure](docs/security/PROPOSED_STRUCTURE.md)
- [Security test plan](docs/security/TEST_PLAN.md)

## Standards baseline

- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [IETF RFC 9309 - Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html)
- [NIST SP 800-218 - Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
