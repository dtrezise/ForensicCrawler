# Apollo 11 landing-time reconciliation

## First-pass forensic briefing and technical audit

**Status:** WORKING private working analysis

**Research cutoff:** 2026-07-16T20:30:00Z

**Package:** `fc_pkg_b3f890b4-9a89-45b8-8101-35e42297bfe6`

**Schema:** 2.0.0

**Package revision:** 1

> This source-linked working analysis is not a finding of guilt, certification, court-admissibility opinion, metric-reconstruction validation, or public-release approval.

## Executive summary

### Established within this package

- Two official NASA records report that Eagle landed on the lunar surface; their exact recorded mission elapsed times differ by 3.1 seconds. [S001 - Landing occurrence] [S002 - Landing occurrence]
- The Apollo 11 Mission Report records landing on the surface at mission elapsed time 102:45:39.9. [S001 - 102:45:39.9]
- NASA's Record of Lunar Events lists lunar landing at mission elapsed time 102:45:43 and 20:17:43 GMT on July 20, 1969. [S002 - 102:45:43 / 20:17:43 GMT]
- NASA's Record of Lunar Events lists Armstrong on the lunar surface at mission elapsed time 109:24:15 and 02:56:15 GMT on July 21, 1969. [S002 - 109:24:15 / 02:56:15 GMT]

### Attributed claims

- No separately attributed claims are recorded.

### Disputed or unresolved

- **Touchdown mission-time discrepancy:** The mission report lists 102:45:39.9 while the event record lists 102:45:43. The records differ by 3.1 seconds but agree that the landing occurred.

### Unknown and next evidence

- Which timing and clock-reference conventions explain the 3.1-second difference between the two official records?

## Scope and methodology

Demonstrate provenance, exact locators, temporal uncertainty, rights review, contradiction handling, and deterministic export using metadata-only official records.

- Apollo 11 lunar landing timing
- official NASA records only
- metadata and restrained quotation only
- no source-body retention

**Inclusion rule:** Public records and specifically reviewed metadata-only fixtures relevant to the defined investigation scope.

**Exclusion rule:** No crawler execution, authenticated access, raw third-party body retention, publication, or unsupported identity, guilt, trajectory, or metric inference.

**Source hierarchy:**

1. preserved primary evidence
2. official record
3. independent reporting
4. attributed analysis
5. unresolved assertion

## Chronology

### 01 - Lunar Module landing

**Source time:** 102:45:39.9 / 102:45:43 / 20:17:43 GMT 20 July 1969

Official NASA records agree that Eagle landed but list mission elapsed times that differ by 3.1 seconds.

### 02 - Armstrong on the lunar surface

**Source time:** 109:24:15 / 02:56:15 GMT 21 July 1969

NASA's Record of Lunar Events lists Armstrong on the lunar surface at 109:24:15 mission elapsed time and 02:56:15 GMT on July 21, 1969.

## Findings and claim ledger

| Claim | State | Confidence | Current proposition | Evidence citations |
|---|---|---|---|---|
| CLM-001 | authenticated official record | high | Two official NASA records report that Eagle landed on the lunar surface; their exact recorded mission elapsed times differ by 3.1 seconds. | [S001 - Landing occurrence] [S002 - Landing occurrence] |
| CLM-002 | authenticated official record | moderate | The Apollo 11 Mission Report records landing on the surface at mission elapsed time 102:45:39.9. | [S001 - 102:45:39.9] |
| CLM-003 | authenticated official record | moderate | NASA's Record of Lunar Events lists lunar landing at mission elapsed time 102:45:43 and 20:17:43 GMT on July 20, 1969. | [S002 - 102:45:43 / 20:17:43 GMT] |
| CLM-004 | authenticated official record | moderate | NASA's Record of Lunar Events lists Armstrong on the lunar surface at mission elapsed time 109:24:15 and 02:56:15 GMT on July 21, 1969. | [S002 - 109:24:15 / 02:56:15 GMT] |

## Contradictions and correction status

### Touchdown mission-time discrepancy

The mission report lists 102:45:39.9 while the event record lists 102:45:43. The records differ by 3.1 seconds but agree that the landing occurred.

**Status:** open; **review:** working.

- Retained hypothesis: Different definitions of first surface contact versus recorded landing event
- Retained hypothesis: Clock-source or synchronization differences
- Retained hypothesis: Later administrative rounding or transcription
- Retained hypothesis: A reporting convention not yet documented in the reviewed locators

### Correction ledger

No correction record is currently active. Superseded claim revisions remain preserved in the package.

## Spatial reconstruction and measurement gate

The package includes a project-authored schematic reconstruction. Measurement remains disabled unless a spatial artifact is separately marked metric-validated.

| Artifact | Type | Frame | Metric validated | Measurement | Validation |
|---|---|---|---|---|---|
| Touchdown time comparison marker | schematic_scene | LOCAL_UNITLESS | no | disabled | not_metric |

