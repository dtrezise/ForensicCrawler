# Threat Model

Status: WORKING

The detailed security threat model is maintained at [`docs/security/THREAT_MODEL.md`](docs/security/THREAT_MODEL.md), with the secure fetch design at [`docs/security/CRAWLER_ARCHITECTURE.md`](docs/security/CRAWLER_ARCHITECTURE.md).

## Product-specific priority risks

1. **SSRF and network pivot:** hostile URLs, DNS, redirects, or source content reach internal, local, metadata, or prohibited networks.
2. **Unauthorized collection:** operator error or automation expands beyond approved public scope, terms, robots, rights, purpose, or retention.
3. **Hostile media and documents:** parser exploits, decompression bombs, active content, filenames, or transformations escape a worker.
4. **Broken custody:** bytes, locators, transformations, or revision history change without detectable provenance.
5. **False certainty:** source count, AI output, or visual realism becomes a truth, identity, motive, guilt, or admissibility claim.
6. **Sensitive-data harm:** private, biometric, location, confidential-source, or expert data is collected or exported without need and authority.
7. **Rights misuse:** a fair-use flag or government host is treated as blanket permission to retain or redistribute.
8. **Access-control failure:** a user or workload views raw/restricted records, changes scope, or exports outside its role and purpose.
9. **Cross-project contamination:** CivicLedger, TDS, or other project data, credentials, identity, or editorial stance enters this system.
10. **Supply-chain compromise:** dependencies, CI actions, containers, parsers, or model artifacts execute malicious code or leak data.

## Current local-slice exposure

The runnable Phase 1 slice performs no crawler network requests and retains no remote source bodies. Its principal current risks are dependency supply chain, unsafe local file import, schema/reference defects, misleading display, accidental export of restricted fields, and loss of deterministic history. The test and audit tools target those risks while network controls remain architecture and test specifications only.

## Stop conditions

Stop work when canonical scope, authorization, rights, robots, terms, network destination, evidence lineage, audit service, emergency stop, or sensitive-data handling is ambiguous. Do not continue on a permissive fallback.
