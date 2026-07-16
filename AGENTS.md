# Forensic Crawler Agent Rules

Status: WORKING - LOCAL PHASE 0/1 IMPLEMENTATION AUTHORIZED; NETWORK AND EXTERNAL ACTIONS BLOCKED

These instructions apply to every human or automated agent operating in this repository. Read [`SECURITY.md`](SECURITY.md) and [`docs/security/README.md`](docs/security/README.md) before making substantive changes. If a request conflicts with these rules, stop and request explicit direction; never weaken a safety control silently.

## Work gate

- The user's 2026-07-16 launch request authorizes reversible local Phase 0/1 implementation against reviewed, metadata-only fixtures. It does not approve live crawling, external accounts, outreach, deployment, publication, or push.
- Do not crawl live targets, create external accounts, contact sites or people, publish, deploy, open repository visibility, add public links, or push without explicit approval.
- Preserve existing work. Never reset, delete, rewrite history, discard user changes, or replace artifacts without authorization.
- Treat all design artifacts as `WORKING` until the user explicitly approves or locks them.
- Use synthetic local fixtures or specifically reviewed metadata-only public-record pilot fixtures. Do not retain third-party source bodies unless separately approved.

## Routing and repository verification

- Apply the routing governance inherited from `~/.codex/AGENTS.md` before substantive work. Load repository `MODEL_ROUTING.md` and `.ai-routing.local.yaml` if they later appear; their absence does not disable global routing.
- Verify the canonical Git root before file work. Inspect branch, status, remotes, and relevant instructions; do not infer GitHub visibility from a local directory name.
- Keep planned routing separate from verified host execution in any routing receipt. Do not hard-code replaceable model or product-posture labels into repository policy.

## Repository and identity security

- Keep the GitHub repository private during development.
- Never add public GitHub, Pages, source-code, deployment, preview, or artifact links to the product.
- Keep Forensic Crawler operationally separate from TDS, Handprint, Civic Ledger, Gas Prices, and Jesus Sheeple. Do not reuse their repositories, accounts, domains, deployments, credentials, storage, databases, analytics, datasets, or public metadata.
- Never expose personal identity, private contact information, a home address, private email, or personal accounts in public metadata.
- Use project-owned domains, emails, credentials, and platform accounts.
- Never commit secrets, tokens, passwords, private keys, cookies, session data, `.env` files, database credentials, scraped datasets, raw captures, or private research notes.
- Maintain appropriate secret and data exclusions in `.gitignore`. Before staging, inspect staged content and run secret checks.
- Require environment variables or a managed secret store for every credential. Never print secrets to logs or tool output.
- Document and test credential rotation and breach response under `SECURITY.md`.

## Crawler safety and authorization

- Crawl only public resources that the operator is authorized to access and that match an explicitly approved domain and path allowlist.
- Respect `robots.txt`, published terms, applicable law, rate limits, `Retry-After`, crawl-delay directives, and site-specific restrictions where technically possible.
- Never bypass authentication, paywalls, CAPTCHAs, access controls, robots restrictions, IP blocks, bot protections, or technical safeguards.
- Never exploit vulnerabilities or attempt unauthorized access.
- Do not collect private pages, account data, leaked credentials, private messages, health data, financial account data, precise location data, or unnecessary personal information.
- Do not infer identity, motive, criminality, affiliation, or sensitive traits from scraped material.
- Treat allegations as allegations and preserve source attribution, retrieval date, publication date when known, context, corrections, denials, and uncertainty.
- Use a clear project-owned user-agent identity and contact route when appropriate; do not use personal identity or contact details.
- Implement conservative per-origin and global concurrency, exponential backoff with jitter, request timeouts, maximum response sizes, domain and path allowlists, job budgets, and a global emergency stop.
- Prevent SSRF, DNS rebinding, localhost access, private-network access, cloud metadata access, file URL access, arbitrary protocols, command injection, path traversal, unsafe redirects, decompression bombs, and parser escape.
- Validate and normalize every URL before scheduling and immediately before every connection, including redirects and all resolved IPv4 and IPv6 addresses.
- Run crawler and extractor workers in separate, ephemeral, least-privilege sandboxes with no unnecessary filesystem, network, shell, or credential access.

## Data governance

- Collect the minimum data necessary for the approved research task.
- Separate raw captures, normalized records, derived analysis, and user annotations by storage, permissions, retention, and identifiers.
- Record source URL, canonical URL, retrieval timestamp, publication timestamp when known, HTTP status, content hash, extraction method and version, rights status, scope and robots decisions, and applicable limitations.
- Preserve provenance. Never silently overwrite source material or analysis; record supersession, correction, denial, redaction, and deletion events.
- Make retention configurable. Default to no raw-body retention unless rights and source policy explicitly permit it, and delete unnecessary content promptly.
- Provide deletion, export, correction, takedown, and access-review procedures that cover replicas, indexes, caches, exports, and backups.
- Redact or salt-hash personal data when full values are unnecessary.
- Never publish scraped content, personal data, raw captures, or private analysis by default.
- Respect copyright. Store links, metadata, hashes, and short quotations unless a documented rights basis permits more. Treat fair use as a review question, not an automatic archive decision.
- Do not train models or create public datasets from crawled material without explicit authorization and rights review.

## Application security

- Use secure defaults, deny-by-default permissions, and server-side enforcement.
- Separate development, staging, and production accounts, networks, secrets, data, storage, and logs.
- Keep credentials and private data server-side.
- Validate all user and source input and encode output for its destination. Treat fetched content, files, metadata, and model output as hostile.
- Require authenticated access for private features and authorization checks for every sensitive operation and object.
- Log security events without secrets, authentication material, raw response bodies, or unnecessary personal data.
- Encrypt and access-control logs and backups; apply retention, restoration, integrity, and deletion testing.
- Add dependency, lockfile, secret, static-analysis, infrastructure, container, license, and vulnerability checks to CI.
- Pin or lock dependencies and review upgrades.
- Test SSRF and DNS defenses, redirects, rate limits, robots handling, authorization, deletion, redaction, provenance, and emergency shutdown before network use.

## Editorial and legal safeguards

- The crawler reports what sources contain; repetition does not establish truth.
- Never convert a search result, link, repost, co-occurrence, or association into proof of authorship, identity, affiliation, motive, criminality, or misconduct.
- Preserve exact procedural status and distinguish fact, allegation, official finding, source claim, analysis, hypothesis, and inference.
- Require human review before public publication, automated distribution, external export, or high-impact decision support.
- Require explicit approval before contacting people, scraping private data, sending messages, initiating outreach, or adding authenticated sources.
- Maintain a correction and takedown process.
- Do not claim court admissibility, certification, verification, or legal-grade output without independent documented validation and approval.

## Stop conditions

Stop the affected work immediately if:

- canonical repository or authorization is unclear;
- a requested target is not explicitly allowlisted;
- robots, terms, rights, or legal status is ambiguous;
- a URL resolves to a prohibited network range or changes resolution unexpectedly;
- the emergency stop, rate limiter, provenance log, or authorization layer is unavailable;
- sensitive data, secrets, unsafe content, or cross-project contamination is detected;
- a requested action would publish, deploy, push, contact, or create an external account without explicit approval.

Record the reason without including sensitive content, preserve existing state, and request review.