## Package integrity

- Structural validation: **passed_v2_audit**.
- Evidentiary authentication: **limited_metadata_only**.
- Claim confidence coverage: **complete**.
- Claim locator coverage: **complete**.
- Source bodies preserved: **0** of **3**.
- Audit events: **5**, hash-linked.
- Signature state: **unsigned_local_working_package**.

- Warning: Internal consistency does not authenticate remote source content.
- Warning: Human and tool actor identities are not cryptographically authenticated.

## Claim-to-source matrix

| Claim | Source | Function | Locator | Independence / family |
|---|---|---|---|---|
| CLM-001 | S001 | supports | 5.4 Landing Dynamics | Same agency as the second record and potentially derived from shared mission data; not counted as fully independent corroboration. |
| CLM-001 | S002 | supports | Lunar Landing Time | Same agency and event; useful corroborating record but not presumed independent of mission telemetry or reporting workflow. |
| CLM-002 | S001 | establishes_time | 5.4 Landing Dynamics | Direct attribution to this source only. |
| CLM-003 | S002 | establishes_time | Lunar Landing Time | Direct attribution to this source only. |
| CLM-004 | S002 | establishes_time | Armstrong on Lunar Surface | Direct attribution to this source only. |

## Bibliography and preservation registry

- **S001. Apollo 11 Mission Report.** National Aeronautics and Space Administration. Published 1969-11; checked 2026-07-16T20:00:00Z. https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf Locator: section: 5.4 Landing Dynamics; page: Report page 5-14. Preservation: metadata_only; metadata fingerprint: 23ea92e71181e92a182aa1be8a9b646e1fc18149ee25685f3ce2ff6e49f1dfb8.
- **S002. Apollo 11 Record of Lunar Events.** National Aeronautics and Space Administration. Published 1969-07-24; checked 2026-07-16T20:00:00Z. https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/ap11events.html Locator: row: Lunar Landing Time; row: Armstrong on Lunar Surface. Preservation: metadata_only; metadata fingerprint: fa53b2ca5e6e1a1a06de30f08099485baea301a0ab52c2ed5456ad84c0e71e4b.
- **S003. NASA Images and Media Usage Guidelines.** National Aeronautics and Space Administration. Published date unresolved; checked 2026-07-16T20:00:00Z. https://www.nasa.gov/nasa-brand-center/images-and-media/ Locator: section: NASA Images and Media Usage Guidelines. Preservation: metadata_only; metadata fingerprint: 0299cbae0aa26eede3ee0e2f018ea2a216b40c0133e1fbb2eb79e1d627bafe92.

## Rights, privacy, and dignity

- **fc_src_00000000-0000-4000-8000-000000000001:** link_only; restrained_excerpt. Official NASA report used as metadata and locator. No PDF bytes are committed. NASA media guidance and item-specific third-party exceptions remain applicable.
- **fc_src_00000000-0000-4000-8000-000000000002:** metadata_only; restrained_excerpt. Official NASA event metadata and restrained factual transcription only; no remote page body retained.
- **fc_src_00000000-0000-4000-8000-000000000003:** metadata_only; metadata_only. Policy locator retained to document that NASA logos, identifiers, third-party works, and identifiable-person uses require separate treatment.
- **fc_ast_00000000-0000-4000-8000-000000000001:** permitted_bytes; project_bytes. Locally authored metadata comparison with source attribution; no copied NASA source body or media.

## Review record

### rights review

- Finding: Metadata and restrained factual excerpts are sufficient for the pilot.
- Finding: No NASA PDF, image, audio, video, logo, or insignia is stored.
- Finding: NASA third-party and identifiable-person exceptions remain item-specific.
- Limitation: This is a working compliance review, not qualified legal advice.

### editorial review

- Finding: The records agree that landing occurred and differ on the recorded mission elapsed second.
- Finding: The discrepancy is not evidence of misconduct or falsification.
- Finding: Alternate clock and reporting explanations remain unresolved.
- Limitation: No underlying mission clock or telemetry methodology was independently reconstructed.

### forensic review

- Finding: The arithmetic difference is 3.1 seconds.
- Finding: Displayed precision is recorded separately from accuracy.
- Finding: The 2D marker is illustrative and exposes both inputs.
- Limitation: No claim is made about the physically exact moment of first contact.

## Version and change history

- Revision 1, 2026-07-16T20:30:00Z: Upgraded to the v2 provenance, confidence, integrity, reporting, and spatial-artifact contract.

## Glossary

- **Established:** Supported within the package by the strongest available source state; not a universal or judicial finding.
- **Attributed:** A proposition presented as a named source's claim rather than adopted as fact.
- **Metadata-only:** The source link and descriptive record are retained without the remote response body.
- **Schematic:** A relational visual model that is not metric, geodetic, ballistic, or photogrammetric.

---

No raw third-party article body, graphic impact media, private address, court-restricted exhibit, or unsupported identity inference is included in this export.
